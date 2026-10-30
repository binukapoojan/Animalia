# ==============================================================================
# ANIMALIA — Production Multi-Stage Dockerfile
# Stage 1: Build Vite + React + TypeScript static assets
# Stage 2: Serve via high-performance Nginx Alpine with gzip and security headers
# ==============================================================================

# STAGE 1: Build Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# ==============================================================================
# STAGE 2: Production Nginx Runtime
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with gzip & security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Healthcheck for container orchestrators (Kubernetes / ECS / Docker Swarm)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
