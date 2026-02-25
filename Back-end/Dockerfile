# Backend Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first (caching)
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

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "dist/src/server.js"]
