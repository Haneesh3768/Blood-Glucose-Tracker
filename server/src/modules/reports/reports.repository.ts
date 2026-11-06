import type { PrismaClient, Reading } from "@prisma/client";
import { prisma } from "../../config/database.js";

export interface AggregateStats {
  count: number;
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
        value: true,
      },
      _max: {
        value: true,
      },
      _min: {
        value: true,
      },
      _avg: {
        value: true,
      },
    });

    const count = aggregations._count.value;
    const highest = aggregations._max.value ?? null;
    const lowest = aggregations._min.value ?? null;
    const rawAvg = aggregations._avg.value;
    const average = rawAvg !== null ? Math.round(rawAvg * 10) / 10 : null;

    return {
      count,
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
