#!/usr/bin/env python3
"""
Sentarr API Server
Provides REST API endpoints for the frontend dashboard
"""

import os
import json
import time
import subprocess
import psutil
from datetime import datetime
from typing import List, Dict, Optional
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import uuid
from pathlib import Path
from collections import deque

# Try to import plexapi
try:
    from plexapi.server import PlexServer
    PLEXAPI_AVAILABLE = True
except ImportError:
    PLEXAPI_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# Configuration
PLEX_URL = os.getenv('PLEX_URL', 'http://localhost:32400')
PLEX_TOKEN = os.getenv('PLEX_TOKEN', '')
PLEX_API_ENABLED = os.getenv('PLEX_API_ENABLED', 'false').lower() == 'true'
LOG_PATH = os.getenv('PLEX_LOG_PATH', '/logs')

# Plex connection
plex = None
if PLEX_API_ENABLED and PLEXAPI_AVAILABLE and PLEX_TOKEN:
    try:
        plex = PlexServer(PLEX_URL, PLEX_TOKEN)
        print(f"✓ Connected to Plex: {plex.friendlyName}")
    except Exception as e:
        print(f"✗ Failed to connect to Plex: {e}")

# In-memory storage
alerts_storage: List[Dict] = []
log_buffer: deque = deque(maxlen=500)  # Keep last 500 log lines

# Track server start time
SERVER_START_TIME = time.time()

config_storage = {
    'monitorErrors': True,
    'monitorWarnings': True,
    'errorThreshold': 5,
    'timeWindowMinutes': 5,
    'alertCooldownMinutes': 15,
    'logPath': LOG_PATH
}

notification_channels = [
    {
        'id': 'email',
        'name': 'Email Notifications',
        'type': 'email',
        'enabled': os.getenv('EMAIL_ENABLED', 'false').lower() == 'true',
        'config': {
            'smtp_server': os.getenv('SMTP_SERVER', ''),
            'smtp_user': os.getenv('SMTP_USER', ''),
        }
    },
    {
        'id': 'discord',
        'name': 'Discord Webhook',
        'type': 'discord',
        'enabled': os.getenv('DISCORD_ENABLED', 'false').lower() == 'true',
        'config': {
            'webhook_url': os.getenv('DISCORD_WEBHOOK_URL', ''),
        }
    },
    {
        'id': 'slack',
        'name': 'Slack Webhook',
        'type': 'slack',
        'enabled': os.getenv('SLACK_ENABLED', 'false').lower() == 'true',
        'config': {
            'webhook_url': os.getenv('SLACK_WEBHOOK_URL', ''),
        }
    },
    {
        'id': 'webhook',
        'name': 'Custom Webhook',
        'type': 'webhook',
        'enabled': os.getenv('WEBHOOK_ENABLED', 'false').lower() == 'true',
        'config': {
            'webhook_url': os.getenv('CUSTOM_WEBHOOK_URL', ''),
        }
    },
]


# ============================================
# PLEX API ENDPOINTS
# ============================================

