# Sentarr - Complete Dashboard System

## 🎯 Overview

Sentarr now includes a complete web-based dashboard for real-time monitoring, alerting, and configuration management.

### Architecture

```
┌─────────────────┐      ┌──────────────┐      ┌──────────────────┐
│                 │      │              │      │                  │
│  React Frontend │─────▶│  Flask API   │─────▶│  Log Monitor     │
│  (TypeScript)   │      │  (Python)    │      │  (Python)        │
│                 │      │              │      │                  │
└─────────────────┘      └──────────────┘      └──────────────────┘
     Port 3000               Port 5000          Monitors Plex Logs
```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone or extract Sentarr
cd sentarr

# Update docker-compose.yml with your Plex log path

# Start all services
docker-compose up -d

# Access the dashboard
open http://localhost:3000
```

### Option 2: Development Mode

**Backend API:**
```bash
cd api
pip install flask flask-cors
python server.py
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## 📊 Dashboard Features

### 1. **Real-time Dashboard**
- Live statistics and metrics
- Error timeline graphs
- Alert distribution charts
- System health monitoring
- Recent alerts feed

### 2. **Open Alerts Management**
- View all active alerts
- Filter by severity (Critical, Error, Warning, Info)
- Mark alerts as resolved with notes
- Detailed alert information dialog
- One-click refresh

### 3. **Closed Alerts History**
- Search through resolved alerts
- View resolution notes and timestamps
- Delete old alerts
- Filter and sort capabilities

### 4. **Settings & Configuration**
- Enable/disable error and warning monitoring
- Adjust error thresholds
- Configure time windows
- Manage alert cooldown periods
- Test notification channels
- Enable/disable notification methods

## 🎨 Technology Stack

### Frontend
- **React 18** with **TypeScript**
- **Material-UI (MUI)** for components
- **Recharts** for data visualization
- **Responsive design** for mobile/tablet/desktop

### Backend
- **Flask** REST API
- **Python 3.11**
- **CORS** enabled for development
- **JSON** data storage (in-memory)

### Deployment
- **Docker** containers
- **Nginx** for production frontend
- **docker-compose** orchestration

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_REFRESH_INTERVAL=5000
```

**API**:
```env
API_HOST=0.0.0.0
API_PORT=5000
```

### Docker Compose Ports

- **Frontend**: `3000:80`
- **API**: `5000:5000`

To change ports, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Frontend on port 8080
  - "8081:5000"  # API on port 8081
```

## 🌐 API Endpoints

### Alerts
- `GET /api/alerts` - Get all alerts with stats
- `POST /api/alerts/{id}/resolve` - Resolve an alert
- `DELETE /api/alerts/{id}` - Delete an alert

### Stats
- `GET /api/stats` - Get current statistics

### Configuration
- `GET /api/config` - Get system configuration
- `PUT /api/config` - Update configuration

### Notification Channels
- `GET /api/notifications/channels` - List channels
- `PUT /api/notifications/channels/{id}` - Update channel
- `POST /api/notifications/channels/{id}/test` - Test channel

### System
- `GET /api/system/health` - System health check

## 🎯 Production Deployment

### Using Docker Compose

1. **Update configuration**:
   ```bash
   cp .env.example .env
   nano .env
   ```

2. **Build and start**:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name sentarr.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Using Traefik

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.sentarr.rule=Host(`sentarr.yourdomain.com`)"
  - "traefik.http.services.sentarr.loadbalancer.server.port=80"
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Use HTTPS/TLS for all traffic
- [ ] Set up authentication (add auth middleware)
- [ ] Restrict API access (firewall rules)
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted domains
- [ ] Implement rate limiting
- [ ] Regular security updates

### Adding Authentication

To add basic authentication, modify `api/server.py`:

```python
from functools import wraps
from flask import request

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization')
        if not auth or not check_auth(auth):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/alerts')
@require_auth
def get_alerts():
    # ...
```

## 📱 Mobile Support

The dashboard is fully responsive and works on:
- Desktop (1920x1080+)
- Tablets (768x1024)
- Mobile phones (375x667+)

## 🐛 Troubleshooting

### Frontend Issues

**Frontend won't load**:
```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs sentarr-frontend

# Restart
docker-compose restart sentarr-frontend
```

**API connection errors**:
- Check that API container is running
- Verify REACT_APP_API_URL in frontend/.env
- Check network connectivity between containers

### API Issues

**API returns 500 errors**:
```bash
# View API logs
docker-compose logs sentarr-api

# Restart API
docker-compose restart sentarr-api
```

**No data showing**:
- Ensure monitor service is running
- Check Plex log path is correct
- Verify volume mounts

### Development Issues

**npm install fails**:
```bash
# Clear npm cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**TypeScript errors**:
```bash
# Reinstall types
npm install --save-dev @types/react @types/react-dom
```

## 🔄 Updates & Maintenance

### Updating Sentarr

```bash
# Pull latest changes
git pull

# Rebuild containers
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

### Backup & Restore

**Backup alerts**:
```bash
# Export alerts from API
curl http://localhost:5000/api/alerts > alerts_backup.json
```

**Restore alerts**:
```bash
# Import via API (implement custom endpoint)
curl -X POST http://localhost:5000/api/alerts/import \
  -H "Content-Type: application/json" \
  -d @alerts_backup.json
```

## 🎨 Customization

### Changing Theme Colors

Edit `frontend/src/App.tsx`:
```typescript
primary: {
  main: '#your-color-here',
}
```

### Adding Custom Alert Types

1. Update `frontend/src/types/index.ts`
2. Add pattern to monitor.py
3. Update dashboard visualizations

### Custom Dashboard Widgets

Create new components in `frontend/src/components/`:
```typescript
// CustomWidget.tsx
export const CustomWidget: React.FC = () => {
  return (
    <Card>
      <CardContent>
        {/* Your custom content */}
      </CardContent>
    </Card>
  );
};
```

## 📊 Performance Optimization

### Frontend
- Code splitting (already configured)
- Lazy loading for routes
- Memoization for expensive computations
- Debounced API calls

### API
- Response caching
- Connection pooling
- Async processing for alerts
- Rate limiting

## 🤝 Contributing

The frontend is built with modern React practices:
- TypeScript for type safety
- Functional components with hooks
- Material-UI for consistent design
- RESTful API architecture

## 📝 License

MIT License - See LICENSE file

## 🆘 Support

- **Documentation**: README.md files in each directory
- **Issues**: Check troubleshooting section
- **Logs**: `docker-compose logs -f`

## 🎉 Features Roadmap

- [ ] User authentication
- [ ] Multi-user support
- [ ] Custom dashboards
- [ ] Alert rules editor
- [ ] Webhook templates
- [ ] Dark/Light theme toggle
- [ ] Export reports
- [ ] Mobile app

---

**Sentarr** - Your Plex Server's Guardian 🛡️
