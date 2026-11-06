import { describe, expect, it } from "vitest";
import { createReadingSchema } from "./readings.validator.js";

describe("Readings Business Validation Rules", () => {
  it("rejects when glucose value is missing with exact error message", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "Morning (fasting)",
      value: undefined,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Please enter a glucose value.");
    }
  });

  it("rejects when glucose value is less than 40", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "After breakfast",
      value: 39,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Value must be between 40 and 600 mg/dl.");
    }
  });

  it("rejects when glucose value exceeds 600", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "After lunch",
      value: 601,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Value must be between 40 and 600 mg/dl.");
    }
  });

  it("rejects decimal numbers for glucose value", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "After dinner",
      value: 120.5,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Value must be between 40 and 600 mg/dl.");
    }
  });

  it("rejects future dates with exact error message", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split("T")[0];

    const result = createReadingSchema.safeParse({
      readingDate: dateStr,
      timeSlot: "Morning (fasting)",
      value: 100,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Date cannot be in the future.");
    }
  });

  it("accepts valid reading within boundary", () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const result = createReadingSchema.safeParse({
      readingDate: todayStr,
      timeSlot: "Morning (fasting)",
      value: 95,
    });

    expect(result.success).toBe(true);
  });
});
