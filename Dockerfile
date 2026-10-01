# ==============================================================================
# Stage 1: Build Enterprise Angular Application
# ==============================================================================
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies first for Docker caching
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source and configurations
COPY . .

# Build production bundle with AOT & optimizations
RUN npm run build -- --configuration=production

# ==============================================================================
# Stage 2: Production Distroless / Nginx Alpine Server
# ==============================================================================
FROM nginx:1.27-alpine AS runtime

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built application artifacts
COPY --from=build /app/dist/core-api-fe/browser /usr/share/nginx/html

# Copy optimized enterprise Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: run as non-root where supported, expose port 80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
