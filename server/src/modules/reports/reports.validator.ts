import { z } from "zod";
import { isValidCalendarDate } from "../readings/readings.validator.js";

export const reportTypes = [
  "daily",
  "month-to-date",
  "monthly",
  "mtd",
] as const;

export type ReportType = "daily" | "month-to-date" | "monthly";

export const getReportDateQuerySchema = z.object({
  date: z
    .string({ invalid_type_error: "Date must be a string." })
    .superRefine((val, ctx) => {
      if (!isValidCalendarDate(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date must be formatted as YYYY-MM-DD.",
        });
      }
    })
    .optional(),
});

export const getReportQuerySchema = z.object({
  type: z
    .enum(reportTypes, {
      errorMap: () => ({
        message: "Report type must be 'daily', 'month-to-date', or 'monthly'.",
      }),
    })
    .default("daily"),
  date: z
    .string({ invalid_type_error: "Date must be a string." })
    .superRefine((val, ctx) => {
      if (!isValidCalendarDate(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date must be formatted as YYYY-MM-DD.",
        });
      }
    })
    .optional(),
});

export type GetReportDateQuery = z.infer<typeof getReportDateQuerySchema>;
export type GetReportQuery = z.infer<typeof getReportQuerySchema>;
