# Sentarr - Single Container Edition

```
   ____            _                  
  / ___|  ___ _ __| |_ __ _ _ __ _ __ 
  \___ \ / _ \ '_ \ __/ _` | '__| '__|
   ___) |  __/ | | | || (_| | |  | |  
  |____/ \___|_| |_|\__\__,_|_|  |_|  
```

**Your Plex Server's Guardian** 🛡️

> Like Radarr, Sonarr, and the other *arr apps - a single container solution for monitoring your Plex Media Server.

## 🎯 What's Different About This Version?

**All-in-One Container** - Everything runs in a single container:
- ✅ Log monitoring service
- ✅ REST API backend  
- ✅ Web dashboard (React/TypeScript)
- ✅ Plex API integration
- ✅ Notification system

Just like Radarr/Sonarr - one container, one port, simple setup!

## 🚀 Quick Start (60 Seconds)

### 1. Get Your Plex Token

Visit: https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  sentarr:
    image: sentarr/sentarr:latest  # Or build locally
    container_name: sentarr
    restart: unless-stopped
    
    ports:
      - "3000:3000"
    
    volumes:
      # Update this path to your Plex logs
      - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/logs:ro
    
    environment:
      # Plex Connection
      - PLEX_API_ENABLED=true
      - PLEX_URL=http://plex:32400
      - PLEX_TOKEN=your-plex-token-here
      
      # Monitoring
      - PLEX_LOG_PATH=/logs
      - MONITOR_ERRORS=true
      - ERROR_THRESHOLD=5
      
      # Notifications (enable at least one)
      - DISCORD_ENABLED=true
      - DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_URL
    
    # Connect to Plex network
    networks:
      - plex

networks:
  plex:
    external: true
```

### 3. Start It

```bash
docker-compose up -d
```

### 4. Access Dashboard

Open: http://localhost:3000

## 📦 What's Included?

### Web Dashboard
- Real-time statistics and metrics
- Error timeline graphs
- Active stream monitoring (via Plex API)
- Alert management
- Configuration interface

### Monitoring
- **Log Analysis** - Parses Plex logs for errors
- **API Monitoring** - Tracks server health via Plex API
- **Stream Tracking** - Monitors active playback sessions
- **Pattern Detection** - Identifies specific error types

### Alerts
- Multiple notification channels (Email, Discord, Slack, Webhooks)
- Smart throttling (prevents spam)
- Configurable thresholds
- Detailed error context

## 🔧 Configuration

### Minimal Setup

```yaml
services:
  sentarr:
    image: sentarr/sentarr:latest
    ports:
      - "3000:3000"
    volumes:
      - /path/to/plex/logs:/logs:ro
    environment:
      - PLEX_LOG_PATH=/logs
      - DISCORD_ENABLED=true
      - DISCORD_WEBHOOK_URL=https://...
```

### Full Setup with Plex API

```yaml
services:
  sentarr:
    image: sentarr/sentarr:latest
    ports:
      - "3000:3000"
    volumes:
      - /path/to/plex/logs:/logs:ro
      - ./sentarr-config:/config  # Optional: persist settings
    environment:
      # Plex API Integration
      - PLEX_API_ENABLED=true
      - PLEX_URL=http://plex:32400
      - PLEX_TOKEN=your-token
      
      # Log Monitoring
      - PLEX_LOG_PATH=/logs
      - MONITOR_ERRORS=true
      - MONITOR_WARNINGS=true
      - ERROR_THRESHOLD=5
      - TIME_WINDOW_MINUTES=5
      - ALERT_COOLDOWN_MINUTES=15
      
      # Discord
      - DISCORD_ENABLED=true
      - DISCORD_WEBHOOK_URL=https://...
      
      # Email
      - EMAIL_ENABLED=true
      - SMTP_SERVER=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=user@gmail.com
      - SMTP_PASSWORD=app-password
      - EMAIL_TO=admin@domain.com
```

## 🌐 Accessing from Other Devices

### Local Network

```
http://YOUR_SERVER_IP:3000
```

### Reverse Proxy (Recommended for Remote Access)

#### Nginx

```nginx
server {
    listen 80;
    server_name sentarr.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Traefik Labels

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.sentarr.rule=Host(`sentarr.yourdomain.com`)"
  - "traefik.http.services.sentarr.loadbalancer.server.port=3000"
```

## 🔗 Plex API Integration

### Why Enable Plex API?

**Enhanced Features:**
- See who's currently streaming
- Monitor transcoding in real-time
- Detect library scanning issues
- Correlate errors with specific users/media
- Track server performance

### Setup Guide

See [PLEX_API_SETUP.md](./PLEX_API_SETUP.md) for detailed instructions.

**Quick version:**

1. Get token: https://support.plex.tv/articles/204059436
2. Find your Plex URL (usually `http://plex:32400` if in Docker)
3. Add to docker-compose:
   ```yaml
   - PLEX_API_ENABLED=true
   - PLEX_URL=http://plex:32400
   - PLEX_TOKEN=your-token-here
   ```

### Without Plex API

Sentarr works fine without API access - it just monitors logs. You'll miss:
- Active stream tracking
- Real-time server stats
- User-specific error correlation

## 📊 Dashboard Features

### Main Dashboard
- Server health status
- Active alerts count
- Error timeline (last hour)
- Alert distribution chart
- Recent alerts feed
- Active streams (with API)

### Alerts Page
- View all active alerts
- Filter by severity
- Resolve with notes
- Detailed error context
- Quick actions

### Settings
- Adjust thresholds
- Test notifications
- Enable/disable channels
- Configure monitoring

## 🐳 Docker Tips

### Use with Portainer

1. Stacks → Add Stack
2. Paste docker-compose.yml
3. Add environment variables
4. Deploy

### Resource Usage

Typical usage:
- CPU: 2-5%
- RAM: 256-512 MB
- Disk: < 1 GB

### Logs

```bash
# View all logs
docker logs sentarr

# Follow logs
docker logs -f sentarr

# Specific service
docker exec sentarr tail -f /var/log/supervisor/monitor.log
```

### Restart Services

```bash
# Restart container
docker restart sentarr

# Restart specific service inside container
docker exec sentarr supervisorctl restart monitor
docker exec sentarr supervisorctl restart api
docker exec sentarr supervisorctl restart nginx
```

## 🔍 Finding Your Plex Log Path

### Docker Plex

```bash
# Check your Plex container
docker inspect plex | grep -A 5 Mounts

# Common paths:
# - /opt/plex/config/Library/Application Support/Plex Media Server/Logs
# - /mnt/user/appdata/plex/Library/Application Support/Plex Media Server/Logs
```

### Plex docker-compose.yml

Look for the config volume mount:
```yaml
services:
  plex:
    volumes:
      - /opt/plex/config:/config
```

Then use: `/opt/plex/config/Library/Application Support/Plex Media Server/Logs`

## 🎨 Customization

### Change Port

```yaml
ports:
  - "8080:3000"  # Access at :8080
```

### Add to Existing Network

```yaml
networks:
  - plex
  - traefik

networks:
  plex:
    external: true
  traefik:
    external: true
```

### Persist Configuration

```yaml
volumes:
  - ./sentarr-data:/config
```

## 🐛 Troubleshooting

### Dashboard won't load

```bash
# Check container is running
docker ps | grep sentarr

# Check logs
docker logs sentarr

# Restart
docker restart sentarr
```

### Can't connect to Plex API

```bash
# Test from inside container
docker exec sentarr curl http://plex:32400/identity

# Check network
docker exec sentarr ping plex
```

### No alerts appearing

1. Check log path is correct
2. Verify at least one notification channel is enabled
3. Check error threshold settings
4. Generate test error in Plex

### High CPU/Memory

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
```

## 📱 Mobile Access

The dashboard is fully responsive and works great on mobile devices. Just access via your server's IP:

```
http://192.168.1.100:3000
```

## 🔄 Updates

```bash
# Pull latest image
docker pull sentarr/sentarr:latest

# Restart with new image
docker-compose up -d

# Or rebuild locally
docker-compose build --no-cache
docker-compose up -d
```

## 🆚 Comparison with Multi-Container

| Feature | Single Container | Multi-Container |
|---------|-----------------|-----------------|
| Setup | ✅ Easier | ⚠️ More complex |
| Ports | 1 (3000) | 2 (3000, 5000) |
| Resources | Lower | Higher |
| Maintenance | Simple | Moderate |
| Scaling | Limited | Better |
| Development | Harder | Easier |

**Single container is recommended for most users** - it's simpler and uses fewer resources.

## 📚 Documentation

- [Plex API Setup](./PLEX_API_SETUP.md) - How to get and use your Plex token
- [Docker Compose Examples](./DOCKER_COMPOSE_EXAMPLES.md) - Various configurations
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and fixes

## 🤝 Integration with Other *arr Apps

Sentarr plays nice with your existing stack:

```yaml
version: '3.8'
services:
  plex:
    # ...
  radarr:
    # ...
  sonarr:
    # ...
  sentarr:
    # ... same network, same simplicity
```

All in the same network, all with the same pattern - just works! 🎉

---

**Sentarr** - Your Plex Server's Guardian 🛡️
