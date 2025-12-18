# Sentarr

```
   ____            _                  
  / ___|  ___ _ __| |_ __ _ _ __ _ __ 
  \___ \ / _ \ '_ \ __/ _` | '__| '__|
   ___) |  __/ | | | || (_| | |  | |  
  |____/ \___|_| |_|\__\__,_|_|  |_|  
```

**Your Plex Server's Guardian** 🛡️

> Like Radarr for movies and Sonarr for TV shows, Sentarr stands watch over your Plex Media Server, alerting you to issues before they impact your users.

A comprehensive Docker container that monitors Plex Media Server logs in real-time and sends alerts when errors occur. Sentarr acts as a sentry, watching over your Plex server and catching streaming issues, database problems, and other errors before they impact your users.

## Features

- 🔍 **Real-time Log Monitoring** - Tails Plex logs and detects issues immediately
- 🎯 **Smart Pattern Detection** - Identifies specific error types:
  - Stream/Playback errors
  - Database errors
  - Network connectivity issues
  - Authentication problems
  - Scanner/Metadata issues
  - Disk I/O errors
- 📊 **Threshold-based Alerting** - Only alerts when error count exceeds threshold in time window
- 🔔 **Multiple Notification Channels**:
  - Email (SMTP)
  - Discord webhooks
  - Slack webhooks
  - Custom webhooks (Home Assistant, ntfy, Gotify, etc.)
- ⏱️ **Alert Throttling** - Configurable cooldown to prevent alert spam
- 🐳 **Docker-based** - Easy deployment and integration with existing stacks
- 📝 **Detailed Logging** - Tracks all detected issues with timestamps

## What It Detects (That Tautulli Might Miss)

- Backend errors before streams start
- Database corruption warnings
- Metadata/library scanning failures
- Authentication token issues
- Disk I/O problems
- Network connectivity issues
- Performance degradation warnings
- Transcoding failures at the system level

## Quick Start

### Complete docker-compose.yml Example

Here's a complete, ready-to-use docker-compose configuration:

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
    
    # IMPORTANT: Update this path to match your Plex logs location
    volumes:
      - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
    
    environment:
      # Log monitoring settings
      - PLEX_LOG_PATH=/config/Library/Application Support/Plex Media Server/Logs
      - MONITOR_ERRORS=true
      - MONITOR_WARNINGS=true
      
      # Alert thresholds
      - ERROR_THRESHOLD=5
      - TIME_WINDOW_MINUTES=5
      - ALERT_COOLDOWN_MINUTES=15
      
      # Email alerts (SMTP) - Update with your details
      - EMAIL_ENABLED=false
      - SMTP_SERVER=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=your-email@gmail.com
      - SMTP_PASSWORD=your-app-password
      - EMAIL_FROM=sentarr@yourdomain.com
      - EMAIL_TO=admin@yourdomain.com
      
      # Discord webhook
      - DISCORD_ENABLED=false
      - DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
      
      # Slack webhook
      - SLACK_ENABLED=false
      - SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
      
      # Custom webhook (Home Assistant, ntfy, etc.)
      - WEBHOOK_ENABLED=false
      - CUSTOM_WEBHOOK_URL=http://homeassistant.local:8123/api/webhook/plex_alert
    
    networks:
      - sentarr-network

  # API backend (for web dashboard)
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

  # Web dashboard (optional but recommended)
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

### Simplified Version (Monitoring Only, No Dashboard)

If you just want log monitoring without the web dashboard:

```yaml
version: '3.8'

services:
  sentarr:
    build: .
    container_name: sentarr
    restart: unless-stopped
    
    volumes:
      - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
    
    environment:
      - PLEX_LOG_PATH=/config/Library/Application Support/Plex Media Server/Logs
      - MONITOR_ERRORS=true
      - MONITOR_WARNINGS=true
      - ERROR_THRESHOLD=5
      - TIME_WINDOW_MINUTES=5
      - ALERT_COOLDOWN_MINUTES=15
      
      # Enable at least one notification method
      - DISCORD_ENABLED=true
      - DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL

networks:
  default:
    name: sentarr-network
```

### 1. Clone or Download Files

```bash
# Extract Sentarr
tar -xzf sentarr-complete.tar.gz
cd sentarr
```

### 2. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Update docker-compose.yml

**Important:** Update the volume mount path to match your Plex installation:

```yaml
volumes:
  # Change this path to match your Plex container's log volume
  - /path/to/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
```

**Finding Your Plex Log Path:**

If you're running Plex in Docker, check your Plex compose file for the config volume mount. For example:

```yaml
# In your Plex docker-compose.yml, you might see:
volumes:
  - /opt/plex/config:/config

# Then your monitor should use:
volumes:
  - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
```

### 4. Build and Run

```bash
# Build the container
docker-compose build

# Start all services
docker-compose up -d

# Access the web dashboard (if using complete version)
open http://localhost:3000

# Or view logs
docker-compose logs -f
```

### 5. Access the Dashboard

Once started, you can access:
- **Web Dashboard**: http://localhost:3000 (full monitoring interface)
- **API**: http://localhost:5000 (REST API endpoints)
- **Logs**: `docker-compose logs -f sentarr-monitor`

The dashboard provides:
- Real-time statistics and graphs
- Alert management (resolve, filter, search)
- System health monitoring
- Configuration management
- Notification testing

If you're only using the monitoring service (no dashboard), alerts will be sent directly to your configured notification channels.
```

## Configuration

### Monitoring Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MONITOR_ERRORS` | `true` | Monitor error-level log entries |
| `MONITOR_WARNINGS` | `true` | Monitor warning-level log entries |
| `ERROR_THRESHOLD` | `5` | Number of errors before alerting |
| `TIME_WINDOW_MINUTES` | `5` | Time window to count errors |
| `ALERT_COOLDOWN_MINUTES` | `15` | Cooldown between similar alerts |

### Email (SMTP) Configuration

```env
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=sentarr@yourdomain.com
EMAIL_TO=admin@yourdomain.com
```

**Gmail Users:** You must use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

### Discord Webhook

1. Go to your Discord server settings
2. Navigate to Integrations > Webhooks
3. Click "New Webhook" and copy the URL

```env
DISCORD_ENABLED=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

### Slack Webhook

1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Enable Incoming Webhooks
4. Add webhook to workspace and copy URL

```env
SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Custom Webhook

Great for integrations with:
- **Home Assistant** - Create an automation webhook
- **ntfy.sh** - Simple push notifications
- **Gotify** - Self-hosted notifications
- **Pushover** - Mobile push notifications
- Any custom API endpoint

```env
WEBHOOK_ENABLED=true
CUSTOM_WEBHOOK_URL=http://homeassistant.local:8123/api/webhook/plex_alert
```

The webhook receives JSON payloads like:

```json
{
  "title": "Multiple Stream Errors Detected",
  "message": "Detected 5 errors in the last 5 minutes",
  "severity": "error",
  "timestamp": "2025-12-18T10:30:00.000000",
  "details": {
    "Pattern": "stream_error",
    "Count": 5,
    "Time Window": "5 minutes",
    "Latest Error": "ERROR - Playback error: Connection timeout..."
  }
}
```

## Home Assistant Integration

### Step 1: Create Webhook Automation

In Home Assistant, create an automation that listens for the webhook:

```yaml
alias: Plex Alert Handler
description: Handle alerts from Sentarr
trigger:
  - platform: webhook
    allowed_methods:
      - POST
    local_only: false
    webhook_id: plex_alert
action:
  - service: notify.mobile_app_your_phone
    data:
      title: "{{ trigger.json.title }}"
      message: "{{ trigger.json.message }}"
      data:
        priority: high
        ttl: 0
        importance: high
        notification_icon: mdi:plex
```

### Step 2: Configure Monitor

```env
WEBHOOK_ENABLED=true
CUSTOM_WEBHOOK_URL=http://homeassistant.local:8123/api/webhook/plex_alert
```

## Portainer Deployment

### Using Portainer Stacks:

1. Go to **Stacks** > **Add Stack**
2. Name it `sentarr`
3. Choose **Upload** or paste the `docker-compose.yml`
4. Add environment variables in the Portainer UI, or use the `.env` file
5. Deploy!

### Using Portainer Compose:

1. Copy all files to your server
2. In Portainer, go to **Stacks** > **Add Stack**
3. Choose **Git Repository** or **Upload**
4. Configure environment variables
5. Deploy

## Monitoring & Logs

### View Container Logs

```bash
# Follow logs in real-time
docker-compose logs -f sentarr

# View last 100 lines
docker-compose logs --tail=100 sentarr
```

### Check Container Status

```bash
docker-compose ps
```

### Restart Container

```bash
docker-compose restart sentarr
```

## Error Patterns Detected

The monitor detects these specific error categories:

| Pattern | Description | Examples |
|---------|-------------|----------|
| `stream_error` | Playback and streaming failures | Buffering, connection drops, playback errors |
| `database_error` | Database issues | Corruption, lock errors, query failures |
| `network_error` | Network connectivity problems | Timeouts, DNS failures, connection refused |
| `auth_error` | Authentication failures | Invalid tokens, unauthorized access |
| `scanner_error` | Library scanning issues | Metadata fetch failures, scanner crashes |
| `disk_error` | Disk I/O problems | Read errors, disk full, permission denied |

## Troubleshooting

### Container won't start

**Check logs:**
```bash
docker-compose logs sentarr
```

**Common issues:**
- Incorrect volume mount path
- Missing environment variables
- Network connectivity issues

### No alerts being sent

1. **Check if errors are being detected:**
   ```bash
   docker-compose logs -f sentarr
   ```

2. **Verify configuration:**
   - Ensure at least one notification method is enabled
   - Check webhook URLs and credentials
   - Test with a low `ERROR_THRESHOLD` (e.g., 1)

3. **Test notification manually** (see Testing section)

### Alerts are too frequent

**Increase thresholds:**
```env
ERROR_THRESHOLD=10               # Require more errors
TIME_WINDOW_MINUTES=10           # Over a longer period
ALERT_COOLDOWN_MINUTES=30        # Longer cooldown
```

### Alerts are missing some errors

**Lower thresholds:**
```env
ERROR_THRESHOLD=3                # Alert on fewer errors
TIME_WINDOW_MINUTES=3            # Shorter time window
```

## Testing

### Test Discord Webhook

```bash
curl -X POST "YOUR_DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "Test Alert",
      "description": "This is a test from Sentarr",
      "color": 16753920
    }]
  }'
```

### Test Email Configuration

Use Python to test SMTP:

```python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText("Test email from Sentarr")
msg['Subject'] = "Test Alert"
msg['From'] = "your-email@gmail.com"
msg['To'] = "admin@yourdomain.com"

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login("your-email@gmail.com", "your-app-password")
    server.send_message(msg)
```

## Advanced Configuration

### Monitor Multiple Plex Instances

Create separate containers for each Plex instance:

```yaml
services:
  sentarr-main:
    # ... config for main Plex
    volumes:
      - /opt/plex-main/config/Logs:/config/Logs:ro
    environment:
      - EMAIL_TO=admin@domain.com

  sentarr-secondary:
    # ... config for secondary Plex
    volumes:
      - /opt/plex-secondary/config/Logs:/config/Logs:ro
    environment:
      - EMAIL_TO=admin@domain.com
```

### Integration with Existing Monitoring

The container outputs structured logs that can be ingested by:
- **Prometheus** - Use a log exporter
- **Grafana Loki** - Collect and visualize logs
- **ELK Stack** - Centralized log management

### Custom Error Patterns

Modify `app/monitor.py` to add custom patterns:

```python
ERROR_PATTERNS = {
    'custom_error': re.compile(r'your_pattern_here', re.IGNORECASE),
    # ... existing patterns
}
```

## Resource Usage

Typical resource consumption:
- **CPU**: < 5% (spikes during error processing)
- **Memory**: 50-100 MB
- **Disk**: Minimal (logs are read-only)
- **Network**: Only when sending alerts

## Security Considerations

- Logs are mounted **read-only** (`:ro`)
- No persistent storage required
- Credentials stored in environment variables
- Run with minimal permissions
- No external network access required (except for webhooks)

## Comparison with Tautulli

| Feature | Tautulli | Sentarr |
|---------|----------|--------------|
| Playback monitoring | ✅ Excellent | ✅ Good |
| User activity | ✅ Detailed | ❌ No |
| Statistics | ✅ Comprehensive | ❌ No |
| Backend errors | ⚠️ Limited | ✅ Comprehensive |
| Database issues | ❌ No | ✅ Yes |
| System-level errors | ❌ No | ✅ Yes |
| Real-time log monitoring | ❌ No | ✅ Yes |

**Recommendation:** Use **both** together for comprehensive monitoring:
- **Tautulli** for user activity and playback monitoring
- **Sentarr** for backend and system-level error detection

## Contributing

Feel free to submit issues, feature requests, or pull requests!

## License

MIT License - Feel free to use and modify as needed.

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review container logs
3. Verify configuration
4. Test notification channels manually

## Changelog

### Version 1.0.0
- Initial release
- Support for multiple notification channels
- Configurable error thresholds
- Real-time log monitoring
- Smart alert throttling
