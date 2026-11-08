import type { PrismaClient, Reading, TimeSlot } from "@prisma/client";
import { prisma } from "../../config/database.js";

export interface FindReadingsOptions {
  userId: string;
  skip?: number;
  take?: number;
  startDate?: Date;
  endDate?: Date;
  readingDate?: Date;
}

export interface IReadingsRepository {
  createReading(data: {
    userId: string;
    readingDate: Date;
    timeSlot: TimeSlot;
    glucoseValue: number;
  }): Promise<Reading>;
  findReadingById(id: string): Promise<Reading | null>;
  findReadingByIdAndUser(id: string, userId: string): Promise<Reading | null>;
  findReadingByUserAndSlot(
    userId: string,
    readingDate: Date,
    timeSlot: TimeSlot
  ): Promise<Reading | null>;
  countUserReadingsByDate(userId: string, readingDate: Date): Promise<number>;
  findReadings(options: FindReadingsOptions): Promise<Reading[]>;
  countReadings(options: Omit<FindReadingsOptions, "skip" | "take">): Promise<number>;
  updateReading(
    id: string,
    data: { readingDate?: Date; timeSlot?: TimeSlot; glucoseValue?: number }
  ): Promise<Reading>;
  deleteReading(id: string): Promise<Reading>;
}

export class ReadingsRepository implements IReadingsRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async createReading(data: {
    userId: string;
    readingDate: Date;
    timeSlot: TimeSlot;
    glucoseValue: number;
  }): Promise<Reading> {
    return this.db.reading.create({
      data: {
        userId: data.userId,
        readingDate: data.readingDate,
        timeSlot: data.timeSlot,
        glucoseValue: data.glucoseValue,
      },
    });
  }

  async findReadingById(id: string): Promise<Reading | null> {
    return this.db.reading.findUnique({
      where: { id },
    });
  }

  async findReadingByIdAndUser(id: string, userId: string): Promise<Reading | null> {
    return this.db.reading.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async findReadingByUserAndSlot(
    userId: string,
    readingDate: Date,
    timeSlot: TimeSlot
  ): Promise<Reading | null> {
    return this.db.reading.findUnique({
      where: {
        user_date_slot_unique: {
          userId,
          readingDate,
          timeSlot,
        },
      },
    });
  }

  async countUserReadingsByDate(userId: string, readingDate: Date): Promise<number> {
    return this.db.reading.count({
      where: {
        userId,
        readingDate,
      },
    });
  }

  async findReadings(options: FindReadingsOptions): Promise<Reading[]> {
    const { userId, skip = 0, take = 20, startDate, endDate, readingDate } = options;

    const where: Record<string, unknown> = { userId };

    if (readingDate) {
      where.readingDate = readingDate;
    } else if (startDate || endDate) {
      where.readingDate = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    return this.db.reading.findMany({
      where,
      skip,
      take,
      orderBy: [{ readingDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    });
  }

  async countReadings(options: Omit<FindReadingsOptions, "skip" | "take">): Promise<number> {
    const { userId, startDate, endDate, readingDate } = options;
    const where: Record<string, unknown> = { userId };

    if (readingDate) {
      where.readingDate = readingDate;
    } else if (startDate || endDate) {
      where.readingDate = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    return this.db.reading.count({ where });
  }

  async updateReading(
    id: string,
    data: { readingDate?: Date; timeSlot?: TimeSlot; glucoseValue?: number }
  ): Promise<Reading> {
    return this.db.reading.update({
      where: { id },
      data: {
        ...(data.readingDate ? { readingDate: data.readingDate } : {}),
        ...(data.timeSlot ? { timeSlot: data.timeSlot } : {}),
        ...(data.glucoseValue !== undefined ? { glucoseValue: data.glucoseValue } : {}),
      },
    });
  }

  async deleteReading(id: string): Promise<Reading> {
    return this.db.reading.delete({
      where: { id },
    });
  }
}

export const readingsRepository = new ReadingsRepository();
