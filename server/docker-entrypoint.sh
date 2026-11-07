#!/bin/sh
set -e

echo "==> Running Prisma database migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_STARTUP" = "true" ]; then
  echo "==> Seeding database with demo patient and clinical readings..."
  npm run seed || echo "==> Seeding skipped or already applied."
fi

echo "==> Starting Sweety Backend API..."
exec "$@"

