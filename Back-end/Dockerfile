# Backend Dockerfile
FROM node:20-alpine AS builder

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
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build TypeScript
RUN npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "dist/src/server.js"]
