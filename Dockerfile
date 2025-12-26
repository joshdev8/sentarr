FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Final stage - Python with everything
FROM python:3.11-slim

# Install Node.js for serving frontend and nginx for reverse proxy
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
RUN pip install --no-cache-dir flask flask-cors requests plexapi

# Copy Python services
COPY app/monitor.py /app/monitor.py
COPY api/server.py /app/api.py

# Copy built frontend (Vite outputs to dist/)
COPY --from=frontend-builder /app/frontend/dist /app/frontend

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/sites-available/default

# Copy supervisor config
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create necessary directories
RUN mkdir -p /var/log/supervisor /var/log/nginx

# Expose port
EXPOSE 6500

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:6500/api/system/health || exit 1

# Start supervisor (manages all services)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
