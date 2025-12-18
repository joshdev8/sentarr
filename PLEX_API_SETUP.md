# Plex API Integration Guide

Sentarr can connect directly to your Plex server for enhanced monitoring beyond just log files.

## 🔑 Getting Your Plex Token

### Method 1: Web Interface (Easiest)

1. Open Plex Web App
2. Play any media item
3. Click the ⋯ (three dots) menu → "Get Info"
4. Click "View XML"
5. Look at the URL - your token is the `X-Plex-Token` parameter

Example URL:
```
https://app.plex.tv/desktop/#!/server/.../details?key=...&X-Plex-Token=YOURTOKEN
```

### Method 2: Plex Settings

1. Sign in to https://app.plex.tv/
2. Open any media item
3. Press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac)
4. Go to Console tab
5. Type: `localStorage.getItem('myPlexAccessToken')`
6. Copy the token (without quotes)

### Method 3: Manual Request

```bash
# Replace with your Plex credentials
curl -X POST \
  'https://plex.tv/users/sign_in.json' \
  -H 'X-Plex-Client-Identifier: sentarr' \
  -H 'X-Plex-Product: Sentarr' \
  -H 'X-Plex-Version: 1.0' \
  -d 'user[login]=YOUR_EMAIL&user[password]=YOUR_PASSWORD'

# Look for "authToken" in the response
```

## 🔗 Finding Your Plex URL

### If Plex is in Docker on Same Host

```yaml
# In docker-compose.yml
PLEX_URL=http://plex:32400
```

Where `plex` is your Plex container name.

### If Plex is on Different Host

```yaml
PLEX_URL=http://192.168.1.100:32400
# Or
PLEX_URL=http://plex.yourdomain.com:32400
```

### Check Your Plex Container Name

```bash
docker ps | grep plex
# Look for container name in last column
```

## ⚙️ Configuration

### Option 1: Environment Variables (docker-compose.yml)

```yaml
services:
  sentarr:
    environment:
      - PLEX_API_ENABLED=true
      - PLEX_URL=http://plex:32400
      - PLEX_TOKEN=your-token-here
```

### Option 2: .env File

```bash
# .env
PLEX_API_ENABLED=true
PLEX_URL=http://plex:32400
PLEX_TOKEN=xxxxxxxxxxxxxxxxxxxx
```

Then in docker-compose.yml:
```yaml
services:
  sentarr:
    env_file:
      - .env
```

## 🌐 Network Configuration

### Same Docker Network as Plex

```yaml
services:
  sentarr:
    networks:
      - plex

networks:
  plex:
    external: true
```

### Create Shared Network

```bash
# Create network
docker network create plex

# Update both Plex and Sentarr compose files
```

## 🧪 Testing Connection

### Method 1: Check Sentarr Logs

```bash
docker-compose logs sentarr | grep -i plex
```

Should see:
```
Connected to Plex: Your Plex Server Name
```

### Method 2: Test Manually

```bash
# From inside Sentarr container
docker exec -it sentarr python3 -c "
from plexapi.server import PlexServer
plex = PlexServer('http://plex:32400', 'YOUR_TOKEN')
print(f'Connected: {plex.friendlyName}')
print(f'Version: {plex.version}')
print(f'Sessions: {len(plex.sessions())}')
"
```

### Method 3: Web Request

```bash
curl -H "X-Plex-Token: YOUR_TOKEN" \
  "http://plex:32400/status/sessions"
```

## 📊 What You Get with API Integration

### Enhanced Monitoring

1. **Active Streams**
   - Current viewers
   - What they're watching
   - Transcoding status
   - Playback state

2. **Server Health**
   - Plex version
   - Platform info
   - Library count
   - Active sessions

3. **Library Status**
   - Scanning state
   - Last scan times
   - Library health

4. **Transcoding Issues**
   - Who's transcoding
   - Why they're transcoding
   - Resource usage

### Better Alerts

With API access, Sentarr can:
- Correlate log errors with active streams
- Identify which user/media caused an error
- Detect transcoding issues before they fail
- Monitor server performance in real-time

## 🔒 Security Best Practices

### 1. Use Plex Networks

Don't expose Plex ports publicly. Use Docker networks:

```yaml
services:
  plex:
    networks:
      - plex
  
  sentarr:
    networks:
      - plex

networks:
  plex:
    internal: true  # No external access
```

### 2. Secure Token Storage

```bash
# Use .env file (add to .gitignore!)
echo ".env" >> .gitignore

# Or use Docker secrets
docker secret create plex_token token.txt
```

### 3. Read-Only Access

Sentarr only needs read access. Create a separate Plex account if paranoid:

1. Create "Sentarr" Plex account
2. Grant read-only access to libraries
3. Get token for that account

### 4. Local Access Only

```yaml
PLEX_URL=http://127.0.0.1:32400  # Localhost only
```

## 🐛 Troubleshooting

### "Failed to connect to Plex API"

**Check network:**
```bash
docker exec sentarr ping plex
```

**Check URL:**
```bash
docker exec sentarr curl http://plex:32400/identity
```

**Verify token:**
```bash
docker exec sentarr curl -H "X-Plex-Token: TOKEN" \
  "http://plex:32400/identity"
```

### "plexapi not available"

The container should include it, but if not:
```bash
docker exec sentarr pip install plexapi
docker-compose restart sentarr
```

### Connection works but no data

Check Plex permissions:
- Is the token valid?
- Does the token's account have library access?
- Are libraries shared with that account?

### SSL/TLS Errors

If using HTTPS:
```yaml
PLEX_URL=https://plex.yourdomain.com:32400
```

If self-signed cert:
```python
# May need to disable SSL verification
# (Not recommended for production)
```

## 📖 Additional Resources

- [Plex API Documentation](https://github.com/Arcanemagus/plex-api/wiki)
- [PlexAPI Python Library](https://python-plexapi.readthedocs.io/)
- [Finding Your Plex Token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)

## ✅ Verification Checklist

- [ ] Plex token obtained
- [ ] Plex URL configured correctly
- [ ] Network connectivity verified
- [ ] API enabled in Sentarr config
- [ ] Connection successful in logs
- [ ] Dashboard shows Plex data

---

**Once configured, the Sentarr dashboard will show enhanced Plex metrics alongside log monitoring!**
