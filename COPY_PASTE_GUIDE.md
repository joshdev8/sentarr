# Sentarr - Copy/Paste Guide

## 📦 Port: 6500 (Updated to avoid conflicts)

All files are ready to copy into your repo. Port changed from 3000 to **6500** to avoid conflicts.

## 🚀 Quick Setup

### Option 1: Download Individual Files (Recommended)

All files are in the `sentarr-files/` folder. Download and copy to your repo:

```bash
# Your repo structure should look like:
sentarr/
├── Dockerfile
├── docker-compose.yml
├── .gitignore
├── .env.example
├── README.md
├── PLEX_API_SETUP.md
├── app/
│   └── monitor.py
├── api/
│   └── server.py
├── docker/
│   ├── nginx.conf
│   └── supervisord.conf
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── Dockerfile
    ├── nginx.conf
    ├── .env.example
    ├── public/
    │   └── index.html
    └── src/
        ├── index.tsx
        ├── index.css
        ├── App.tsx
        ├── types/
        │   └── index.ts
        ├── services/
        │   └── api.ts
        └── components/
            ├── Dashboard.tsx
            ├── OpenAlerts.tsx
            ├── ClosedAlerts.tsx
            └── Settings.tsx
```

### Option 2: One Command (if files are downloaded)

```bash
# Extract all files
tar -xzf sentarr-single-container.tar.gz
cd sentarr

# Or if using individual files folder:
cp -r sentarr-files/* /path/to/your/repo/
```

## 🎯 Essential Files (Minimum Required)

If you want to build it yourself, you need these core files:

### 1. Root Directory Files

**Dockerfile** (Main container)
**docker-compose.yml** (Deployment config)
**.gitignore** (Don't commit node_modules!)
**.env.example** (Configuration template)
**README.md** (Documentation)

### 2. Backend Files

**app/monitor.py** (Log monitoring service)
**api/server.py** (REST API)

### 3. Docker Config

**docker/nginx.conf** (Web server config)
**docker/supervisord.conf** (Process manager)

### 4. Frontend Files (React/TypeScript)

All files in `frontend/` directory

## ⚡ Deploy Commands

```bash
# 1. Clone/copy files to your server

# 2. Update docker-compose.yml with your Plex log path
nano docker-compose.yml
# Change: /path/to/plex/config/... to your actual path

# 3. Get your Plex token
# Visit: https://support.plex.tv/articles/204059436

# 4. Configure environment
cp .env.example .env
nano .env
# Add your PLEX_TOKEN and notification settings

# 5. Build and start
docker-compose build
docker-compose up -d

# 6. Access dashboard
open http://localhost:6500
# Or: http://YOUR_SERVER_IP:6500
```

## 🔧 Key Configuration Points

### docker-compose.yml

```yaml
volumes:
  # ⚠️ CHANGE THIS to your actual Plex log path
  - /opt/plex/config/Library/Application Support/Plex Media Server/Logs:/logs:ro

environment:
  # ⚠️ GET YOUR TOKEN from Plex
  - PLEX_TOKEN=your-plex-token-here
  
  # ⚠️ ENABLE at least one notification
  - DISCORD_ENABLED=true
  - DISCORD_WEBHOOK_URL=https://...
```

### Port Configuration

Access the dashboard at: **http://localhost:6500**

To change the port, edit:
- `docker-compose.yml`: ports section
- `docker/nginx.conf`: listen directive
- `Dockerfile`: EXPOSE and HEALTHCHECK

## 📋 File Checklist

Before deploying, verify you have:

- [ ] Dockerfile
- [ ] docker-compose.yml  
- [ ] .gitignore (prevents committing node_modules)
- [ ] .env.example
- [ ] app/monitor.py
- [ ] api/server.py
- [ ] docker/nginx.conf
- [ ] docker/supervisord.conf
- [ ] frontend/package.json
- [ ] frontend/src/App.tsx
- [ ] frontend/src/components/ (all 4 components)
- [ ] frontend/public/index.html

## 🎨 Customization

### Change Port from 6500

Edit these 3 files:

**docker-compose.yml:**
```yaml
ports:
  - "7500:7500"  # Change both numbers
```

**docker/nginx.conf:**
```nginx
listen 7500 default_server;
```

**Dockerfile:**
```dockerfile
EXPOSE 7500
HEALTHCHECK ... http://localhost:7500/api/system/health ...
```

### Add to Existing Plex Network

**docker-compose.yml:**
```yaml
networks:
  - plex

networks:
  plex:
    external: true
```

## 🐛 Troubleshooting

### Container won't start

```bash
docker-compose logs sentarr
```

### Can't access dashboard

1. Check container is running: `docker ps | grep sentarr`
2. Check port is open: `curl http://localhost:6500`
3. Check firewall settings

### Build fails

```bash
# Rebuild from scratch
docker-compose build --no-cache
```

## 📱 Access from Other Devices

```
http://YOUR_SERVER_IP:6500
```

Example: `http://192.168.1.100:6500`

## 🎉 That's It!

Once deployed:
1. Dashboard at http://localhost:6500
2. Configure in Settings page
3. Enable notifications
4. Monitor your Plex server!

---

**Questions? Check README.md and PLEX_API_SETUP.md for detailed guides.**