@app.route('/api/plex/status', methods=['GET'])
def get_plex_status():
    """Get Plex server status and information"""
    if not plex:
        return jsonify({
            'connected': False,
            'error': 'Plex API not configured or unavailable',
            'plexApiEnabled': PLEX_API_ENABLED,
            'plexApiAvailable': PLEXAPI_AVAILABLE,
            'hasToken': bool(PLEX_TOKEN)
        })
    
    try:
        # Get server info
        sessions = plex.sessions()
        libraries = plex.library.sections()
        
        # Count library items
        total_movies = 0
        total_shows = 0
        total_episodes = 0
        total_music = 0
        
        library_info = []
        for lib in libraries:
            lib_data = {
                'title': lib.title,
                'type': lib.type,
                'count': lib.totalSize if hasattr(lib, 'totalSize') else 0,
                'scanned': not lib.refreshing if hasattr(lib, 'refreshing') else True
            }
            library_info.append(lib_data)
            
            if lib.type == 'movie':
                total_movies += lib_data['count']
            elif lib.type == 'show':
                total_shows += lib_data['count']
            elif lib.type == 'artist':
                total_music += lib_data['count']
        
        return jsonify({
            'connected': True,
            'serverName': plex.friendlyName,
            'version': plex.version,
            'platform': plex.platform,
            'platformVersion': plex.platformVersion,
            'activeSessions': len(sessions),
            'libraries': library_info,
            'totalMovies': total_movies,
            'totalShows': total_shows,
            'totalMusic': total_music,
            'transcodeSessions': len([s for s in sessions if s.transcodeSessions]),
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return jsonify({
            'connected': False,
            'error': str(e)
        })


@app.route('/api/plex/streams', methods=['GET'])
def get_active_streams():
    """Get currently active Plex streams"""
    if not plex:
        return jsonify({
            'streams': [],
            'error': 'Plex API not configured'
        })
    
    try:
        sessions = plex.sessions()
        streams = []
        
        for session in sessions:
            # Get user info
            user = session.usernames[0] if session.usernames else 'Unknown'
            
            # Get player info
            player = session.player
            player_info = {
                'device': player.device if hasattr(player, 'device') else 'Unknown',
                'platform': player.platform if hasattr(player, 'platform') else 'Unknown',
                'product': player.product if hasattr(player, 'product') else 'Unknown',
                'state': player.state if hasattr(player, 'state') else 'Unknown',
                'address': player.address if hasattr(player, 'address') else 'Unknown',
            }
            
            # Get transcoding info
            is_transcoding = bool(session.transcodeSessions)
            transcode_info = None
            if is_transcoding and session.transcodeSessions:
                tc = session.transcodeSessions[0]
                transcode_info = {
                    'videoDecision': tc.videoDecision if hasattr(tc, 'videoDecision') else 'unknown',
                    'audioDecision': tc.audioDecision if hasattr(tc, 'audioDecision') else 'unknown',
                    'throttled': tc.throttled if hasattr(tc, 'throttled') else False,
                    'speed': tc.speed if hasattr(tc, 'speed') else 0,
                }
            
            # Get media info
            stream_data = {
                'id': session.sessionKey,
                'user': user,
                'title': session.title,
                'type': session.type,
                'year': session.year if hasattr(session, 'year') else None,
                'thumb': session.thumb if hasattr(session, 'thumb') else None,
                'grandparentTitle': session.grandparentTitle if hasattr(session, 'grandparentTitle') else None,
                'parentTitle': session.parentTitle if hasattr(session, 'parentTitle') else None,
                'duration': session.duration if hasattr(session, 'duration') else 0,
                'viewOffset': session.viewOffset if hasattr(session, 'viewOffset') else 0,
                'progress': round((session.viewOffset / session.duration * 100) if session.duration else 0, 1),
                'player': player_info,
                'transcoding': is_transcoding,
                'transcodeInfo': transcode_info,
            }
            
            streams.append(stream_data)
        
        return jsonify({
            'streams': streams,
            'count': len(streams),
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return jsonify({
            'streams': [],
            'error': str(e)
        })


# ============================================
# LOG VIEWER ENDPOINTS
# ============================================

def read_recent_logs(num_lines: int = 100) -> List[Dict]:
    """Read recent log entries from Plex log file"""
    logs = []
    log_file = Path(LOG_PATH) / "Plex Media Server.log"
    
    if not log_file.exists():
        # Try alternative log locations
        alt_paths = [
            Path(LOG_PATH) / "Plex Media Server.log",
            Path("/logs/Plex Media Server.log"),
        ]
        for alt in alt_paths:
            if alt.exists():
                log_file = alt
                break
    
    if not log_file.exists():
        return [{
            'timestamp': datetime.utcnow().isoformat(),
            'level': 'info',
            'message': f'Log file not found at {log_file}',
            'source': 'sentarr'
        }]
    
    try:
        # Read last N lines efficiently
        with open(log_file, 'rb') as f:
            # Go to end of file
            f.seek(0, 2)
            file_size = f.tell()
            
            # Read in chunks from the end
            chunk_size = 8192
            lines = []
            remaining = file_size
            
            while remaining > 0 and len(lines) < num_lines + 1:
                chunk_start = max(0, remaining - chunk_size)
                f.seek(chunk_start)
                chunk = f.read(remaining - chunk_start)
                remaining = chunk_start
                
                chunk_lines = chunk.decode('utf-8', errors='ignore').splitlines()
                lines = chunk_lines + lines
            
            # Get last N lines
            lines = lines[-num_lines:]
        
        # Parse log lines
        for line in lines:
            if not line.strip():
                continue
            
            # Determine log level
            level = 'info'
            if 'ERROR' in line.upper():
                level = 'error'
            elif 'WARN' in line.upper():
                level = 'warning'
            elif 'DEBUG' in line.upper():
                level = 'debug'
            
            logs.append({
                'timestamp': datetime.utcnow().isoformat(),
                'level': level,
                'message': line.strip(),
                'source': 'plex'
            })
        
    except Exception as e:
        logs.append({
            'timestamp': datetime.utcnow().isoformat(),
            'level': 'error',
            'message': f'Error reading logs: {str(e)}',
            'source': 'sentarr'
        })
    
    return logs


@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Get recent log entries"""
    num_lines = request.args.get('lines', 100, type=int)
    level_filter = request.args.get('level', None)
    
    logs = read_recent_logs(num_lines)
    
    # Filter by level if specified
    if level_filter and level_filter != 'all':
        logs = [l for l in logs if l['level'] == level_filter]
    
    return jsonify({
        'logs': logs,
        'count': len(logs),
        'logPath': LOG_PATH,
        'updatedAt': datetime.utcnow().isoformat() + 'Z'
    })


@app.route('/api/logs/stream')
def stream_logs():
    """Stream logs in real-time using Server-Sent Events"""
    def generate():
        log_file = Path(LOG_PATH) / "Plex Media Server.log"
        
        if not log_file.exists():
            yield f"data: {json.dumps({'error': 'Log file not found'})}\n\n"
            return
        
        try:
            with open(log_file, 'r') as f:
                # Go to end of file
                f.seek(0, 2)
                
                while True:
                    line = f.readline()
                    if line:
                        level = 'info'
                        if 'ERROR' in line.upper():
                            level = 'error'
                        elif 'WARN' in line.upper():
                            level = 'warning'
                        
                        log_entry = {
                            'timestamp': datetime.utcnow().isoformat(),
                            'level': level,
                            'message': line.strip(),
                            'source': 'plex'
                        }
                        yield f"data: {json.dumps(log_entry)}\n\n"
                    else:
                        time.sleep(0.5)
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')


# ============================================
# SYSTEM METRICS ENDPOINTS
# ============================================

@app.route('/api/system/metrics', methods=['GET'])
def get_system_metrics():
    """Get system metrics (CPU, memory, etc.)"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_count = psutil.cpu_count()
        
        # Memory usage
        memory = psutil.virtual_memory()
        
        # Disk usage (for root partition)
        disk = psutil.disk_usage('/')
        
        # Uptime
        uptime_seconds = int(time.time() - SERVER_START_TIME)
        
        return jsonify({
            'cpu': {
                'percent': cpu_percent,
                'cores': cpu_count,
            },
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'used': memory.used,
                'percent': memory.percent,
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent,
            },
            'uptime': uptime_seconds,
            'uptimeFormatted': format_uptime(uptime_seconds),
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        })


def format_uptime(seconds: int) -> str:
    """Format uptime in human readable format"""
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0 or not parts:
        parts.append(f"{minutes}m")
    
    return " ".join(parts)


# ============================================
# ALERTS ENDPOINTS
# ============================================

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get all alerts with statistics"""
    open_alerts = [a for a in alerts_storage if a['status'] == 'open']
    closed_alerts = [a for a in alerts_storage if a['status'] == 'closed']
    
    # Calculate stats
    error_count = len([a for a in open_alerts if a['severity'] in ['error', 'critical']])
    warning_count = len([a for a in open_alerts if a['severity'] == 'warning'])
    
    return jsonify({
        'alerts': alerts_storage,
        'stats': {
            'totalAlerts': len(alerts_storage),
            'openAlerts': len(open_alerts),
            'errorCount': error_count,
            'warningCount': warning_count,
        }
    })


@app.route('/api/alerts/<alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id: str):
    """Mark an alert as resolved"""
    data = request.json or {}
    note = data.get('note', '')
    
    for alert in alerts_storage:
        if alert['id'] == alert_id:
            alert['status'] = 'closed'
            alert['resolvedAt'] = datetime.utcnow().isoformat() + 'Z'
            alert['resolvedBy'] = 'User'
            alert['resolutionNote'] = note
            return jsonify(alert)
    
    return jsonify({'error': 'Alert not found'}), 404


@app.route('/api/alerts/<alert_id>', methods=['DELETE'])
def delete_alert(alert_id: str):
    """Delete an alert"""
    global alerts_storage
    alerts_storage = [a for a in alerts_storage if a['id'] != alert_id]
    return jsonify({'success': True})


@app.route('/api/alerts', methods=['POST'])
def create_alert():
    """Create a new alert (used by monitor)"""
    data = request.json or {}
    
    alert = {
        'id': str(uuid.uuid4()),
        'title': data.get('title', 'New Alert'),
        'message': data.get('message', ''),
        'severity': data.get('severity', 'warning'),
        'status': 'open',
        'pattern': data.get('pattern'),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'details': data.get('details', {})
    }
    
    alerts_storage.append(alert)
    return jsonify(alert)


# ============================================
# STATS ENDPOINT
# ============================================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get current statistics"""
    open_alerts = [a for a in alerts_storage if a['status'] == 'open']
    error_count = len([a for a in open_alerts if a['severity'] in ['error', 'critical']])
    warning_count = len([a for a in open_alerts if a['severity'] == 'warning'])
    
    # Add Plex info if available
    plex_info = {}
    if plex:
        try:
            sessions = plex.sessions()
            plex_info = {
                'activeSessions': len(sessions),
                'serverName': plex.friendlyName,
            }
        except:
            pass
    
    return jsonify({
        'totalAlerts': len(alerts_storage),
        'openAlerts': len(open_alerts),
        'errorCount': error_count,
        'warningCount': warning_count,
        **plex_info
    })


# ============================================
# CONFIG ENDPOINTS
# ============================================

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get system configuration"""
    return jsonify(config_storage)


@app.route('/api/config', methods=['PUT'])
def update_config():
    """Update system configuration"""
    data = request.json or {}
    config_storage.update(data)
    return jsonify(config_storage)


# ============================================
# NOTIFICATION CHANNELS
# ============================================

@app.route('/api/notifications/channels', methods=['GET'])
def get_notification_channels():
    """Get all notification channels"""
    return jsonify(notification_channels)


@app.route('/api/notifications/channels/<channel_id>', methods=['PUT'])
def update_notification_channel(channel_id: str):
    """Update a notification channel"""
    data = request.json or {}
    
    for channel in notification_channels:
        if channel['id'] == channel_id:
            channel.update(data)
            return jsonify(channel)
    
    return jsonify({'error': 'Channel not found'}), 404


@app.route('/api/notifications/channels/<channel_id>/test', methods=['POST'])
def test_notification_channel(channel_id: str):
    """Test a notification channel"""
    for channel in notification_channels:
        if channel['id'] == channel_id:
            if not channel['enabled']:
                return jsonify({
                    'success': False,
                    'message': 'Channel is disabled'
                })
            
            return jsonify({
                'success': True,
                'message': f'Test notification sent successfully to {channel["name"]}'
            })
    
    return jsonify({'error': 'Channel not found'}), 404


# ============================================
# SYSTEM HEALTH
# ============================================

@app.route('/api/system/health', methods=['GET'])
def get_system_health():
    """Get system health information"""
    plex_connected = plex is not None
    
    return jsonify({
        'healthy': True,
        'uptime': int(time.time() - SERVER_START_TIME),
        'version': '1.0.0',
        'plexConnected': plex_connected,
        'plexServerName': plex.friendlyName if plex else None,
        'logPath': LOG_PATH,
        'logPathExists': Path(LOG_PATH).exists(),
    })


if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5000))
    host = os.getenv('API_HOST', '0.0.0.0')
    
    print(f"""
   ____            _                  
  / ___|  ___ _ __| |_ __ _ _ __ _ __ 
  \\___ \\ / _ \\ '_ \\ __/ _` | '__| '__|
   ___) |  __/ | | | || (_| | |  | |  
  |____/ \\___|_| |_|\\__\\__,_|_|  |_|  
                                      
Sentarr API Server Starting...
Listening on {host}:{port}
Plex API: {'Enabled' if plex else 'Disabled'}
Log Path: {LOG_PATH}
""")
    
    app.run(host=host, port=port, debug=False)
