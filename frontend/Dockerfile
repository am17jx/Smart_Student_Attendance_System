# Stage 1: Build React/Vite App
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Pass VITE_API_URL from build args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build production files
RUN npm run build


# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]