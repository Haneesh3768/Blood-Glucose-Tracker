# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace and build configuration
COPY package*.json ./
COPY tsconfig.base.json ./
COPY server/package*.json ./server/

# Install server dependencies
RUN npm ci --workspace=server

# Copy server source code and schema
COPY server/ ./server/

# Generate Prisma Client and compile TypeScript
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

# Install OpenSSL for Prisma engine binary compatibility in Alpine
RUN apk add --no-cache openssl wget

# Copy workspace dependencies and built artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/prisma.config.ts ./server/
COPY --from=builder /app/server/docker-entrypoint.sh ./server/docker-entrypoint.sh

# Ensure non-root ownership and executable entrypoint
RUN chmod +x /app/server/docker-entrypoint.sh && \
    chown -R node:node /app

USER node

WORKDIR /app/server

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://localhost:5000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["/app/server/docker-entrypoint.sh"]
CMD ["node", "dist/src/index.js"]
