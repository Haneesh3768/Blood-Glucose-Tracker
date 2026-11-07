import { describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createApp } from "../../app.js";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";

describe("Phase 1: Authentication & PostgreSQL Database Integration", () => {
  const app = createApp();
  const uniqueId = Date.now();
  const testUser = {
    name: "Alex Rivera",
    email: `alex_${uniqueId}@sweety.app`,
    password: "SecurePassword123!",
  };

  let primaryAccessToken: string;
  let primaryRefreshTokenCookie: string;
  let primaryRawRefreshToken: string;
  let userId: string;

  // 1. Registration
  it("registers a new user with normalized email, returns 201 and sets HTTP-only cookie", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: testUser.name,
        email: testUser.email.toUpperCase(), // Test normalization
        password: testUser.password,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user).not.toHaveProperty("passwordHash");

    userId = res.body.data.user.id;
    primaryAccessToken = res.body.data.accessToken;

    // Check HTTP-only cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    primaryRefreshTokenCookie = (cookies as unknown as string[]).find((c) =>
      c.startsWith(`${env.REFRESH_COOKIE_NAME}=`)
    )!;
    expect(primaryRefreshTokenCookie).toBeDefined();
    expect(primaryRefreshTokenCookie).toContain("HttpOnly");

    // Extract raw token value
    const match = primaryRefreshTokenCookie.match(
      new RegExp(`${env.REFRESH_COOKIE_NAME}=([^;]+)`)
    );
    primaryRawRefreshToken = match ? match[1]! : "";
    expect(primaryRawRefreshToken).toBeTruthy();
  });

  // 2. Duplicate Email Prevention
  it("prevents duplicate registration with normalized email conflict", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Duplicate User",
        email: testUser.email.toLowerCase(),
        password: testUser.password,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("An account with this email address already exists.");
  });

  // 3. Password Hashing Verification
  it("hashes password with bcrypt cost 12 and stores only SHA-256 refresh token hash in DB", async () => {
    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email.toLowerCase() },
    });

    expect(dbUser).not.toBeNull();
    // Verify bcrypt hash structure with cost 12 ($2a$12$ or $2b$12$)
    expect(dbUser?.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    const isBcryptMatch = await bcrypt.compare(testUser.password, dbUser!.passwordHash);
    expect(isBcryptMatch).toBe(true);

    // Verify raw password was never stored
    expect(dbUser?.passwordHash).not.toBe(testUser.password);

    // Verify RefreshToken in PostgreSQL is stored strictly as 64-char SHA-256 hash
    const dbTokens = await prisma.refreshToken.findMany({
      where: { userId: dbUser!.id },
    });
    expect(dbTokens.length).toBeGreaterThanOrEqual(1);
    expect(dbTokens[0]?.tokenHash).toHaveLength(64);
    expect(dbTokens[0]?.tokenHash).not.toBe(primaryRawRefreshToken);
  });

  // 4. Valid Login
  it("authenticates valid credentials and issues new access token & refresh cookie", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data).toHaveProperty("accessToken");

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookie = (cookies as unknown as string[]).find((c) =>
      c.startsWith(`${env.REFRESH_COOKIE_NAME}=`)
    );
    expect(cookie).toContain("HttpOnly");
  });

  // 5. Invalid Login (Anti-enumeration)
  it("rejects invalid password with generic error message", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword999!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Invalid email or password.");
  });

  it("rejects non-existent email with generic error message to prevent account enumeration", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "nonexistent_patient_999@sweety.app",
        password: "SomePassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Invalid email or password.");
  });

  // 6. Access-Token Verification
  it("verifies JWT access token payload, expiration (15m), issuer and audience", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${primaryAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(userId);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());

    // Verify token claims directly
    const decoded = jwt.decode(primaryAccessToken) as any;
    expect(decoded.iss).toBe(env.JWT_ISSUER);
    expect(decoded.aud).toBe(env.JWT_AUDIENCE);
    expect(decoded.userId).toBe(userId);
    expect(decoded.exp - decoded.iat).toBe(15 * 60); // 15 minutes
  });

  it("rejects unauthenticated requests to protected endpoints", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 7. Token Rotation
  it("rotates refresh token on /refresh and marks prior token as revoked with replacement link", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", primaryRefreshTokenCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("accessToken");

    // New cookie issued
    const newCookies = res.headers["set-cookie"] as unknown as string[];
    expect(newCookies).toBeDefined();
    const rotatedCookie = newCookies.find((c) =>
      c.startsWith(`${env.REFRESH_COOKIE_NAME}=`)
    )!;
    expect(rotatedCookie).toBeDefined();
    expect(rotatedCookie).not.toBe(primaryRefreshTokenCookie);

    // Verify old token was revoked in DB
    const crypto = await import("crypto");
    const oldHash = crypto.createHash("sha256").update(primaryRawRefreshToken).digest("hex");
    const oldDbToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldHash },
    });

    expect(oldDbToken).not.toBeNull();
    expect(oldDbToken?.revokedAt).not.toBeNull();
    expect(oldDbToken?.replacedBy).toBeTruthy();
  });

  // 8. Refresh-Token Reuse Detection
  it("detects reuse of previously rotated refresh token and revokes entire session family", async () => {
    // Attempt to reuse primaryRawRefreshToken (which was already rotated in previous test)
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", primaryRefreshTokenCookie);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid session state detected");

    // Verify all tokens in that family were revoked
    const crypto = await import("crypto");
    const oldHash = crypto.createHash("sha256").update(primaryRawRefreshToken).digest("hex");
    const oldDbToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldHash },
    });

    const familyTokens = await prisma.refreshToken.findMany({
      where: { familyId: oldDbToken!.familyId },
    });

    // Every token in the family must now be revoked
    for (const t of familyTokens) {
      expect(t.revokedAt).not.toBeNull();
    }
  });

  // 9. Concurrent Refresh Attempts
  it("handles concurrent refresh attempts safely with conditional atomic transactions", async () => {
    // Login to get a brand new active token
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const activeCookie = (loginRes.headers["set-cookie"] as unknown as string[]).find((c) =>
      c.startsWith(`${env.REFRESH_COOKIE_NAME}=`)
    )!;

    // Fire 2 simultaneous refresh requests with the exact same token
    const [res1, res2] = await Promise.all([
      request(app).post("/api/v1/auth/refresh").set("Cookie", activeCookie),
      request(app).post("/api/v1/auth/refresh").set("Cookie", activeCookie),
    ]);

    // Exactly one should succeed (200), and the other should be cleanly rejected (401)
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(401);
  });

  // 10. Logout Current Session
  it("logs out of current session and revokes refresh token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const cookie = (loginRes.headers["set-cookie"] as unknown as string[]).find((c) =>
      c.startsWith(`${env.REFRESH_COOKIE_NAME}=`)
    )!;
    const match = cookie.match(new RegExp(`${env.REFRESH_COOKIE_NAME}=([^;]+)`));
    const rawToken = match![1]!;

    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Verify token is revoked in DB
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    });
    expect(tokenRecord?.revokedAt).not.toBeNull();
  });

  // 11. Logout All Sessions
  it("logs out of all active sessions and revokes all tokens for user", async () => {
    // Create multiple concurrent sessions
    const session1 = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    const accessToken = session1.body.data.accessToken;

    // Call logout-all
    const res = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.revokedCount).toBeGreaterThanOrEqual(2);

    // Verify no unrevoked tokens remain for user
    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });
    expect(activeTokens.length).toBe(0);
  });
});
