import { TimeSlot, type Reading } from "@prisma/client";
import { ConflictError, ForbiddenError, NotFoundError } from "../../errors/AppError.js";
import type { IReadingsRepository } from "./readings.repository.js";
import { readingsRepository } from "./readings.repository.js";
import type { CreateReadingInput, GetReadingsQuery, TimeSlotType, UpdateReadingInput } from "./readings.validator.js";

export const SLOT_TO_ENUM: Record<TimeSlotType, TimeSlot> = {
  "Morning (fasting)": TimeSlot.MORNING_FASTING,
  "After breakfast": TimeSlot.AFTER_BREAKFAST,
  "After lunch": TimeSlot.AFTER_LUNCH,
  "After dinner": TimeSlot.AFTER_DINNER,
};

export const ENUM_TO_SLOT: Record<TimeSlot, TimeSlotType> = {
  [TimeSlot.MORNING_FASTING]: "Morning (fasting)",
  [TimeSlot.AFTER_BREAKFAST]: "After breakfast",
  [TimeSlot.AFTER_LUNCH]: "After lunch",
  [TimeSlot.AFTER_DINNER]: "After dinner",
};

export interface FormattedReading {
  id: string;
  userId: string;
  readingDate: string; // YYYY-MM-DD
  timeSlot: TimeSlotType;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export function formatReading(reading: Reading): FormattedReading {
  const year = reading.readingDate.getFullYear();
  const month = String(reading.readingDate.getMonth() + 1).padStart(2, "0");
  const day = String(reading.readingDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  return {
    id: reading.id,
    userId: reading.userId,
    readingDate: formattedDate,
    timeSlot: ENUM_TO_SLOT[reading.timeSlot],
    value: reading.value,
    createdAt: reading.createdAt.toISOString(),
    updatedAt: reading.updatedAt.toISOString(),
  };
}

export function parseDateString(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
}

export class ReadingsService {
  constructor(private readonly repository: IReadingsRepository = readingsRepository) {}

  async createReading(userId: string, input: CreateReadingInput): Promise<FormattedReading> {
    const targetDate = parseDateString(input.readingDate);
    const targetSlot = SLOT_TO_ENUM[input.timeSlot];

    // Rule 1: Check if slot already exists for this date and user
    const existingSlotReading = await this.repository.findReadingByUserAndSlot(
      userId,
      targetDate,
      targetSlot
    );
    if (existingSlotReading) {
      throw new ConflictError(`You already have an ${input.timeSlot} reading for this date.`);
    }

    // Rule 2: Check maximum 4 readings per day limit
    const existingCount = await this.repository.countUserReadingsByDate(userId, targetDate);
    if (existingCount >= 4) {
      throw new ConflictError("You can add only 4 readings per day.");
    }

    const created = await this.repository.createReading({
      userId,
      readingDate: targetDate,
      timeSlot: targetSlot,
      value: input.value,
    });

    return formatReading(created);
  }

  async getReadings(
    userId: string,
    query: GetReadingsQuery
  ): Promise<{
    readings: FormattedReading[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const startDate = query.startDate ? parseDateString(query.startDate) : undefined;
    const endDate = query.endDate ? parseDateString(query.endDate) : undefined;
    const readingDate = query.date ? parseDateString(query.date) : undefined;

    const [records, total] = await Promise.all([
      this.repository.findReadings({
        userId,
        skip,
        take: limit,
        startDate,
        endDate,
        readingDate,
      }),
      this.repository.countReadings({
        userId,
        startDate,
        endDate,
        readingDate,
      }),
    ]);

    return {
      readings: records.map(formatReading),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getReadingById(userId: string, id: string): Promise<FormattedReading> {
    const reading = await this.repository.findReadingById(id);
    if (!reading) {
      throw new NotFoundError("Reading not found.");
    }

    if (reading.userId !== userId) {
      throw new ForbiddenError("You do not have access to this reading.");
    }

    return formatReading(reading);
  }

  async updateReading(
    userId: string,
    id: string,
    input: UpdateReadingInput
  ): Promise<FormattedReading> {
    const existing = await this.repository.findReadingById(id);
    if (!existing) {
      throw new NotFoundError("Reading not found.");
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError("You do not have access to modify this reading.");
    }

    const targetDate = parseDateString(input.readingDate);
    const targetSlot = SLOT_TO_ENUM[input.timeSlot];

    // Check collision on another reading with the same slot and date
    const collision = await this.repository.findReadingByUserAndSlot(
      userId,
      targetDate,
      targetSlot
    );
    if (collision && collision.id !== id) {
      throw new ConflictError(`You already have an ${input.timeSlot} reading for this date.`);
    }

    const updated = await this.repository.updateReading(id, {
      readingDate: targetDate,
      timeSlot: targetSlot,
      value: input.value,
    });

    return formatReading(updated);
  }

  async deleteReading(userId: string, id: string): Promise<{ id: string }> {
    const existing = await this.repository.findReadingById(id);
    if (!existing) {
      throw new NotFoundError("Reading not found.");
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError("You do not have access to delete this reading.");
    }

    await this.repository.deleteReading(id);
    return { id };
  }
}

export const readingsService = new ReadingsService();

