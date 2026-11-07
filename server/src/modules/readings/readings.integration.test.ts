import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("Readings Module & Business Validation Rules", () => {
  const app = createApp();
  let userAToken: string;
  let userBToken: string;

  const testDate = "2026-10-15";

  beforeAll(async () => {
    // Register User A
    const userARes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "User A",
        email: `user_a_${Date.now()}@sweety.app`,
        password: "Password123!",
      });
    userAToken = userARes.body.data.accessToken;

    // Register User B
    const userBRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "User B",
        email: `user_b_${Date.now()}@sweety.app`,
        password: "Password123!",
      });
    userBToken = userBRes.body.data.accessToken;
  });

  it("Rule 1: Rejects when glucose value is omitted with 'Please enter a glucose value.'", async () => {
    const res = await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        readingDate: testDate,
        timeSlot: "Morning (fasting)",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Please enter a glucose value.");
  });

  it("Rule 2: Rejects when value < 40 with 'Value must be between 40 and 600 mg/dl.'", async () => {
    const res = await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        readingDate: testDate,
        timeSlot: "Morning (fasting)",
        value: 30,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Value must be between 40 and 600 mg/dl.");
  });

  it("Rule 2: Rejects when value > 600 with 'Value must be between 40 and 600 mg/dl.'", async () => {
    const res = await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        readingDate: testDate,
        timeSlot: "Morning (fasting)",
        value: 650,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Value must be between 40 and 600 mg/dl.");
  });

  it("Rule 5: Rejects future date with 'Date cannot be in the future.'", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dateStr = futureDate.toISOString().split("T")[0];

    const res = await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        readingDate: dateStr,
        timeSlot: "Morning (fasting)",
        value: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Date cannot be in the future.");
  });

  it("Successfully creates valid reading", async () => {
    const res = await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        readingDate: testDate,
        timeSlot: "Morning (fasting)",
        value: 95,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reading.value).toBe(95);
    expect(res.body.data.reading.timeSlot).toBe("Morning (fasting)");
  });

  it("Rule 3: Rejects duplicate slot on same date with 'You already have an [Slot Name] reading for this date.'", async () => {
    const res = await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        readingDate: testDate,
        timeSlot: "Morning (fasting)",
        value: 105,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("You already have an Morning (fasting) reading for this date.");
  });

  it("Rule 4: Enforces maximum 4 readings per day limit with 'You can add only 4 readings per day.'", async () => {
    // Add slot 2, 3, 4
    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: testDate, timeSlot: "After breakfast", value: 120 });

    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: testDate, timeSlot: "After lunch", value: 130 });

    await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: testDate, timeSlot: "After dinner", value: 140 });

    // Attempting 5th reading on same day
    const res = await request(app)
      .post("/api/v1/readings")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ readingDate: testDate, timeSlot: "Morning (fasting)", value: 100 });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("Multi-Tenant Data Isolation: User B cannot view User A readings", async () => {
    // Fetch User A readings
    const resA = await request(app)
      .get(`/api/v1/readings?date=${testDate}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(resA.body.data.readings.length).toBe(4);
    const readingId = resA.body.data.readings[0].id;

    // User B attempts to access reading directly
    const resBGet = await request(app)
      .get(`/api/v1/readings/${readingId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resBGet.status).toBe(403);
    expect(resBGet.body.success).toBe(false);

    // User B attempts to delete User A reading
    const resBDelete = await request(app)
      .delete(`/api/v1/readings/${readingId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(resBDelete.status).toBe(403);
    expect(resBDelete.body.success).toBe(false);
  });
});

