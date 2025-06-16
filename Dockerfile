# 🚀 TECH HY Ecosystem Frontend Dockerfile
# Multi-stage build for optimized production image

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

# Stage 2: Production runtime
FROM nginxinc/nginx-unprivileged:alpine AS production

# Install envsubst for runtime environment substitution
USER root
RUN apk add --no-cache gettext
USER 101

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copy environment template and startup script
COPY docker/env.template.js /usr/share/nginx/html/env.template.js
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh

# Make script executable and give nginx user ownership
USER root
RUN chmod +x /docker-entrypoint.sh && \
    chown -R 101:101 /usr/share/nginx/html /docker-entrypoint.sh
USER 101

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Labels for better container management
LABEL maintainer="TECH HY Team <i@techhy.me>"
LABEL version="1.0.0"
LABEL description="TECH HY Ecosystem DeFi Frontend"
LABEL org.opencontainers.image.source="https://github.com/GyberExperiment/tech-hy-ecosystem"

# Use custom entrypoint for environment variable substitution
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 