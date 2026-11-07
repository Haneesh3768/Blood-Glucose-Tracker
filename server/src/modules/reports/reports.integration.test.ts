import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("Phase 3: Glucose Reporting and Analytics Module", () => {
  const app = createApp();
  let userAToken: string;
  let userBToken: string;

  const userADailyDate = "2026-10-15";
  const userAMonthlyDate = "2026-10-15"; // previous month is September 2026
  const leapYearQueryDate = "2024-03-10"; // previous month is Feb 2024 (Leap year, 29 days)
  const yearBoundaryQueryDate = "2026-01-10"; // previous month is Dec 2025

  beforeAll(async () => {
    // 1. Register User A
    const userARes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Analytics Patient A",
        email: `analytics_a_${Date.now()}@sweety.app`,
        password: "Password123!",
      });
    expect(userARes.status).toBe(201);
    userAToken = userARes.body.data.accessToken;

    // 2. Register User B (for user isolation verification)
    const userBRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Analytics Patient B",
        email: `analytics_b_${Date.now()}@sweety.app`,
        password: "Password123!",
      });
    expect(userBRes.status).toBe(201);
    userBToken = userBRes.body.data.accessToken;

    // 3. Seed User A readings:
    // On 2026-10-15 (Daily report date - exactly 4 readings)
    // Values: 90, 135, 142, 128
    // Highest: 142, Lowest: 90, Sum: 495, Average: 495 / 4 = 123.75 -> 123.8
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: userADailyDate, timeSlot: "Morning (fasting)", glucoseValue: 90 });

    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: userADailyDate, timeSlot: "After breakfast", glucoseValue: 135 });

    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: userADailyDate, timeSlot: "After lunch", glucoseValue: 142 });

    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: userADailyDate, timeSlot: "After dinner", glucoseValue: 128 });

    // Seed earlier reading in the same month (2026-10-02) for MTD testing
    // Value: 110
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: "2026-10-02", timeSlot: "Morning (fasting)", glucoseValue: 110 });

    // Seed reading in September 2026 for Monthly report testing (2026-09-15)
    // Value: 160
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: "2026-09-15", timeSlot: "After lunch", glucoseValue: 160 });

    // Seed reading in February 2024 on the leap day (2024-02-29)
    // Value: 104
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: "2024-02-29", timeSlot: "Morning (fasting)", glucoseValue: 104 });

    // Seed reading in December 2025 for year boundary transition (2025-12-25)
    // Value: 175
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: "2025-12-25", timeSlot: "After dinner", glucoseValue: 175 });

    // Seed a single reading on a specific date for single-reading test (2026-08-08)
    // Value: 118
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: "2026-08-08", timeSlot: "Morning (fasting)", glucoseValue: 118 });

    // Seed readings for rounding test on 2026-07-07:
    // Values: 100, 105, 112 -> Sum: 317 / 3 = 105.666... -> 105.7
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: "2026-07-07", timeSlot: "Morning (fasting)", glucoseValue: 100 });
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: "2026-07-07", timeSlot: "After breakfast", glucoseValue: 105 });
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: "2026-07-07", timeSlot: "After lunch", glucoseValue: 112 });
  });

  describe("1. Daily Report Endpoint (GET /api/v1/reports/daily)", () => {
    it("returns four readings with all time slots, exact stats, and rounded average", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/daily?date=${userADailyDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const report = res.body.data.report;
      expect(report.reportType).toBe("daily");
      expect(report.selectedDate).toBe(userADailyDate);
      expect(report.dateRange.startDate).toBe(userADailyDate);
      expect(report.dateRange.endDate).toBe(userADailyDate);
      expect(report.isEmpty).toBe(false);

      expect(report.stats.count).toBe(4);
      expect(report.stats.totalReadings).toBe(4);
      expect(report.stats.highest).toBe(142);
      expect(report.stats.lowest).toBe(90);
      expect(report.stats.average).toBe(123.8); // 123.75 rounded to 1 decimal

      // Daily report additionally lists each reading with slot, value, and date
      expect(report.readings).toHaveLength(4);
      const slots = report.readings.map((r: any) => r.timeSlot);
      expect(slots).toContain("Morning (fasting)");
      expect(slots).toContain("After breakfast");
      expect(slots).toContain("After lunch");
      expect(slots).toContain("After dinner");

      for (const r of report.readings) {
        expect(r.readingDate).toBe(userADailyDate);
        expect(r).toHaveProperty("glucoseValue");
        expect(r).toHaveProperty("value");
      }
    });

    it("returns accurate single-reading stats for date with only one reading", async () => {
      const res = await request(app)
        .get("/api/v1/reports/daily?date=2026-08-08")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const report = res.body.data.report;
      expect(report.stats.count).toBe(1);
      expect(report.stats.highest).toBe(118);
      expect(report.stats.lowest).toBe(118);
      expect(report.stats.average).toBe(118);
      expect(report.readings).toHaveLength(1);
      expect(report.isEmpty).toBe(false);
    });

    it("verifies accurate 1-decimal rounding on daily report (105.666... -> 105.7)", async () => {
      const res = await request(app)
        .get("/api/v1/reports/daily?date=2026-07-07")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const report = res.body.data.report;
      expect(report.stats.count).toBe(3);
      expect(report.stats.highest).toBe(112);
      expect(report.stats.lowest).toBe(100);
      expect(report.stats.average).toBe(105.7);
    });
  });

  describe("2. Month-to-Date (MTD) Endpoint (GET /api/v1/reports/month-to-date)", () => {
    it("aggregates from 1st of month through selected date", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/month-to-date?date=${userADailyDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const report = res.body.data.report;
      expect(report.reportType).toBe("month-to-date");
      expect(report.selectedDate).toBe(userADailyDate);
      expect(report.dateRange.startDate).toBe("2026-10-01");
      expect(report.dateRange.endDate).toBe("2026-10-15");

      // User A has 1 reading on 2026-10-02 (110) + 4 readings on 2026-10-15 (90, 135, 142, 128)
      // Total: 5 readings
      // Sum: 110 + 495 = 605 / 5 = 121.0
      expect(report.stats.count).toBe(5);
      expect(report.stats.highest).toBe(142);
      expect(report.stats.lowest).toBe(90);
      expect(report.stats.average).toBe(121);
      expect(report.isEmpty).toBe(false);
    });
  });

  describe("3. Monthly (Previous Calendar Month) Endpoint (GET /api/v1/reports/monthly)", () => {
    it("aggregates the entire previous calendar month relative to selected date", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/monthly?date=${userAMonthlyDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const report = res.body.data.report;
      expect(report.reportType).toBe("monthly");
      expect(report.dateRange.startDate).toBe("2026-09-01");
      expect(report.dateRange.endDate).toBe("2026-09-30");

      // September 2026 reading: 160
      expect(report.stats.count).toBe(1);
      expect(report.stats.highest).toBe(160);
      expect(report.stats.lowest).toBe(160);
      expect(report.stats.average).toBe(160);
      expect(report.isEmpty).toBe(false);
    });

    it("correctly handles leap year February (2024-02-01 to 2024-02-29) for March 2024 query", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/monthly?date=${leapYearQueryDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const report = res.body.data.report;
      expect(report.reportType).toBe("monthly");
      expect(report.dateRange.startDate).toBe("2024-02-01");
      expect(report.dateRange.endDate).toBe("2024-02-29"); // Must be 29 in leap year 2024!

      // Leap day reading (2024-02-29): 104
      expect(report.stats.count).toBe(1);
      expect(report.stats.highest).toBe(104);
      expect(report.stats.lowest).toBe(104);
      expect(report.stats.average).toBe(104);
    });

    it("correctly handles non-leap year February (2025-02-01 to 2025-02-28) for March 2025 query", async () => {
      const res = await request(app)
        .get("/api/v1/reports/monthly?date=2025-03-10")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const report = res.body.data.report;
      expect(report.dateRange.startDate).toBe("2025-02-01");
      expect(report.dateRange.endDate).toBe("2025-02-28"); // Must be 28 in non-leap year 2025!
    });

    it("correctly handles year boundary December/January transition (2025-12-01 to 2025-12-31) for Jan 2026 query", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/monthly?date=${yearBoundaryQueryDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const report = res.body.data.report;
      expect(report.reportType).toBe("monthly");
      expect(report.dateRange.startDate).toBe("2025-12-01");
      expect(report.dateRange.endDate).toBe("2025-12-31");

      // Reading seeded on 2025-12-25: 175
      expect(report.stats.count).toBe(1);
      expect(report.stats.highest).toBe(175);
      expect(report.stats.lowest).toBe(175);
      expect(report.stats.average).toBe(175);
    });
  });

  describe("4. Empty State Reports & Null Statistics", () => {
    it("returns null statistics and count 0 when no readings exist in range", async () => {
      const res = await request(app)
        .get("/api/v1/reports/daily?date=2023-01-01")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const report = res.body.data.report;
      expect(report.isEmpty).toBe(true);
      expect(report.stats.count).toBe(0);
      expect(report.stats.totalReadings).toBe(0);
      expect(report.stats.highest).toBeNull();
      expect(report.stats.lowest).toBeNull();
      expect(report.stats.average).toBeNull();
      expect(report.readings).toHaveLength(0);
    });

    it("returns clean empty monthly report for past month with no data", async () => {
      const res = await request(app)
        .get("/api/v1/reports/monthly?date=2023-05-01")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const report = res.body.data.report;
      expect(report.isEmpty).toBe(true);
      expect(report.stats.count).toBe(0);
      expect(report.stats.highest).toBeNull();
      expect(report.stats.lowest).toBeNull();
      expect(report.stats.average).toBeNull();
    });
  });

  describe("5. Validation & Error Handling", () => {
    it("rejects malformed date parameter with 400", async () => {
      const res = await request(app)
        .get("/api/v1/reports/daily?date=not-a-valid-date")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Date must be formatted as YYYY-MM-DD.");
    });

    it("rejects impossible calendar date (e.g. 2026-02-30) with 400", async () => {
      const res = await request(app)
        .get("/api/v1/reports/daily?date=2026-02-30")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Date must be formatted as YYYY-MM-DD.");
    });

    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app).get("/api/v1/reports/daily?date=2026-10-15");
      expect(res.status).toBe(401);
    });
  });

  describe("6. Multi-Tenant User Isolation", () => {
    it("User B sees only their own data and zero of User A readings", async () => {
      // User B requests report for 2026-10-15 (where User A has 4 readings)
      const resB = await request(app)
        .get(`/api/v1/reports/daily?date=${userADailyDate}`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      const reportB = resB.body.data.report;
      expect(reportB.isEmpty).toBe(true);
      expect(reportB.stats.count).toBe(0);
      expect(reportB.stats.highest).toBeNull();
      expect(reportB.stats.lowest).toBeNull();
      expect(reportB.stats.average).toBeNull();
      expect(reportB.readings).toHaveLength(0);

      // Now create 1 reading for User B
      await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ readingDate: userADailyDate, timeSlot: "Morning (fasting)", glucoseValue: 88 });

      // User B now sees exactly their 1 reading
      const resBAfter = await request(app)
        .get(`/api/v1/reports/daily?date=${userADailyDate}`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(resBAfter.status).toBe(200);
      const reportBAfter = resBAfter.body.data.report;
      expect(reportBAfter.isEmpty).toBe(false);
      expect(reportBAfter.stats.count).toBe(1);
      expect(reportBAfter.stats.highest).toBe(88);
      expect(reportBAfter.stats.lowest).toBe(88);
      expect(reportBAfter.stats.average).toBe(88);
      expect(reportBAfter.readings).toHaveLength(1);

      // User A still sees their 4 readings unaffected
      const resA = await request(app)
        .get(`/api/v1/reports/daily?date=${userADailyDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.report.stats.count).toBe(4);
      expect(resA.body.data.report.stats.highest).toBe(142);
    });
  });

  describe("7. Backward-Compatible /summary Endpoint", () => {
    it("supports /summary?type=daily", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/summary?type=daily&date=${userADailyDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.report.reportType).toBe("daily");
      expect(res.body.data.report.stats.count).toBe(4);
    });

    it("supports /summary?type=mtd", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/summary?type=mtd&date=${userADailyDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.report.reportType).toBe("month-to-date");
    });

    it("supports /summary?type=monthly", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/summary?type=monthly&date=${userADailyDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.report.reportType).toBe("monthly");
      expect(res.body.data.report.dateRange.startDate).toBe("2026-09-01");
    });
  });
});
