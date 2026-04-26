# Backend Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first (caching)
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
RUN npm install

# Copy source — ARG forces cache bust on every deploy
ARG CACHEBUST=1
COPY . .

# Generate Prisma Client
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

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Create logs directory with correct permissions
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/package*.json ./
COPY --chown=appuser:appgroup --from=builder /app/prisma ./prisma
COPY --chown=appuser:appgroup --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy entrypoint script
COPY --chown=appuser:appgroup entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER appuser

# Expose port
EXPOSE 4000

# Run migrations then start server
CMD ["sh", "entrypoint.sh"]