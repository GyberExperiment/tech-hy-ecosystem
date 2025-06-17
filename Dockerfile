# 🚀 TECH HY Ecosystem Frontend Dockerfile
# Production-grade: nginx:alpine with minimal config

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package files
COPY frontend/package*.json ./
COPY frontend/.npmrc* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build the application
RUN npm run build

# Stage 2: Production runtime with nginx:alpine
FROM nginx:alpine AS production

# Remove default nginx static assets and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized nginx configuration for React SPA
COPY docker/nginx-minimal.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Labels for better container management
LABEL maintainer="TECH HY Team <i@techhy.me>"
LABEL version="1.0.0"
LABEL description="TECH HY Ecosystem DeFi Frontend - Production Grade"
LABEL org.opencontainers.image.source="https://github.com/GyberExperiment/tech-hy-ecosystem"

# Start nginx (default CMD from nginx:alpine)
CMD ["nginx", "-g", "daemon off;"] 