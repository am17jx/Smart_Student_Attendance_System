# Stage 1: Build React/Vite App
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build production files
RUN npm run build


# Stage 2: Serve static files (NO NGINX)
FROM node:20-alpine

WORKDIR /app

# Install simple static server
RUN npm install -g serve

# Copy build output
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 80

# Run frontend
CMD ["serve", "-s", "dist", "-l", "80"]