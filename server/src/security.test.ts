import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

describe("Application Security & Defensive Hardening Audit", () => {
  const app = createApp();

  describe("Password Hashing & Password Length Handling (Bcrypt 72-byte Limit)", () => {
    it("rejects registration when password exceeds 72 characters", async () => {
      const longPassword = "A".repeat(73) + "1!";
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Security Tester",
          email: "overflow@sweety.app",
          password: longPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Password cannot exceed 72 characters.");
    });

    it("rejects login when password exceeds 72 characters", async () => {
      const longPassword = "A".repeat(73) + "1!";
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "overflow@sweety.app",
          password: longPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Password cannot exceed 72 characters.");
    });
  });

  describe("JWT Security & Algorithm Restriction", () => {
    it("rejects JWT forged with 'none' algorithm", async () => {
      // Craft an unsigned token with alg: none
      const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(
        JSON.stringify({
          userId: "attacker-uuid",
          email: "attacker@sweety.app",
          name: "Attacker",
          iss: env.JWT_ISSUER,
          aud: env.JWT_AUDIENCE,
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      ).toString("base64url");
      const noneToken = `${header}.${payload}.`;

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${noneToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired session token.");
    });

    it("rejects JWT signed with an incorrect symmetric secret", async () => {
      const forgedToken = jwt.sign(
        {
          userId: "attacker-uuid",
          email: "attacker@sweety.app",
          name: "Attacker",
        },
        "wrong_secret_key_which_does_not_match_server_secret_at_all_123",
        {
          algorithm: "HS256",
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
          expiresIn: "1h",
        }
      );

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired session token.");
    });

    it("rejects JWT with mismatched audience or issuer", async () => {
      const badAudToken = jwt.sign(
        {
          userId: "attacker-uuid",
          email: "attacker@sweety.app",
          name: "Attacker",
        },
        env.JWT_ACCESS_SECRET,
        {
          algorithm: "HS256",
          issuer: "wrong-issuer",
          audience: "wrong-audience",
          expiresIn: "1h",
        }
      );

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${badAudToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired session token.");
    });
  });

  describe("HTTP Request Payload Size Limits (DoS Mitigation)", () => {
    it("rejects JSON payloads exceeding the 15kb size limit with HTTP 413", async () => {
      const oversizedPayload = {
        name: "Giant Payload",
        email: "giant@sweety.app",
        password: "Password123!",
        padding: "X".repeat(20 * 1024), // 20kb
      };

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(oversizedPayload);

      expect(res.status).toBe(413);
    });
  });

  describe("API Endpoint Security Headers & CSP", () => {
    it("returns hardened security headers with explicit Swagger UI CSP directives", async () => {
      const res = await request(app).get("/api/docs");
      expect(res.status).toBe(200);
      expect(res.headers["content-security-policy"]).toBeDefined();
      expect(res.headers["content-security-policy"]).toContain("https://cdn.jsdelivr.net");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    });
  });
});
