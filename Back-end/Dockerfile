# Backend Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first (caching)
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Check if .env exists, otherwise warn (Prisma needs it for some generators but usually mostly for runtime)
# We will rely on env vars at runtime or build time.
# Generate Prisma Client
# Generate Prisma Client
# We need a dummy DATABASE_URL because prisma.config.ts requires it, even for generation
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" ./node_modules/.bin/prisma generate

# Build TypeScript
RUN ./node_modules/.bin/tsc

# Production stage
FROM node:20-slim

WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && apt-get install -y openssl \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Expose port
EXPOSE 4000

# Run migrations then start server
CMD ["sh", "entrypoint.sh"]
