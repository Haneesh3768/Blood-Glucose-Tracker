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

  it("responds 404 with structured error on non-existent route", async () => {
    const res = await request(app).get("/api/v1/invalid-route-path");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("API endpoint not found.");
  });
});

