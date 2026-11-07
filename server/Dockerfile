FROM node:22-alpine AS builder

WORKDIR /app

# Copy root configuration and server package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --workspace=server

# Copy server source
COPY server/ ./server/

# Build server
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/prisma.config.ts ./

EXPOSE 5000

CMD ["node", "dist/src/index.js"]
