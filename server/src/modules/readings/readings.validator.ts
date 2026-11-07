import { z } from "zod";

export const ALLOWED_TIME_SLOTS = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
] as const;

export const TIME_SLOT_ENUM_VALUES = [
  "MORNING",
  "MORNING_FASTING",
  "AFTER_BREAKFAST",
  "AFTER_LUNCH",
  "AFTER_DINNER",
] as const;

export const ALL_VALID_TIME_SLOTS = [
  ...ALLOWED_TIME_SLOTS,
  ...TIME_SLOT_ENUM_VALUES,
] as const;

export type TimeSlotType = (typeof ALLOWED_TIME_SLOTS)[number];

/**
 * Normalizes input slot (display string or uppercase enum) to canonical display string.
 */
export function normalizeSlotToDisplay(slot: string): TimeSlotType {
  const s = slot.trim().toUpperCase();
  if (s === "MORNING" || s === "MORNING_FASTING" || s === "MORNING (FASTING)") {
    return "Morning (fasting)";
  }
  if (s === "AFTER_BREAKFAST" || s === "AFTER BREAKFAST") {
    return "After breakfast";
  }
  if (s === "AFTER_LUNCH" || s === "AFTER LUNCH") {
    return "After lunch";
  }
  if (s === "AFTER_DINNER" || s === "AFTER DINNER") {
    return "After dinner";
  }
  return slot as TimeSlotType;
}

/**
 * Helper to check if a date string YYYY-MM-DD is in the future relative to today (UTC).
 */
export function isFutureDate(dateStr: string): boolean {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return false;

  const inputDate = new Date(Date.UTC(year, month - 1, day));
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return inputDate.getTime() > today.getTime();
}

/**
 * Validates that dateStr is a real, existing calendar date in YYYY-MM-DD format.
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

const timeSlotSchema = z
  .string({
    required_error: "Time slot is required.",
    invalid_type_error: "Time slot must be a string.",
  })
  .superRefine((val, ctx) => {
    const s = val.trim();
    const upper = s.toUpperCase();
    const isValid =
      ALLOWED_TIME_SLOTS.includes(s as any) ||
      TIME_SLOT_ENUM_VALUES.includes(upper as any) ||
      upper === "MORNING (FASTING)" ||
      upper === "AFTER BREAKFAST" ||
      upper === "AFTER LUNCH" ||
      upper === "AFTER DINNER";

    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Time slot must be one of: Morning (fasting), After breakfast, After lunch, After dinner (or MORNING, AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER).",
      });
    }
  })
  .transform((val) => normalizeSlotToDisplay(val));

const dateSchema = z
  .string({
    required_error: "Date is required.",
    invalid_type_error: "Date must be a string.",
  })
  .superRefine((val, ctx) => {
    if (!isValidCalendarDate(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date must be formatted as YYYY-MM-DD.",
      });
      return;
    }

    if (isFutureDate(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date cannot be in the future.",
      });
    }
  });

export const createReadingSchema = z
  .object({
    readingDate: dateSchema,
    timeSlot: timeSlotSchema,
    glucoseValue: z.any().optional(),
    value: z.any().optional(),
    userId: z.any().optional(), // ignore if sent by client
  })
  .superRefine((data, ctx) => {
    const rawVal = data.glucoseValue !== undefined ? data.glucoseValue : data.value;

    if (
      rawVal === undefined ||
      rawVal === null ||
      rawVal === "" ||
      (typeof rawVal === "string" && rawVal.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["glucoseValue"],
        message: "Please enter a glucose value.",
      });
      return;
    }

    const num = typeof rawVal === "number" ? rawVal : Number(rawVal);
    if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["glucoseValue"],
        message: "Value must be between 40 and 600 mg/dl.",
      });
    }
  })
  .transform((data) => {
    const rawVal = data.glucoseValue !== undefined ? data.glucoseValue : data.value;
    const num = Number(rawVal);
    return {
      readingDate: data.readingDate,
      timeSlot: data.timeSlot as TimeSlotType,
      glucoseValue: num,
      value: num, // alias
    };
  });

export const patchReadingSchema = z
  .object({
    readingDate: z
      .string()
      .superRefine((val, ctx) => {
        if (!isValidCalendarDate(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Date must be formatted as YYYY-MM-DD.",
          });
          return;
        }
        if (isFutureDate(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Date cannot be in the future.",
          });
        }
      })
      .optional(),
    timeSlot: timeSlotSchema.optional(),
    glucoseValue: z.any().optional(),
    value: z.any().optional(),
    userId: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    const hasDate = data.readingDate !== undefined;
    const hasSlot = data.timeSlot !== undefined;
    const hasGlucose = data.glucoseValue !== undefined || data.value !== undefined;

    if (!hasDate && !hasSlot && !hasGlucose) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field (readingDate, timeSlot, glucoseValue) must be provided to update.",
      });
      return;
    }

    if (hasGlucose) {
      const rawVal = data.glucoseValue !== undefined ? data.glucoseValue : data.value;
      if (
        rawVal === undefined ||
        rawVal === null ||
        rawVal === "" ||
        (typeof rawVal === "string" && rawVal.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["glucoseValue"],
          message: "Please enter a glucose value.",
        });
        return;
      }

      const num = typeof rawVal === "number" ? rawVal : Number(rawVal);
      if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["glucoseValue"],
          message: "Value must be between 40 and 600 mg/dl.",
        });
      }
    }
  })
  .transform((data) => {
    const hasGlucose = data.glucoseValue !== undefined || data.value !== undefined;
    const num = hasGlucose
      ? Number(data.glucoseValue !== undefined ? data.glucoseValue : data.value)
      : undefined;

    return {
      readingDate: data.readingDate,
      timeSlot: data.timeSlot as TimeSlotType | undefined,
      glucoseValue: num,
      value: num,
    };
  });

export const updateReadingSchema = createReadingSchema;

export const getReadingsQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "Page must be a valid number." })
    .int("Page must be an integer.")
    .positive("Page must be greater than 0.")
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: "Limit must be a valid number." })
    .int("Limit must be an integer.")
    .positive("Limit must be greater than 0.")
    .max(100, "Limit cannot exceed 100.")
    .default(20),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD.")
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD.")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD.")
    .optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
export type PatchReadingInput = z.infer<typeof patchReadingSchema>;
export type UpdateReadingInput = CreateReadingInput;
export type GetReadingsQuery = z.infer<typeof getReadingsQuerySchema>;
