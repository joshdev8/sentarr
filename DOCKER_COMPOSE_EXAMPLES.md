# Sentarr - Docker Compose Examples

This file contains various docker-compose configurations for different use cases.

## 📋 Table of Contents

1. [Complete Setup (Monitor + API + Dashboard)](#complete-setup)
2. [Monitoring Only (No Dashboard)](#monitoring-only)
3. [Using Existing Plex Network](#existing-plex-network)
4. [Reverse Proxy Setup](#reverse-proxy-setup)
5. [Environment File Configuration](#environment-file-configuration)

---

## Complete Setup (Monitor + API + Dashboard)

**Recommended for most users.** Includes web dashboard for managing alerts.

```yaml
version: '3.8'

services:
  # Log monitoring service
  sentarr-monitor:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: sentarr-monitor
    restart: unless-stopped
    
    volumes:
      # CHANGE THIS to your Plex log path
      - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
    
    environment:
      - PLEX_LOG_PATH=/config/Library/Application Support/Plex Media Server/Logs
      - MONITOR_ERRORS=true
      - MONITOR_WARNINGS=true
      - ERROR_THRESHOLD=5
      - TIME_WINDOW_MINUTES=5
      - ALERT_COOLDOWN_MINUTES=15
      
      # Notification channels
      - EMAIL_ENABLED=false
      - DISCORD_ENABLED=false
      - SLACK_ENABLED=false
      - WEBHOOK_ENABLED=false
    
    networks:
      - sentarr-network

  # API backend
  sentarr-api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: sentarr-api
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - API_HOST=0.0.0.0
      - API_PORT=5000
    networks:
      - sentarr-network
    depends_on:
      - sentarr-monitor

  # Web dashboard
  sentarr-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sentarr-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - sentarr-network
    depends_on:
      - sentarr-api

networks:
  sentarr-network:
    driver: bridge
```

**Access:**
- Dashboard: http://localhost:3000
- API: http://localhost:5000

---

## Monitoring Only (No Dashboard)

**Lightweight option.** Just log monitoring with notifications.

```yaml
version: '3.8'

services:
  sentarr:
    build: .
    container_name: sentarr
    restart: unless-stopped
    
    volumes:
      # CHANGE THIS to your Plex log path
      - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
    
    environment:
      - PLEX_LOG_PATH=/config/Library/Application Support/Plex Media Server/Logs
      - MONITOR_ERRORS=true
      - MONITOR_WARNINGS=true
      - ERROR_THRESHOLD=5
      - TIME_WINDOW_MINUTES=5
      - ALERT_COOLDOWN_MINUTES=15
      
      # Discord notification (example)
      - DISCORD_ENABLED=true
      - DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
      
      # Or Email
      # - EMAIL_ENABLED=true
      # - SMTP_SERVER=smtp.gmail.com
      # - SMTP_PORT=587
      # - SMTP_USER=your-email@gmail.com
      # - SMTP_PASSWORD=your-app-password
      # - EMAIL_FROM=sentarr@yourdomain.com
      # - EMAIL_TO=admin@yourdomain.com

networks:
  default:
    name: sentarr-network
```

---

## Using Existing Plex Network

**Connect to your existing Plex network** for easier integration.

```yaml
version: '3.8'

services:
  sentarr-monitor:
    build: .
    container_name: sentarr-monitor
    restart: unless-stopped
    
    volumes:
      # If Plex is on the same host, use the same path
      - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
    
    environment:
      - PLEX_LOG_PATH=/config/Library/Application Support/Plex Media Server/Logs
      - MONITOR_ERRORS=true
      - MONITOR_WARNINGS=true
      - ERROR_THRESHOLD=5
      - TIME_WINDOW_MINUTES=5
      - ALERT_COOLDOWN_MINUTES=15
      - DISCORD_ENABLED=true
      - DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
    
    # Connect to existing Plex network
    networks:
      - plex

  sentarr-api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: sentarr-api
    restart: unless-stopped
    ports:
      - "5000:5000"
    networks:
      - plex
    depends_on:
      - sentarr-monitor

  sentarr-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sentarr-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - plex
    depends_on:
      - sentarr-api

networks:
  plex:
    external: true
```

**Note:** Replace `plex` with your actual Plex network name. Find it with:
```bash
docker network ls
```

---

## Reverse Proxy Setup

**For production deployment** behind Nginx, Traefik, or Caddy.

### With Nginx Proxy Manager

```yaml
version: '3.8'

services:
  sentarr-monitor:
    build: .
    container_name: sentarr-monitor
    restart: unless-stopped
    volumes:
      - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
    environment:
      - PLEX_LOG_PATH=/config/Library/Application Support/Plex Media Server/Logs
      - MONITOR_ERRORS=true
      - MONITOR_WARNINGS=true
      - ERROR_THRESHOLD=5
      - DISCORD_ENABLED=true
      - DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
    networks:
      - proxy

  sentarr-api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: sentarr-api
    restart: unless-stopped
    expose:
      - "5000"
    networks:
      - proxy
    depends_on:
      - sentarr-monitor

  sentarr-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sentarr-frontend
    restart: unless-stopped
    expose:
      - "80"
    networks:
      - proxy
    depends_on:
      - sentarr-api

networks:
  proxy:
    external: true
```

### With Traefik

```yaml
version: '3.8'

services:
  sentarr-monitor:
    build: .
    container_name: sentarr-monitor
    restart: unless-stopped
    volumes:
      - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
    environment:
      - PLEX_LOG_PATH=/config/Library/Application Support/Plex Media Server/Logs
      - MONITOR_ERRORS=true
      - ERROR_THRESHOLD=5
      - DISCORD_ENABLED=true
      - DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
    networks:
      - traefik

  sentarr-api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: sentarr-api
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.sentarr-api.rule=Host(`sentarr-api.yourdomain.com`)"
      - "traefik.http.routers.sentarr-api.entrypoints=websecure"
      - "traefik.http.routers.sentarr-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.sentarr-api.loadbalancer.server.port=5000"
    depends_on:
      - sentarr-monitor

  sentarr-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sentarr-frontend
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.sentarr.rule=Host(`sentarr.yourdomain.com`)"
      - "traefik.http.routers.sentarr.entrypoints=websecure"
      - "traefik.http.routers.sentarr.tls.certresolver=letsencrypt"
      - "traefik.http.services.sentarr.loadbalancer.server.port=80"
    depends_on:
      - sentarr-api

networks:
  traefik:
    external: true
```

---

## Environment File Configuration

**Best practice:** Use a `.env` file instead of environment variables in docker-compose.

### docker-compose.yml

```yaml
version: '3.8'

services:
  sentarr-monitor:
    build: .
    container_name: sentarr-monitor
    restart: unless-stopped
    volumes:
      - ${PLEX_LOG_PATH}:/config/Library/Application Support/Plex Media Server/Logs:ro
    env_file:
      - .env
    networks:
      - sentarr-network

  sentarr-api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: sentarr-api
    restart: unless-stopped
    ports:
      - "${API_PORT:-5000}:5000"
    env_file:
      - .env
    networks:
      - sentarr-network

  sentarr-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sentarr-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-3000}:80"
    networks:
      - sentarr-network

networks:
  sentarr-network:
    driver: bridge
```

### .env file

```bash
# Sentarr Configuration

# Plex Configuration
PLEX_LOG_PATH=/opt/plex/config/Library/Application Support/Plex Media Server/Logs

# Monitoring Settings
MONITOR_ERRORS=true
MONITOR_WARNINGS=true
ERROR_THRESHOLD=5
TIME_WINDOW_MINUTES=5
ALERT_COOLDOWN_MINUTES=15

# Port Configuration
API_PORT=5000
FRONTEND_PORT=3000

# Email Notifications
EMAIL_ENABLED=false
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=sentarr@yourdomain.com
EMAIL_TO=admin@yourdomain.com

# Discord Webhook
DISCORD_ENABLED=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL

# Slack Webhook
SLACK_ENABLED=false
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Custom Webhook
WEBHOOK_ENABLED=false
CUSTOM_WEBHOOK_URL=http://homeassistant.local:8123/api/webhook/plex_alert
```

---

## Common Configurations

### Change Ports

```yaml
sentarr-api:
  ports:
    - "8080:5000"  # API on port 8080

sentarr-frontend:
  ports:
    - "8081:80"    # Dashboard on port 8081
```

### Add Resource Limits

```yaml
sentarr-monitor:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 256M
      reservations:
        memory: 128M
```

### Enable Healthchecks

```yaml
sentarr-api:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/api/system/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### Use Pre-built Images (if available)

```yaml
sentarr-monitor:
  image: sentarr/monitor:latest
  # Remove the 'build' section
```

---

## Finding Your Plex Log Path

### If Plex is in Docker

```bash
# Check your Plex container
docker inspect plex | grep -A 10 Mounts

# Or check your docker-compose
cat docker-compose.yml | grep -A 5 "plex:"
```

### Common Plex Paths

- Docker: `/opt/plex/config/Library/Application Support/Plex Media Server/Logs`
- Unraid: `/mnt/user/appdata/plex/Library/Application Support/Plex Media Server/Logs`
- Synology: `/volume1/docker/plex/Library/Application Support/Plex Media Server/Logs`
- Windows: `C:\Users\USERNAME\AppData\Local\Plex Media Server\Logs`
- macOS: `~/Library/Application Support/Plex Media Server/Logs`
- Linux: `/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Logs`

---

## Testing Your Setup

```bash
# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Test API
curl http://localhost:5000/api/system/health

# Access dashboard
open http://localhost:3000

# Generate test alert (API endpoint)
curl -X POST http://localhost:5000/api/debug/create-alert \
  -H "Content-Type: application/json" \
  -d '{"severity": "warning", "pattern": "stream_error"}'
```

---

## Troubleshooting

### Containers won't start
```bash
docker-compose logs
```

### Can't access dashboard
```bash
docker-compose ps
docker-compose restart sentarr-frontend
```

### Monitor not detecting errors
```bash
# Check log path
docker exec sentarr-monitor ls -la /config/Library/Application\ Support/Plex\ Media\ Server/Logs/

# View monitor logs
docker-compose logs sentarr-monitor
```

---

**Choose the configuration that best fits your needs and customize as needed!**
