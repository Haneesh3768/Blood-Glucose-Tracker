import { z } from "zod";

export const ALLOWED_TIME_SLOTS = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
] as const;

export type TimeSlotType = (typeof ALLOWED_TIME_SLOTS)[number];

// Helper to check if a date string YYYY-MM-DD is in the future
export function isFutureDate(dateStr: string): boolean {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return false;

  const inputDate = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return inputDate.getTime() > today.getTime();
}

const glucoseValueSchema = z
  .any()
  .superRefine((val, ctx) => {
    if (
      val === undefined ||
      val === null ||
      val === "" ||
      (typeof val === "string" && val.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a glucose value.",
      });
      return;
    }

    const num = typeof val === "number" ? val : Number(val);
    if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Value must be between 40 and 600 mg/dl.",
      });
      return;
    }
  })
  .transform((val) => Number(val));

export const createReadingSchema = z
  .object({
    readingDate: z
      .string({
        required_error: "Date is required.",
        invalid_type_error: "Date must be a string.",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD."),
    timeSlot: z.enum(ALLOWED_TIME_SLOTS, {
      errorMap: () => ({
        message: "Time slot must be one of: Morning (fasting), After breakfast, After lunch, After dinner.",
      }),
    }),
    value: glucoseValueSchema,
  })
  .superRefine((data, ctx) => {
    if (isFutureDate(data.readingDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["readingDate"],
        message: "Date cannot be in the future.",
      });
    }
  });

export const updateReadingSchema = z
  .object({
    readingDate: z
      .string({
        required_error: "Date is required.",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD."),
    timeSlot: z.enum(ALLOWED_TIME_SLOTS, {
      errorMap: () => ({
        message: "Time slot must be one of: Morning (fasting), After breakfast, After lunch, After dinner.",
      }),
    }),
    value: glucoseValueSchema,
  })
  .superRefine((data, ctx) => {
    if (isFutureDate(data.readingDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["readingDate"],
        message: "Date cannot be in the future.",
      });
    }
  });

export const getReadingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
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
export type UpdateReadingInput = z.infer<typeof updateReadingSchema>;
export type GetReadingsQuery = z.infer<typeof getReadingsQuerySchema>;
