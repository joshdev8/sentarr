# Sentarr - Quick Start Guide

## For the Impatient

```bash
# 1. Run the setup wizard
./setup.sh

# 2. Build and start
docker-compose build
docker-compose up -d

# 3. Watch it work
docker-compose logs -f sentarr
```

## Manual Setup (5 minutes)

### 1. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Minimum required settings:**
- Set at least one notification method to `true`
- Add corresponding webhook URL or SMTP credentials

### 2. Update Volume Mount

Edit `docker-compose.yml` and change this line:

```yaml
- /path/to/plex/config/Library/Application Support/Plex Media Server/Logs:/config/Library/Application Support/Plex Media Server/Logs:ro
```

Replace `/path/to/plex/config` with your actual Plex config directory.

**Finding your Plex config path:**
```bash
# If using Docker, check your Plex container
docker inspect plex | grep -A 5 "Mounts"

# Or check Portainer > Containers > plex > Inspect > Volumes
```

### 3. Deploy

```bash
# Build the container
docker-compose build

# Start in background
docker-compose up -d

# Follow logs
docker-compose logs -f sentarr
```

## Test Notification

To verify your notifications work, temporarily set very low thresholds:

```env
ERROR_THRESHOLD=1
TIME_WINDOW_MINUTES=1
```

Then restart:
```bash
docker-compose restart sentarr
```

Any Plex error should now trigger an alert immediately.

## Common Issues

### "No log files found"
- Check volume mount path in docker-compose.yml
- Verify Plex logs exist: `ls -la /your/plex/path/Logs/`

### "No alerts received"
- Check container logs: `docker-compose logs sentarr`
- Verify notification settings in .env
- Test webhook URLs manually (see README.md)

### Container keeps restarting
- Check logs: `docker-compose logs sentarr`
- Verify Python dependencies
- Check for mount permission issues

## What Next?

- Fine-tune thresholds in `.env`
- Set up multiple notification channels
- Integrate with Home Assistant
- Review the full README.md for advanced config

## Getting Help

1. Check container logs
2. Review the main README.md
3. Verify your configuration against .env.example
4. Test notifications manually

Enjoy your monitoring! 🎬
