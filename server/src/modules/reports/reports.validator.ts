import { z } from "zod";

export const reportTypes = ["daily", "mtd", "monthly"] as const;
export type ReportType = (typeof reportTypes)[number];

export const getReportQuerySchema = z.object({
  type: z.enum(reportTypes, {
    errorMap: () => ({ message: "Report type must be 'daily', 'mtd', or 'monthly'." }),
  }).default("daily"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD.")
    .optional(),
});

export type GetReportQuery = z.infer<typeof getReportQuerySchema>;

