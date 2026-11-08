import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("Readings Module & Business Validation Rules (Phase 2)", () => {
  const app = createApp();
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;

  const testDate = "2026-10-15";
  const paginationDate = "2026-10-14";
  const concurrencyDate = "2026-10-13";

  beforeAll(async () => {
    // Register User A
    const userARes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "User A",
        email: `user_a_${Date.now()}@sweety.app`,
        password: "Password123!",
      });
    expect(userARes.status).toBe(201);
    userAToken = userARes.body.data.accessToken;
    userAId = userARes.body.data.user.id;

    // Register User B
    const userBRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "User B",
        email: `user_b_${Date.now()}@sweety.app`,
        password: "Password123!",
      });
    expect(userBRes.status).toBe(201);
    userBToken = userBRes.body.data.accessToken;
    userBId = userBRes.body.data.user.id;
  });

  describe("Validation Rules & Error Messages", () => {
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

    it("Rule 1: Rejects empty string glucose value with 'Please enter a glucose value.'", async () => {
      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          readingDate: testDate,
          timeSlot: "Morning (fasting)",
          glucoseValue: "",
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
          glucoseValue: 39,
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
          glucoseValue: 601,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Value must be between 40 and 600 mg/dl.");
    });

    it("Rule 2: Rejects decimal values with 'Value must be between 40 and 600 mg/dl.'", async () => {
      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          readingDate: testDate,
          timeSlot: "Morning (fasting)",
          glucoseValue: 120.7,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Value must be between 40 and 600 mg/dl.");
    });

    it("Rule 5: Rejects future date with 'Date cannot be in the future.'", async () => {
      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 7);
      const dateStr = futureDate.toISOString().split("T")[0];

      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          readingDate: dateStr,
          timeSlot: "Morning (fasting)",
          glucoseValue: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Date cannot be in the future.");
    });

    it("Rejects malformed date syntax with 400", async () => {
      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          readingDate: "not-a-valid-date",
          timeSlot: "Morning (fasting)",
          glucoseValue: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Date must be formatted as YYYY-MM-DD.");
    });

    it("Rejects invalid time slot with 400", async () => {
      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          readingDate: testDate,
          timeSlot: "Bedtime Snack",
          glucoseValue: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Time slot must be one of");
    });
  });

  describe("CRUD Lifecycle & Slot Constraints", () => {
    let createdReadingId: string;

    it("Successfully creates a valid reading using glucoseValue and uppercase enum slot MORNING", async () => {
      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          readingDate: testDate,
          timeSlot: "MORNING",
          glucoseValue: 95,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Reading created successfully.");
      expect(res.body.data.reading.glucoseValue).toBe(95);
      expect(res.body.data.reading.value).toBe(95);
      expect(res.body.data.reading.timeSlot).toBe("Morning (fasting)");
      expect(res.body.data.reading.readingDate).toBe(testDate);
      expect(res.body.data.reading.userId).toBe(userAId);

      createdReadingId = res.body.data.reading.id;
    });

    it("Rule 3: Rejects duplicate slot on same date with HTTP 409", async () => {
      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          readingDate: testDate,
          timeSlot: "Morning (fasting)",
          glucoseValue: 105,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("You already have an Morning (fasting) reading for this date.");
    });

    it("Retrieves reading by ID for the owning user", async () => {
      const res = await request(app)
        .get(`/api/v1/readings/${createdReadingId}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reading.id).toBe(createdReadingId);
      expect(res.body.data.reading.glucoseValue).toBe(95);
    });

    it("PATCH updates only glucoseValue", async () => {
      const res = await request(app)
        .patch(`/api/v1/readings/${createdReadingId}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          glucoseValue: 110,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Reading updated successfully.");
      expect(res.body.data.reading.glucoseValue).toBe(110);
      expect(res.body.data.reading.timeSlot).toBe("Morning (fasting)");
    });

    it("Rule 4: Enforces maximum 4 readings per day limit with 'You can add only 4 readings per day.'", async () => {
      // Add slot 2, 3, 4
      const res2 = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ readingDate: testDate, timeSlot: "After breakfast", glucoseValue: 125 });
      expect(res2.status).toBe(201);

      const res3 = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ readingDate: testDate, timeSlot: "After lunch", glucoseValue: 135 });
      expect(res3.status).toBe(201);

      const res4 = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ readingDate: testDate, timeSlot: "After dinner", glucoseValue: 145 });
      expect(res4.status).toBe(201);

      // Attempt 5th reading on same day
      const res5 = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ readingDate: testDate, timeSlot: "Morning (fasting)", glucoseValue: 100 });

      expect(res5.status).toBe(400);
      expect(res5.body.success).toBe(false);
      expect(res5.body.error).toBe("You can add only 4 readings per day.");
    });

    it("PATCH rejects conflict when updating slot to one that already exists on that date", async () => {
      // createdReadingId is Morning (fasting). Attempt to PATCH its timeSlot to "After breakfast" which already exists.
      const res = await request(app)
        .patch(`/api/v1/readings/${createdReadingId}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          timeSlot: "After breakfast",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("You already have an After breakfast reading for this date.");
    });

    it("DELETE removes reading successfully", async () => {
      const res = await request(app)
        .delete(`/api/v1/readings/${createdReadingId}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Reading deleted successfully.");

      // Verify it is gone
      const verifyRes = await request(app)
        .get(`/api/v1/readings/${createdReadingId}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(verifyRes.status).toBe(404);
      expect(verifyRes.body.error).toBe("Reading not found.");
    });
  });

  describe("Multi-Tenant Isolation & Authorization Scoping", () => {
    let userAReadingId: string;

    beforeAll(async () => {
      // Create a reading for User A on paginationDate
      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          readingDate: paginationDate,
          timeSlot: "Morning (fasting)",
          glucoseValue: 90,
        });
      expect(res.status).toBe(201);
      userAReadingId = res.body.data.reading.id;
    });

    it("User B receives 404 Not Found (not 403) when attempting GET on User A reading", async () => {
      const res = await request(app)
        .get(`/api/v1/readings/${userAReadingId}`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Reading not found.");
    });

    it("User B receives 404 Not Found when attempting PATCH on User A reading", async () => {
      const res = await request(app)
        .patch(`/api/v1/readings/${userAReadingId}`)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          glucoseValue: 200,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Reading not found.");
    });

    it("User B receives 404 Not Found when attempting DELETE on User A reading", async () => {
      const res = await request(app)
        .delete(`/api/v1/readings/${userAReadingId}`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Reading not found.");
    });

    it("Listing readings scopes strictly to authenticated user", async () => {
      // User B has not created any readings on paginationDate
      const resB = await request(app)
        .get(`/api/v1/readings?date=${paginationDate}`)
        .set("Authorization", `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.readings.length).toBe(0);

      // User A sees their reading
      const resA = await request(app)
        .get(`/api/v1/readings?date=${paginationDate}`)
        .set("Authorization", `Bearer ${userAToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.readings.length).toBe(1);
      expect(resA.body.data.readings[0].id).toBe(userAReadingId);
    });

    it("Ignores malicious userId provided in request body and binds to token user", async () => {
      const res = await request(app)
        .post("/api/v1/readings")
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          userId: userAId, // Attempt to forge User A ID
          readingDate: paginationDate,
          timeSlot: "After breakfast",
          glucoseValue: 115,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reading.userId).toBe(userBId); // Bound strictly to token user B
    });
  });

  describe("Server-Side Pagination & Limit Enforcement", () => {
    let pUserToken: string;
    let pUserId: string;
    let isolatedUserToken: string;

    beforeAll(async () => {
      // Register dedicated pagination test user
      const pUserEmail = `pagination-${Date.now()}@example.com`;
      const pUserRes = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "Pagination User", email: pUserEmail, password: "SecurePassword123!" });
      pUserToken = pUserRes.body.data.accessToken;
      pUserId = pUserRes.body.data.user.id;

      // Register isolated user to verify cross-user isolation
      const isoEmail = `isolated-${Date.now()}@example.com`;
      const isoRes = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "Isolated User", email: isoEmail, password: "SecurePassword123!" });
      isolatedUserToken = isoRes.body.data.accessToken;
    });

    it("Returns empty results with total=0, totalPages=0, hasNextPage=false, hasPreviousPage=false", async () => {
      const res = await request(app)
        .get("/api/v1/readings")
        .set("Authorization", `Bearer ${pUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readings).toEqual([]);
      expect(res.body.meta).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(res.body.data.pagination).toEqual(res.body.meta);
    });

    it("Seeds test readings for pagination verification", async () => {
      const seedDates = [
        "2026-07-01",
        "2026-07-02",
        "2026-07-03",
        "2026-07-04",
        "2026-07-05",
      ];
      for (let i = 0; i < seedDates.length; i++) {
        const createRes = await request(app)
          .post("/api/v1/readings")
          .set("Authorization", `Bearer ${pUserToken}`)
          .send({
            readingDate: seedDates[i],
            timeSlot: "Morning (fasting)",
            glucoseValue: 100 + i * 5,
          });
        expect(createRes.status).toBe(201);
      }
    });

    it("Returns first page with hasNextPage=true, hasPreviousPage=false and deterministic sort", async () => {
      const res = await request(app)
        .get("/api/v1/readings?page=1&limit=2")
        .set("Authorization", `Bearer ${pUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readings.length).toBe(2);
      expect(res.body.meta).toEqual({
        total: 5,
        page: 1,
        limit: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      // Sorted by readingDate descending: 2026-07-05, then 2026-07-04
      expect(res.body.data.readings[0].readingDate).toBe("2026-07-05");
      expect(res.body.data.readings[1].readingDate).toBe("2026-07-04");
    });

    it("Returns middle page with hasNextPage=true and hasPreviousPage=true", async () => {
      const res = await request(app)
        .get("/api/v1/readings?page=2&limit=2")
        .set("Authorization", `Bearer ${pUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readings.length).toBe(2);
      expect(res.body.meta).toEqual({
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(res.body.data.readings[0].readingDate).toBe("2026-07-03");
      expect(res.body.data.readings[1].readingDate).toBe("2026-07-02");
    });

    it("Returns last page with hasNextPage=false and hasPreviousPage=true", async () => {
      const res = await request(app)
        .get("/api/v1/readings?page=3&limit=2")
        .set("Authorization", `Bearer ${pUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readings.length).toBe(1);
      expect(res.body.meta).toEqual({
        total: 5,
        page: 3,
        limit: 2,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      expect(res.body.data.readings[0].readingDate).toBe("2026-07-01");
    });

    it("Rejects invalid page parameters (page=0, page=-1, page=abc, page=1.5) with 400", async () => {
      const invalidPages = ["0", "-1", "abc", "1.5"];
      for (const page of invalidPages) {
        const res = await request(app)
          .get(`/api/v1/readings?page=${page}&limit=10`)
          .set("Authorization", `Bearer ${pUserToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it("Rejects invalid limit parameters (limit=0, limit=-5, limit=101, limit=xyz) with 400", async () => {
      const invalidLimits = ["0", "-5", "101", "xyz", "2.5"];
      for (const limit of invalidLimits) {
        const res = await request(app)
          .get(`/api/v1/readings?page=1&limit=${limit}`)
          .set("Authorization", `Bearer ${pUserToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it("Supports maximum limit (limit=100) returning all user records in a single page", async () => {
      const res = await request(app)
        .get("/api/v1/readings?page=1&limit=100")
        .set("Authorization", `Bearer ${pUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readings.length).toBe(5);
      expect(res.body.meta).toEqual({
        total: 5,
        page: 1,
        limit: 100,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it("Enforces strict cross-user isolation: User B cannot see User A's readings or total count", async () => {
      // Isolated user queries readings
      const res = await request(app)
        .get("/api/v1/readings?page=1&limit=20")
        .set("Authorization", `Bearer ${isolatedUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readings).toEqual([]);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.meta.totalPages).toBe(0);

      // Attempt query parameter injection / IDOR
      const maliciousRes = await request(app)
        .get(`/api/v1/readings?page=1&limit=20&userId=${pUserId}`)
        .set("Authorization", `Bearer ${isolatedUserToken}`);

      expect(maliciousRes.status).toBe(200);
      expect(maliciousRes.body.data.readings).toEqual([]);
      expect(maliciousRes.body.meta.total).toBe(0);
    });
  });

  describe("Concurrent Duplicate Creation (Database Constraint Defense)", () => {
    it("Handles concurrent creation attempts for identical slot and returns 409 for the collision", async () => {
      const responses = await Promise.all([
        request(app)
          .post("/api/v1/readings")
          .set("Authorization", `Bearer ${userAToken}`)
          .send({
            readingDate: concurrencyDate,
            timeSlot: "Morning (fasting)",
            glucoseValue: 92,
          }),
        request(app)
          .post("/api/v1/readings")
          .set("Authorization", `Bearer ${userAToken}`)
          .send({
            readingDate: concurrencyDate,
            timeSlot: "Morning (fasting)",
            glucoseValue: 98,
          }),
      ]);

      const statuses = responses.map((r) => r.status);
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      const conflictRes = responses.find((r) => r.status === 409);
      expect(conflictRes?.body.error).toBe(
        "You already have an Morning (fasting) reading for this date."
      );
    });
  });
});
