FROM node:22-alpine AS builder

WORKDIR /app

# Copy root configuration and client package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --workspace=client

# Copy client source
COPY client/ ./client/

# Build client
WORKDIR /app/client
RUN npm run build

# Nginx stage for serving production build
FROM nginx:alpine AS runner

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
