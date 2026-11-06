import bcrypt from "bcryptjs";
import { TimeSlot } from "@prisma/client";
import { prisma, pool } from "../src/config/database.js";
import { logger } from "../src/config/logger.js";

async function main() {
  logger.info("🌱 Seeding Sweety database...");

  // Clean existing demo user if present
  const demoEmail = "patient@sweety.app";
  await prisma.user.deleteMany({
    where: { email: demoEmail },
  });

  const passwordHash = await bcrypt.hash("Password123!", 12);
  const demoUser = await prisma.user.create({
    data: {
      name: "Demo Patient",
      email: demoEmail,
      passwordHash,
    },
  });

  logger.info(`Created demo user: ${demoUser.email} (ID: ${demoUser.id})`);

  // Create readings across previous month and current month
  const now = new Date();
  const readingsData = [];

  // Generate 30 days of sample readings
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateOnly = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    // Realistic glycemic patterns
    readingsData.push(
      {
        userId: demoUser.id,
        readingDate: dateOnly,
        timeSlot: TimeSlot.MORNING_FASTING,
        value: 85 + (i % 15),
      },
      {
        userId: demoUser.id,
        readingDate: dateOnly,
        timeSlot: TimeSlot.AFTER_BREAKFAST,
        value: 125 + (i % 25),
      },
      {
        userId: demoUser.id,
        readingDate: dateOnly,
        timeSlot: TimeSlot.AFTER_LUNCH,
        value: 135 + (i % 20),
      },
      {
        userId: demoUser.id,
        readingDate: dateOnly,
        timeSlot: TimeSlot.AFTER_DINNER,
        value: 140 + (i % 30),
      }
    );
  }

  await prisma.reading.createMany({
    data: readingsData,
  });

  logger.info(`✅ Seeded ${readingsData.length} readings for demo patient.`);
}

main()
  .catch((e) => {
    logger.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
