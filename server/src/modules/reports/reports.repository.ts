import type { PrismaClient, Reading } from "@prisma/client";
import { prisma } from "../../config/database.js";

export interface AggregateStats {
  count: number;
  totalReadings: number;
  highest: number | null;
  lowest: number | null;
  average: number | null;
}

export interface IReportsRepository {
  getAggregateStats(userId: string, startDate: Date, endDate: Date): Promise<AggregateStats>;
  findReadingsInRange(userId: string, startDate: Date, endDate: Date): Promise<Reading[]>;
}

export class ReportsRepository implements IReportsRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async getAggregateStats(userId: string, startDate: Date, endDate: Date): Promise<AggregateStats> {
    const aggregations = await this.db.reading.aggregate({
      where: {
        userId,
        readingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        glucoseValue: true,
      },
      _max: {
        glucoseValue: true,
      },
      _min: {
        glucoseValue: true,
      },
      _avg: {
        glucoseValue: true,
      },
    });

    const count = aggregations._count.glucoseValue;
    const highest = count > 0 ? (aggregations._max.glucoseValue ?? null) : null;
    const lowest = count > 0 ? (aggregations._min.glucoseValue ?? null) : null;
    const rawAvg = aggregations._avg.glucoseValue;
    const average = count > 0 && rawAvg !== null ? Math.round(rawAvg * 10) / 10 : null;

    return {
      count,
      totalReadings: count,
      highest,
      lowest,
      average,
    };
  }

  async findReadingsInRange(userId: string, startDate: Date, endDate: Date): Promise<Reading[]> {
    return this.db.reading.findMany({
      where: {
        userId,
        readingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ readingDate: "asc" }, { createdAt: "asc" }],
    });
  }
}

export const reportsRepository = new ReportsRepository();
