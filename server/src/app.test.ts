import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("Application Health & Core Gateway", () => {
  const app = createApp();

  it("responds 200 OK on GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("uptime");
  });

  it("handles CORS preflight OPTIONS requests cleanly", async () => {
    const res = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type, Authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("allows 127.0.0.1 origin during development", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://127.0.0.1:5173");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:5173");
  });

  it("responds 404 with structured error on non-existent route", async () => {
    const res = await request(app).get("/api/v1/invalid-route-path");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("API endpoint not found.");
  });

  it("serves OpenAPI specification JSON at GET /api/docs/openapi.json", async () => {
    const res = await request(app).get("/api/docs/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toContain("Sweety");
    expect(res.body.paths).toHaveProperty("/api/v1/readings");
  });

  it("serves interactive Swagger UI HTML at GET /api/docs", async () => {
    const res = await request(app).get("/api/docs");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("SwaggerUIBundle");
  });
});
