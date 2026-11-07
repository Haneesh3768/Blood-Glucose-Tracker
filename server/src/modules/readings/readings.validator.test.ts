import { describe, expect, it } from "vitest";
import {
  createReadingSchema,
  getReadingsQuerySchema,
  patchReadingSchema,
} from "./readings.validator.js";

describe("Readings Business Validation Rules - Validator Unit Tests", () => {
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

  it("rejects when glucoseValue is empty string or null", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "Morning (fasting)",
      glucoseValue: "",
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
      glucoseValue: 39,
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
      glucoseValue: 601,
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
      glucoseValue: 120.5,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Value must be between 40 and 600 mg/dl.");
    }
  });

  it("rejects non-numeric glucose value", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "Morning (fasting)",
      glucoseValue: "abc",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Value must be between 40 and 600 mg/dl.");
    }
  });

  it("rejects future dates with exact error message", () => {
    const futureDate = new Date();
    futureDate.setUTCDate(futureDate.getUTCDate() + 5);
    const dateStr = futureDate.toISOString().split("T")[0];

    const result = createReadingSchema.safeParse({
      readingDate: dateStr,
      timeSlot: "Morning (fasting)",
      glucoseValue: 100,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Date cannot be in the future.");
    }
  });

  it("rejects malformed date strings (invalid syntax)", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026/10/15",
      timeSlot: "Morning (fasting)",
      glucoseValue: 100,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Date must be formatted as YYYY-MM-DD.");
    }
  });

  it("rejects impossible calendar dates (e.g. Feb 30)", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-02-30",
      timeSlot: "Morning (fasting)",
      glucoseValue: 100,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Date must be formatted as YYYY-MM-DD.");
    }
  });

  it("rejects invalid time slots with descriptive message", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "Midnight Snack",
      glucoseValue: 100,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Time slot must be one of");
    }
  });

  it("accepts valid reading at lower boundary (40 mg/dl)", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "Morning (fasting)",
      glucoseValue: 40,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.glucoseValue).toBe(40);
    }
  });

  it("accepts valid reading at upper boundary (600 mg/dl)", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "After dinner",
      glucoseValue: 600,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.glucoseValue).toBe(600);
    }
  });

  it("accepts uppercase enum timeSlot tokens (e.g. MORNING, AFTER_LUNCH)", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "MORNING",
      glucoseValue: 95,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeSlot).toBe("Morning (fasting)");
    }
  });

  it("accepts legacy value field alias for backward compatibility", () => {
    const result = createReadingSchema.safeParse({
      readingDate: "2026-10-15",
      timeSlot: "After breakfast",
      value: 110,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.glucoseValue).toBe(110);
      expect(result.data.value).toBe(110);
    }
  });

  describe("PATCH Reading Schema", () => {
    it("rejects empty patch body with descriptive error", () => {
      const result = patchReadingSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "At least one field (readingDate, timeSlot, glucoseValue) must be provided to update."
        );
      }
    });

    it("allows updating only glucoseValue", () => {
      const result = patchReadingSchema.safeParse({ glucoseValue: 140 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.glucoseValue).toBe(140);
      }
    });

    it("allows updating only timeSlot with normalization", () => {
      const result = patchReadingSchema.safeParse({ timeSlot: "AFTER_DINNER" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeSlot).toBe("After dinner");
      }
    });

    it("rejects out-of-range glucoseValue in patch", () => {
      const result = patchReadingSchema.safeParse({ glucoseValue: 20 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Value must be between 40 and 600 mg/dl.");
      }
    });
  });

  describe("Pagination Query Schema", () => {
    it("applies standard pagination defaults (page 1, limit 20)", () => {
      const result = getReadingsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("rejects non-positive page number", () => {
      const result = getReadingsQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects limit greater than 100", () => {
      const result = getReadingsQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Limit cannot exceed 100.");
      }
    });
  });
});
