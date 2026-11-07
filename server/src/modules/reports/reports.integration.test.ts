import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("Reports Module & Statistical Aggregation Tests", () => {
  const app = createApp();
  let authToken: string;

  const selectedDate = "2026-10-15";

  beforeAll(async () => {
    // Register user for reports test
    const userRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Reports Patient",
        email: `reports_${Date.now()}@sweety.app`,
        password: "Password123!",
      });
    authToken = userRes.body.data.accessToken;

    // Seed specific known readings for selectedDate (15 Oct 2026)
    // Values: 90, 135, 142, 128
    // Highest: 142
    // Lowest: 90
    // Average: (90 + 135 + 142 + 128) / 4 = 495 / 4 = 123.75 -> rounded to 1 decimal: 123.8
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ readingDate: selectedDate, timeSlot: "Morning (fasting)", value: 90 });

    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ readingDate: selectedDate, timeSlot: "After breakfast", value: 135 });

    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ readingDate: selectedDate, timeSlot: "After lunch", value: 142 });

    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ readingDate: selectedDate, timeSlot: "After dinner", value: 128 });
  });

  it("calculates accurate Daily Report metrics and lists slot entries", async () => {
    const res = await request(app)
      .get(`/api/v1/reports/summary?type=daily&date=${selectedDate}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const report = res.body.data.report;
    expect(report.reportType).toBe("daily");
    expect(report.stats.count).toBe(4);
    expect(report.stats.highest).toBe(142);
    expect(report.stats.lowest).toBe(90);
    expect(report.stats.average).toBe(123.8); // 123.75 rounded to 1 decimal
    expect(report.readings.length).toBe(4);
    expect(report.isEmpty).toBe(false);
  });

  it("handles Month-to-Date (MTD) report scope", async () => {
    const res = await request(app)
      .get(`/api/v1/reports/summary?type=mtd&date=${selectedDate}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const report = res.body.data.report;
    expect(report.reportType).toBe("mtd");
    expect(report.dateRange.startDate).toBe("2026-10-01");
    expect(report.dateRange.endDate).toBe(selectedDate);
    expect(report.stats.count).toBeGreaterThanOrEqual(4);
  });

  it("returns a clean empty state structure when no readings exist", async () => {
    // Query a date in the past with no readings
    const emptyDate = "2025-01-01";
    const res = await request(app)
      .get(`/api/v1/reports/summary?type=daily&date=${emptyDate}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const report = res.body.data.report;
    expect(report.isEmpty).toBe(true);
    expect(report.stats.count).toBe(0);
    expect(report.stats.highest).toBeNull();
    expect(report.stats.lowest).toBeNull();
    expect(report.stats.average).toBeNull();
    expect(report.readings.length).toBe(0);
  });
});

