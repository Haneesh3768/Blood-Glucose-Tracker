# Stage 1: Build Frontend SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace and build configuration
COPY package*.json ./
COPY tsconfig.base.json ./
COPY client/package*.json ./client/

# Install client dependencies
RUN npm ci --workspace=client

# Copy client source code
COPY client/ ./client/

# Compile production Vite distribution
WORKDIR /app/client
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS runner

# Copy compiled assets to Nginx default document root
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Replace default Nginx configuration with custom SPA reverse-proxy config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
