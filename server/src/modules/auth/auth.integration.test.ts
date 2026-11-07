import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("Auth Module Integration Tests", () => {
  const app = createApp();
  const testEmail = `testuser_${Date.now()}@sweety.app`;
  const testPassword = "Password123!";

  it("successfully signs up a new user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Test Patient",
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.data.tokens).toHaveProperty("accessToken");
    expect(res.body.data.tokens).toHaveProperty("refreshToken");
  });

  it("prevents registering with a duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Another User",
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("already exists");
  });

  it("authenticates valid login and issues token pair", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.data.tokens).toHaveProperty("accessToken");
    expect(res.body.data.tokens).toHaveProperty("refreshToken");
  });

  it("rejects login with invalid password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: "WrongPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Invalid email or password.");
  });

  it("rotates refresh token and returns new token pair", async () => {
    // Login to get fresh refresh token
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    const rawRefreshToken = loginRes.body.data.tokens.refreshToken;

    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: rawRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.tokens).toHaveProperty("accessToken");
    expect(refreshRes.body.data.tokens).toHaveProperty("refreshToken");
  });
});
