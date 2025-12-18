# Sentarr - Project Structure

```
sentarr/
├── app/
│   └── monitor.py              # Main monitoring application
├── docs/
│   └── HOME_ASSISTANT.md       # Home Assistant integration guide
├── .env.example                 # Environment configuration template
├── .gitignore                   # Git ignore file
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Docker image definition
├── QUICKSTART.md               # Quick start guide
├── README.md                   # Comprehensive documentation
├── setup.sh                    # Interactive setup wizard
└── test.sh                     # Testing and validation script
```

## Core Components

### monitor.py
The heart of the system. A Python application that:
- Monitors Plex log files in real-time
- Detects error patterns (stream errors, database issues, etc.)
- Tracks error frequency and applies thresholds
- Sends alerts through multiple channels
- Implements smart throttling to prevent alert spam

### Docker Configuration
- **Dockerfile**: Minimal Python 3.11 image with required dependencies
- **docker-compose.yml**: Service definition with volume mounts and environment variables
- Resource limits configured for efficiency

### Configuration
- **.env.example**: Complete configuration template with all options
- Supports multiple notification channels simultaneously
- Flexible threshold and timing settings

## Key Features Implemented

### 1. Error Detection Patterns
- Stream/playback errors
- Database corruption and errors
- Network connectivity issues
- Authentication failures
- Scanner/metadata problems
- Disk I/O errors
- Transcoding warnings
- Performance warnings
- Permission issues

### 2. Alert Channels
- **Email (SMTP)**: Full support for Gmail, Office 365, and custom SMTP
- **Discord**: Rich embeds with color-coded severity
- **Slack**: Formatted attachments with fields
- **Custom Webhooks**: JSON payloads for any service (Home Assistant, ntfy, Gotify, etc.)

### 3. Smart Alerting
- **Threshold-based**: Only alerts when error count exceeds threshold in time window
- **Cooldown**: Prevents duplicate alerts for the same issue
- **Severity levels**: Critical, error, warning, info
- **Detailed context**: Includes error patterns, counts, and sample messages

### 4. Integration-Ready
- Home Assistant webhook support with example automations
- JSON webhook payload for easy parsing
- Configurable for existing monitoring stacks
- Lightweight resource usage

## Getting Started

### Quick Setup (3 steps)
```bash
1. ./setup.sh                    # Interactive configuration
2. docker-compose build          # Build container
3. docker-compose up -d          # Start monitoring
```

### Manual Setup
```bash
1. cp .env.example .env          # Copy configuration
2. nano .env                     # Edit settings
3. nano docker-compose.yml       # Update volume paths
4. docker-compose build          # Build
5. docker-compose up -d          # Start
```

### Testing
```bash
./test.sh all                    # Run all tests
./test.sh discord                # Test Discord webhook
./test.sh                        # Interactive menu
```

## Usage Examples

### View Logs
```bash
docker-compose logs -f sentarr
```

### Restart Container
```bash
docker-compose restart sentarr
```

### Update Configuration
```bash
nano .env
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
```

## Monitoring What Tautulli Doesn't

This solution complements Tautulli by monitoring:
- ✅ Backend errors before playback starts
- ✅ Database corruption and integrity issues
- ✅ System-level transcoding failures
- ✅ Authentication token problems
- ✅ Library scanning errors
- ✅ Disk I/O failures
- ✅ Network connectivity issues at server level

## Resource Requirements

- **CPU**: <5% typical, spikes during errors
- **Memory**: 50-100 MB
- **Disk**: Minimal (read-only log access)
- **Network**: Only for sending alerts

## Security

- Logs mounted read-only (`:ro`)
- No persistent storage required
- Credentials in environment variables only
- Minimal container permissions
- No root required

## Customization

### Add Custom Error Patterns
Edit `app/monitor.py`:
```python
ERROR_PATTERNS = {
    'your_pattern': re.compile(r'your_regex_here', re.IGNORECASE),
    # ...
}
```

### Adjust Thresholds
Edit `.env`:
```env
ERROR_THRESHOLD=3           # More sensitive
TIME_WINDOW_MINUTES=10      # Longer window
ALERT_COOLDOWN_MINUTES=5    # More frequent alerts
```

### Multiple Plex Instances
Duplicate service in `docker-compose.yml`:
```yaml
services:
  sentarr-main:
    # ... config for instance 1
  sentarr-secondary:
    # ... config for instance 2
```

## Next Steps

1. **Deploy**: Follow QUICKSTART.md for fast deployment
2. **Configure**: Use setup.sh for guided configuration
3. **Test**: Run test.sh to verify everything works
4. **Integrate**: Check docs/HOME_ASSISTANT.md for HA integration
5. **Monitor**: Watch logs and adjust thresholds as needed

## Documentation

- **README.md**: Comprehensive documentation with all features
- **QUICKSTART.md**: Fast deployment guide
- **HOME_ASSISTANT.md**: Home Assistant integration examples
- **This file**: Project overview and structure

## Support

Check the troubleshooting section in README.md for common issues.
