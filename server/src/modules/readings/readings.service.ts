import { TimeSlot, type Reading } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../errors/AppError.js";
import type { IReadingsRepository } from "./readings.repository.js";
import { readingsRepository } from "./readings.repository.js";
import type {
  CreateReadingInput,
  GetReadingsQuery,
  PatchReadingInput,
  TimeSlotType,
  UpdateReadingInput,
} from "./readings.validator.js";

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
  glucoseValue: number;
  value: number; // backward compatibility alias
  createdAt: string;
  updatedAt: string;
}

export function formatReading(reading: Reading): FormattedReading {
  const year = reading.readingDate.getUTCFullYear();
  const month = String(reading.readingDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(reading.readingDate.getUTCDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  return {
    id: reading.id,
    userId: reading.userId,
    readingDate: formattedDate,
    timeSlot: ENUM_TO_SLOT[reading.timeSlot],
    glucoseValue: reading.glucoseValue,
    value: reading.glucoseValue,
    createdAt: reading.createdAt.toISOString(),
    updatedAt: reading.updatedAt.toISOString(),
  };
}

export function parseDateString(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetReadingsResult {
  readings: FormattedReading[];
  pagination: PaginationResult;
}

export class ReadingsService {
  constructor(private readonly repository: IReadingsRepository = readingsRepository) {}

  async createReading(userId: string, input: CreateReadingInput): Promise<FormattedReading> {
    const targetDate = parseDateString(input.readingDate);
    const targetSlot = SLOT_TO_ENUM[input.timeSlot];
    const displaySlot = input.timeSlot;

    // Rule 4: Check maximum 4 readings per day limit first
    const existingCount = await this.repository.countUserReadingsByDate(userId, targetDate);
    if (existingCount >= 4) {
      throw new BadRequestError("You can add only 4 readings per day.");
    }

    // Rule 3: Check if slot already exists for this date and user
    const existingSlotReading = await this.repository.findReadingByUserAndSlot(
      userId,
      targetDate,
      targetSlot
    );
    if (existingSlotReading) {
      throw new ConflictError(`You already have an ${displaySlot} reading for this date.`);
    }

    const valueToSave = input.glucoseValue !== undefined ? input.glucoseValue : input.value;

    try {
      const created = await this.repository.createReading({
        userId,
        readingDate: targetDate,
        timeSlot: targetSlot,
        glucoseValue: valueToSave,
      });

      return formatReading(created);
    } catch (err: any) {
      // Catch concurrent unique constraint race condition
      if (err?.code === "P2002" || err?.message?.includes("user_date_slot_unique")) {
        throw new ConflictError(`You already have an ${displaySlot} reading for this date.`);
      }
      throw err;
    }
  }

  async getReadings(
    userId: string,
    query: GetReadingsQuery
  ): Promise<GetReadingsResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
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

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1 && totalPages > 0;

    return {
      readings: records.map(formatReading),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async getReadingById(userId: string, id: string): Promise<FormattedReading> {
    const reading = await this.repository.findReadingByIdAndUser(id, userId);
    if (!reading) {
      throw new NotFoundError("Reading not found.");
    }

    return formatReading(reading);
  }

  async updateReading(
    userId: string,
    id: string,
    input: PatchReadingInput | UpdateReadingInput
  ): Promise<FormattedReading> {
    const existing = await this.repository.findReadingByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError("Reading not found.");
    }

    const targetDate = input.readingDate
      ? parseDateString(input.readingDate)
      : existing.readingDate;

    const targetSlot = input.timeSlot
      ? SLOT_TO_ENUM[input.timeSlot]
      : existing.timeSlot;

    const displaySlot = input.timeSlot ?? ENUM_TO_SLOT[existing.timeSlot];

    const hasValue = input.glucoseValue !== undefined || input.value !== undefined;
    const targetValue = hasValue
      ? (input.glucoseValue !== undefined ? input.glucoseValue : input.value)!
      : existing.glucoseValue;

    // If date or slot is modified, ensure no collision with another reading of the user
    const dateChanged = targetDate.getTime() !== existing.readingDate.getTime();
    const slotChanged = targetSlot !== existing.timeSlot;

    if (dateChanged || slotChanged) {
      const collision = await this.repository.findReadingByUserAndSlot(
        userId,
        targetDate,
        targetSlot
      );
      if (collision && collision.id !== id) {
        throw new ConflictError(`You already have an ${displaySlot} reading for this date.`);
      }

      if (dateChanged) {
        const countOnNewDate = await this.repository.countUserReadingsByDate(userId, targetDate);
        if (countOnNewDate >= 4) {
          throw new BadRequestError("You can add only 4 readings per day.");
        }
      }
    }

    try {
      const updated = await this.repository.updateReading(id, {
        readingDate: targetDate,
        timeSlot: targetSlot,
        glucoseValue: targetValue,
      });

      return formatReading(updated);
    } catch (err: any) {
      if (err?.code === "P2002" || err?.message?.includes("user_date_slot_unique")) {
        throw new ConflictError(`You already have an ${displaySlot} reading for this date.`);
      }
      throw err;
    }
  }

  async deleteReading(userId: string, id: string): Promise<{ id: string }> {
    const existing = await this.repository.findReadingByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError("Reading not found.");
    }

    await this.repository.deleteReading(id);
    return { id };
  }
}

export const readingsService = new ReadingsService();
