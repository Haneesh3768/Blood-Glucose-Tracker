import bcrypt from "bcryptjs";
import { TimeSlot } from "@prisma/client";
import { prisma, pool } from "../src/config/database.js";
import { logger } from "../src/config/logger.js";

/**
 * Deterministic and Idempotent Database Seed Script
 * Populates one primary evaluation demo user and 60 days of sample readings
 * spanning the current and previous calendar months across all 4 clinical slots.
 */
async function main() {
  logger.info("🌱 Starting idempotent database seed for Sweety...");

  const demoEmail = "patient@sweety.app";
  const demoPlainPassword = "Password123!";
  const bcryptCost = 12;

  // 1. Idempotently upsert demo user
  const passwordHash = await bcrypt.hash(demoPlainPassword, bcryptCost);

  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (demoUser) {
    logger.info(`Demo user ${demoEmail} already exists. Resetting previous seed readings...`);
    // Remove existing readings for this demo user to guarantee a fresh deterministic baseline
    await prisma.reading.deleteMany({
      where: { userId: demoUser.id },
    });
    // Ensure demo password hash and display name are current
    demoUser = await prisma.user.update({
      where: { id: demoUser.id },
      data: {
        name: "Demo Patient",
        passwordHash,
      },
    });
  } else {
    demoUser = await prisma.user.create({
      data: {
        name: "Demo Patient",
        email: demoEmail,
        passwordHash,
      },
    });
    logger.info(`Created demo user: ${demoEmail} (ID: ${demoUser.id})`);
  }

  // 2. Generate 60 days of historical readings covering current and previous calendar months
  const now = new Date();
  const readingsData = [];

  // Seed 60 consecutive days backwards from today
  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - dayOffset);

    // Format as strict calendar UTC date (00:00:00 UTC)
    const calendarDate = new Date(
      Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    );

    // Pseudorandom deterministic values based on dayOffset for reproducible variance
    const fasting = 85 + (dayOffset % 16); // 85 - 100 mg/dl (Normal)
    const postBreakfast = 120 + ((dayOffset * 3) % 25); // 120 - 144 mg/dl (Normal/Target)
    const postLunch = 130 + ((dayOffset * 7) % 30); // 130 - 159 mg/dl (Normal to Elevated)
    const postDinner = 135 + ((dayOffset * 5) % 45); // 135 - 179 mg/dl (Elevated clinical variance)

    readingsData.push(
      {
        userId: demoUser.id,
        readingDate: calendarDate,
        timeSlot: TimeSlot.MORNING_FASTING,
        glucoseValue: fasting,
      },
      {
        userId: demoUser.id,
        readingDate: calendarDate,
        timeSlot: TimeSlot.AFTER_BREAKFAST,
        glucoseValue: postBreakfast,
      },
      {
        userId: demoUser.id,
        readingDate: calendarDate,
        timeSlot: TimeSlot.AFTER_LUNCH,
        glucoseValue: postLunch,
      },
      {
        userId: demoUser.id,
        readingDate: calendarDate,
        timeSlot: TimeSlot.AFTER_DINNER,
        glucoseValue: postDinner,
      }
    );
  }

  // Batch insert all 240 deterministic readings
  await prisma.reading.createMany({
    data: readingsData,
  });

  logger.info("==================================================");
  logger.info(`✅ Successfully seeded Sweety database:`);
  logger.info(`   - User:     ${demoEmail}`);
  logger.info(`   - Password: ${demoPlainPassword}`);
  logger.info(`   - Readings: ${readingsData.length} records across 60 days (4 slots/day)`);
  logger.info("==================================================");
}

main()
  .catch((e) => {
    logger.error(e, "Seeding error");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
