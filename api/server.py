#!/usr/bin/env python3
"""
Sentarr API Server
Provides REST API endpoints for the frontend dashboard
"""

import os
import json
import time
import psutil
from datetime import datetime
from typing import List, Dict
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
CONFIG_PATH = Path('/config/sentarr_config.json')

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
log_buffer: deque = deque(maxlen=500)

# Track server start time
SERVER_START_TIME = time.time()

# Default configuration
DEFAULT_CONFIG = {
    'monitorErrors': True,
    'monitorWarnings': True,
    'errorThreshold': 5,
    'timeWindowMinutes': 5,
    'alertCooldownMinutes': 15,
    'logPath': LOG_PATH,
    'notifications': {
        'email': {
            'enabled': os.getenv('EMAIL_ENABLED', 'false').lower() == 'true',
            'smtpServer': os.getenv('SMTP_SERVER', ''),
            'smtpPort': int(os.getenv('SMTP_PORT', '587')),
            'smtpUser': os.getenv('SMTP_USER', ''),
            'smtpPassword': os.getenv('SMTP_PASSWORD', ''),
            'fromAddress': os.getenv('EMAIL_FROM', ''),
            'toAddress': os.getenv('EMAIL_TO', ''),
        },
        'discord': {
            'enabled': os.getenv('DISCORD_ENABLED', 'false').lower() == 'true',
            'webhookUrl': os.getenv('DISCORD_WEBHOOK_URL', ''),
        },
        'slack': {
            'enabled': os.getenv('SLACK_ENABLED', 'false').lower() == 'true',
            'webhookUrl': os.getenv('SLACK_WEBHOOK_URL', ''),
        },
        'webhook': {
            'enabled': os.getenv('WEBHOOK_ENABLED', 'false').lower() == 'true',
            'webhookUrl': os.getenv('CUSTOM_WEBHOOK_URL', ''),
        },
    }
}

def load_config() -> Dict:
    """Load configuration from file or return defaults"""
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, 'r') as f:
                saved = json.load(f)
                # Merge with defaults
                config = DEFAULT_CONFIG.copy()
                config.update(saved)
                return config
        except Exception as e:
            print(f"Error loading config: {e}")
    return DEFAULT_CONFIG.copy()

def save_config(config: Dict) -> bool:
    """Save configuration to file"""
    try:
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_PATH, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False

# Load config on startup
config_storage = load_config()


def get_thumb_url(thumb_path: str) -> str:
    """Convert Plex thumb path to accessible URL"""
    if not thumb_path or not PLEX_TOKEN:
        return ''
    return f"{PLEX_URL}{thumb_path}?X-Plex-Token={PLEX_TOKEN}"


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
                'scanned': not lib.refreshing if hasattr(lib, 'refreshing') else True,
                'key': lib.key,
            }
            library_info.append(lib_data)
            
            if lib.type == 'movie':
                total_movies += lib_data['count']
            elif lib.type == 'show':
                total_shows += lib_data['count']
            elif lib.type == 'artist':
                total_music += lib_data['count']
        
        # Get bandwidth info
        bandwidth = 0
        for session in sessions:
            if hasattr(session, 'media') and session.media:
                for media in session.media:
                    if hasattr(media, 'bitrate') and media.bitrate:
                        bandwidth += media.bitrate
        
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
            'bandwidth': bandwidth,
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return jsonify({
            'connected': False,
            'error': str(e)
        })


@app.route('/api/plex/streams', methods=['GET'])
def get_active_streams():
    """Get currently active Plex streams with rich metadata"""
    if not plex:
        return jsonify({
            'streams': [],
            'error': 'Plex API not configured'
        })
    
    try:
        sessions = plex.sessions()
        streams = []
        total_bandwidth = 0
        
        for session in sessions:
            user = session.usernames[0] if session.usernames else 'Unknown'
            
            # Player info
            player = session.player
            player_info = {
                'device': player.device if hasattr(player, 'device') else 'Unknown',
                'platform': player.platform if hasattr(player, 'platform') else 'Unknown',
                'product': player.product if hasattr(player, 'product') else 'Unknown',
                'state': player.state if hasattr(player, 'state') else 'Unknown',
                'address': player.address if hasattr(player, 'address') else 'Unknown',
                'local': player.local if hasattr(player, 'local') else False,
            }
            
            # Transcoding info
            is_transcoding = bool(session.transcodeSessions)
            transcode_info = None
            if is_transcoding and session.transcodeSessions:
                tc = session.transcodeSessions[0]
                transcode_info = {
                    'videoDecision': tc.videoDecision if hasattr(tc, 'videoDecision') else 'unknown',
                    'audioDecision': tc.audioDecision if hasattr(tc, 'audioDecision') else 'unknown',
                    'throttled': tc.throttled if hasattr(tc, 'throttled') else False,
                    'speed': tc.speed if hasattr(tc, 'speed') else 0,
                    'progress': tc.progress if hasattr(tc, 'progress') else 0,
                    'transcodeHwRequested': tc.transcodeHwRequested if hasattr(tc, 'transcodeHwRequested') else False,
                }
            
            # Media quality info
            media_info = None
            bandwidth = 0
            if hasattr(session, 'media') and session.media:
                media = session.media[0]
                bandwidth = media.bitrate if hasattr(media, 'bitrate') and media.bitrate else 0
                total_bandwidth += bandwidth
                
                # Get video/audio stream details
                video_resolution = media.videoResolution if hasattr(media, 'videoResolution') else None
                video_codec = media.videoCodec if hasattr(media, 'videoCodec') else None
                audio_codec = media.audioCodec if hasattr(media, 'audioCodec') else None
                audio_channels = media.audioChannels if hasattr(media, 'audioChannels') else None
                container = media.container if hasattr(media, 'container') else None
                
                media_info = {
                    'videoResolution': video_resolution,
                    'videoCodec': video_codec,
                    'audioCodec': audio_codec,
                    'audioChannels': audio_channels,
                    'container': container,
                    'bitrate': bandwidth,
                }
            
            # Episode/Season info for TV
            episode_info = None
            if session.type == 'episode':
                episode_info = {
                    'seasonNumber': session.parentIndex if hasattr(session, 'parentIndex') else None,
                    'episodeNumber': session.index if hasattr(session, 'index') else None,
                }
            
            stream_data = {
                'id': session.sessionKey,
                'user': user,
                'userThumb': get_thumb_url(session.user.thumb) if hasattr(session, 'user') and hasattr(session.user, 'thumb') else None,
                'title': session.title,
                'type': session.type,
                'year': session.year if hasattr(session, 'year') else None,
                'thumb': get_thumb_url(session.thumb) if hasattr(session, 'thumb') else None,
                'art': get_thumb_url(session.art) if hasattr(session, 'art') else None,
                'grandparentTitle': session.grandparentTitle if hasattr(session, 'grandparentTitle') else None,
                'grandparentThumb': get_thumb_url(session.grandparentThumb) if hasattr(session, 'grandparentThumb') else None,
                'parentTitle': session.parentTitle if hasattr(session, 'parentTitle') else None,
                'summary': session.summary[:200] + '...' if hasattr(session, 'summary') and session.summary and len(session.summary) > 200 else (session.summary if hasattr(session, 'summary') else None),
                'rating': session.rating if hasattr(session, 'rating') else None,
                'contentRating': session.contentRating if hasattr(session, 'contentRating') else None,
                'duration': session.duration if hasattr(session, 'duration') else 0,
                'viewOffset': session.viewOffset if hasattr(session, 'viewOffset') else 0,
                'progress': round((session.viewOffset / session.duration * 100) if session.duration else 0, 1),
                'player': player_info,
                'transcoding': is_transcoding,
                'transcodeInfo': transcode_info,
                'mediaInfo': media_info,
                'episodeInfo': episode_info,
                'bandwidth': bandwidth,
            }
            
            streams.append(stream_data)
        
        return jsonify({
            'streams': streams,
            'count': len(streams),
            'totalBandwidth': total_bandwidth,
            'transcodingCount': len([s for s in streams if s['transcoding']]),
            'directPlayCount': len([s for s in streams if not s['transcoding']]),
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return jsonify({
            'streams': [],
            'error': str(e)
        })


@app.route('/api/plex/recently-added', methods=['GET'])
def get_recently_added():
    """Get recently added items"""
    if not plex:
        return jsonify({'items': [], 'error': 'Plex API not configured'})
    
    try:
        limit = request.args.get('limit', 10, type=int)
        items = []
        
        recently_added = plex.library.recentlyAdded()[:limit]
        
        for item in recently_added:
            items.append({
                'title': item.title,
                'type': item.type,
                'year': item.year if hasattr(item, 'year') else None,
                'thumb': get_thumb_url(item.thumb) if hasattr(item, 'thumb') else None,
                'addedAt': item.addedAt.isoformat() if hasattr(item, 'addedAt') and item.addedAt else None,
                'grandparentTitle': item.grandparentTitle if hasattr(item, 'grandparentTitle') else None,
                'parentTitle': item.parentTitle if hasattr(item, 'parentTitle') else None,
                'summary': item.summary[:150] + '...' if hasattr(item, 'summary') and item.summary and len(item.summary) > 150 else (item.summary if hasattr(item, 'summary') else None),
                'rating': item.rating if hasattr(item, 'rating') else None,
            })
        
        return jsonify({
            'items': items,
            'count': len(items),
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return jsonify({'items': [], 'error': str(e)})


@app.route('/api/plex/on-deck', methods=['GET'])
def get_on_deck():
    """Get on-deck items (continue watching)"""
    if not plex:
        return jsonify({'items': [], 'error': 'Plex API not configured'})
    
    try:
        limit = request.args.get('limit', 10, type=int)
        items = []
        
        on_deck = plex.library.onDeck()[:limit]
        
        for item in on_deck:
            items.append({
                'title': item.title,
                'type': item.type,
                'year': item.year if hasattr(item, 'year') else None,
                'thumb': get_thumb_url(item.thumb) if hasattr(item, 'thumb') else None,
                'grandparentTitle': item.grandparentTitle if hasattr(item, 'grandparentTitle') else None,
                'grandparentThumb': get_thumb_url(item.grandparentThumb) if hasattr(item, 'grandparentThumb') else None,
                'parentTitle': item.parentTitle if hasattr(item, 'parentTitle') else None,
                'duration': item.duration if hasattr(item, 'duration') else 0,
                'viewOffset': item.viewOffset if hasattr(item, 'viewOffset') else 0,
                'progress': round((item.viewOffset / item.duration * 100) if item.duration else 0, 1),
            })
        
        return jsonify({
            'items': items,
            'count': len(items),
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return jsonify({'items': [], 'error': str(e)})


# ============================================
# LOG VIEWER ENDPOINTS
# ============================================

def read_recent_logs(num_lines: int = 100) -> List[Dict]:
    """Read recent log entries from Plex log file"""
    logs = []
    log_file = Path(LOG_PATH) / "Plex Media Server.log"
    
    if not log_file.exists():
        alt_paths = [Path("/logs/Plex Media Server.log")]
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
        with open(log_file, 'rb') as f:
            f.seek(0, 2)
            file_size = f.tell()
            
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
            
            lines = lines[-num_lines:]
        
        for line in lines:
            if not line.strip():
                continue
            
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

# Historical metrics storage for charts
metrics_history = {
    'cpu': deque(maxlen=60),  # Last 60 data points (5 min at 5s intervals)
    'memory': deque(maxlen=60),
    'network': deque(maxlen=60),
    'disk_io': deque(maxlen=60),
}
last_network_io = None
last_disk_io = None
last_io_time = None


def collect_metrics_snapshot():
    """Collect a snapshot of current metrics for history"""
    global last_network_io, last_disk_io, last_io_time
    
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    # CPU
    cpu_percent = psutil.cpu_percent(interval=0.1)
    metrics_history['cpu'].append({
        'time': timestamp,
        'value': cpu_percent
    })
    
    # Memory
    memory = psutil.virtual_memory()
    metrics_history['memory'].append({
        'time': timestamp,
        'value': memory.percent
    })
    
    # Network I/O (calculate rates)
    current_net = psutil.net_io_counters()
    current_time = time.time()
    
    if last_network_io and last_io_time:
        time_diff = current_time - last_io_time
        if time_diff > 0:
            bytes_sent_rate = (current_net.bytes_sent - last_network_io.bytes_sent) / time_diff
            bytes_recv_rate = (current_net.bytes_recv - last_network_io.bytes_recv) / time_diff
            metrics_history['network'].append({
                'time': timestamp,
                'sent': bytes_sent_rate,
                'recv': bytes_recv_rate
            })
    
    last_network_io = current_net
    
    # Disk I/O
    try:
        current_disk_io = psutil.disk_io_counters()
        if last_disk_io and last_io_time:
            time_diff = current_time - last_io_time
            if time_diff > 0:
                read_rate = (current_disk_io.read_bytes - last_disk_io.read_bytes) / time_diff
                write_rate = (current_disk_io.write_bytes - last_disk_io.write_bytes) / time_diff
                metrics_history['disk_io'].append({
                    'time': timestamp,
                    'read': read_rate,
                    'write': write_rate
                })
        last_disk_io = current_disk_io
    except:
        pass
    
    last_io_time = current_time


@app.route('/api/system/metrics', methods=['GET'])
def get_system_metrics():
    """Get system metrics (CPU, memory, etc.)"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_count = psutil.cpu_count()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
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
        return jsonify({'error': str(e)})


@app.route('/api/host/metrics', methods=['GET'])
def get_host_metrics():
    """Get comprehensive host metrics for detailed monitoring"""
    try:
        # Collect snapshot for history
        collect_metrics_snapshot()
        
        # CPU detailed info
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_per_core = psutil.cpu_percent(interval=0.1, percpu=True)
        cpu_count_logical = psutil.cpu_count()
        cpu_count_physical = psutil.cpu_count(logical=False)
        cpu_freq = psutil.cpu_freq()
        load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else (0, 0, 0)
        
        # Memory detailed info
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        # All disk partitions
        disks = []
        partitions = psutil.disk_partitions(all=False)
        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disks.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total': usage.total,
                    'used': usage.used,
                    'free': usage.free,
                    'percent': usage.percent,
                })
            except (PermissionError, OSError):
                continue
        
        # Network interfaces
        network_interfaces = []
        net_if_addrs = psutil.net_if_addrs()
        net_if_stats = psutil.net_if_stats()
        net_io = psutil.net_io_counters(pernic=True)
        
        for iface, addrs in net_if_addrs.items():
            if iface.startswith('lo') or iface.startswith('veth') or iface.startswith('docker'):
                continue  # Skip loopback and docker interfaces
            
            stats = net_if_stats.get(iface, None)
            io = net_io.get(iface, None)
            
            ip_addr = None
            for addr in addrs:
                if addr.family.name == 'AF_INET':
                    ip_addr = addr.address
                    break
            
            if ip_addr:
                network_interfaces.append({
                    'name': iface,
                    'ip': ip_addr,
                    'isUp': stats.isup if stats else False,
                    'speed': stats.speed if stats else 0,
                    'bytesSent': io.bytes_sent if io else 0,
                    'bytesRecv': io.bytes_recv if io else 0,
                    'packetsSent': io.packets_sent if io else 0,
                    'packetsRecv': io.packets_recv if io else 0,
                })
        
        # Total network I/O
        total_net = psutil.net_io_counters()
        
        # Disk I/O
        disk_io = None
        try:
            dio = psutil.disk_io_counters()
            disk_io = {
                'readBytes': dio.read_bytes,
                'writeBytes': dio.write_bytes,
                'readCount': dio.read_count,
                'writeCount': dio.write_count,
            }
        except:
            pass
        
        # Top processes by CPU and memory
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            try:
                pinfo = proc.info
                if pinfo['cpu_percent'] > 0 or pinfo['memory_percent'] > 0.1:
                    processes.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'],
                        'cpu': round(pinfo['cpu_percent'], 1),
                        'memory': round(pinfo['memory_percent'], 1),
                        'status': pinfo['status'],
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        # Sort by CPU usage and get top 10
        processes.sort(key=lambda x: x['cpu'], reverse=True)
        top_processes = processes[:10]
        
        # Temperature sensors (if available)
        temperatures = []
        try:
            temps = psutil.sensors_temperatures()
            for name, entries in temps.items():
                for entry in entries:
                    temperatures.append({
                        'name': f"{name}: {entry.label or 'temp'}",
                        'current': entry.current,
                        'high': entry.high,
                        'critical': entry.critical,
                    })
        except (AttributeError, RuntimeError):
            pass
        
        # System boot time
        boot_time = psutil.boot_time()
        system_uptime = int(time.time() - boot_time)
        
        return jsonify({
            'cpu': {
                'percent': cpu_percent,
                'perCore': cpu_per_core,
                'logicalCores': cpu_count_logical,
                'physicalCores': cpu_count_physical,
                'frequency': {
                    'current': cpu_freq.current if cpu_freq else 0,
                    'min': cpu_freq.min if cpu_freq else 0,
                    'max': cpu_freq.max if cpu_freq else 0,
                } if cpu_freq else None,
                'loadAverage': {
                    '1min': round(load_avg[0], 2),
                    '5min': round(load_avg[1], 2),
                    '15min': round(load_avg[2], 2),
                },
            },
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'used': memory.used,
                'free': memory.free,
                'percent': memory.percent,
                'cached': memory.cached if hasattr(memory, 'cached') else 0,
                'buffers': memory.buffers if hasattr(memory, 'buffers') else 0,
            },
            'swap': {
                'total': swap.total,
                'used': swap.used,
                'free': swap.free,
                'percent': swap.percent,
            },
            'disks': disks,
            'diskIO': disk_io,
            'network': {
                'interfaces': network_interfaces,
                'total': {
                    'bytesSent': total_net.bytes_sent,
                    'bytesRecv': total_net.bytes_recv,
                    'packetsSent': total_net.packets_sent,
                    'packetsRecv': total_net.packets_recv,
                },
            },
            'processes': top_processes,
            'temperatures': temperatures,
            'uptime': {
                'system': system_uptime,
                'systemFormatted': format_uptime(system_uptime),
                'app': int(time.time() - SERVER_START_TIME),
                'appFormatted': format_uptime(int(time.time() - SERVER_START_TIME)),
                'bootTime': datetime.fromtimestamp(boot_time).isoformat() + 'Z',
            },
            'history': {
                'cpu': list(metrics_history['cpu']),
                'memory': list(metrics_history['memory']),
                'network': list(metrics_history['network']),
                'diskIO': list(metrics_history['disk_io']),
            },
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()})


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
    """Get full system configuration"""
    return jsonify(config_storage)


@app.route('/api/config', methods=['PUT'])
def update_config():
    """Update and persist system configuration"""
    global config_storage
    data = request.json or {}
    
    # Deep merge the config
    def deep_merge(base, update):
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                deep_merge(base[key], value)
            else:
                base[key] = value
    
    deep_merge(config_storage, data)
    
    # Save to file
    if save_config(config_storage):
        return jsonify({'success': True, 'config': config_storage})
    else:
        return jsonify({'success': False, 'error': 'Failed to save config', 'config': config_storage})


# ============================================
# NOTIFICATION CHANNELS (for backwards compat)
# ============================================

@app.route('/api/notifications/channels', methods=['GET'])
def get_notification_channels():
    """Get notification channels from config"""
    notifications = config_storage.get('notifications', {})
    channels = []
    
    for channel_id, channel_config in notifications.items():
        channels.append({
            'id': channel_id,
            'name': channel_id.title() + ' Notifications',
            'type': channel_id,
            'enabled': channel_config.get('enabled', False),
            'config': channel_config,
        })
    
    return jsonify(channels)


@app.route('/api/notifications/channels/<channel_id>', methods=['PUT'])
def update_notification_channel(channel_id: str):
    """Update a notification channel"""
    data = request.json or {}
    
    if 'notifications' not in config_storage:
        config_storage['notifications'] = {}
    
    if channel_id not in config_storage['notifications']:
        config_storage['notifications'][channel_id] = {}
    
    # Update the channel config
    if 'enabled' in data:
        config_storage['notifications'][channel_id]['enabled'] = data['enabled']
    if 'config' in data:
        config_storage['notifications'][channel_id].update(data['config'])
    
    save_config(config_storage)
    
    return jsonify({
        'id': channel_id,
        'enabled': config_storage['notifications'][channel_id].get('enabled', False),
        'config': config_storage['notifications'][channel_id],
    })


@app.route('/api/notifications/channels/<channel_id>/test', methods=['POST'])
def test_notification_channel(channel_id: str):
    """Test a notification channel by sending a test message"""
    notifications = config_storage.get('notifications', {})
    channel = notifications.get(channel_id, {})
    
    if not channel.get('enabled'):
        return jsonify({'success': False, 'message': 'Channel is disabled'})
    
    # Actually test the notification
    try:
        if channel_id == 'email':
            # Test email
            import smtplib
            from email.mime.text import MIMEText
            
            msg = MIMEText('This is a test notification from Sentarr!')
            msg['Subject'] = '[Sentarr Test] Notification Test'
            msg['From'] = channel.get('fromAddress', channel.get('smtpUser', ''))
            msg['To'] = channel.get('toAddress', '')
            
            with smtplib.SMTP(channel.get('smtpServer', ''), channel.get('smtpPort', 587)) as server:
                server.starttls()
                server.login(channel.get('smtpUser', ''), channel.get('smtpPassword', ''))
                server.send_message(msg)
            
            return jsonify({'success': True, 'message': 'Test email sent successfully!'})
        
        elif channel_id == 'discord':
            import requests
            webhook_url = channel.get('webhookUrl', '')
            if not webhook_url:
                return jsonify({'success': False, 'message': 'No webhook URL configured'})
            
            payload = {
                'embeds': [{
                    'title': '🧪 Sentarr Test',
                    'description': 'This is a test notification from Sentarr!',
                    'color': 0x00e5ff,
                }]
            }
            response = requests.post(webhook_url, json=payload, timeout=10)
            response.raise_for_status()
            return jsonify({'success': True, 'message': 'Test Discord message sent!'})
        
        elif channel_id == 'slack':
            import requests
            webhook_url = channel.get('webhookUrl', '')
            if not webhook_url:
                return jsonify({'success': False, 'message': 'No webhook URL configured'})
            
            payload = {
                'text': '🧪 *Sentarr Test*\nThis is a test notification from Sentarr!'
            }
            response = requests.post(webhook_url, json=payload, timeout=10)
            response.raise_for_status()
            return jsonify({'success': True, 'message': 'Test Slack message sent!'})
        
        elif channel_id == 'webhook':
            import requests
            webhook_url = channel.get('webhookUrl', '')
            if not webhook_url:
                return jsonify({'success': False, 'message': 'No webhook URL configured'})
            
            payload = {
                'type': 'test',
                'title': 'Sentarr Test',
                'message': 'This is a test notification from Sentarr!',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
            }
            response = requests.post(webhook_url, json=payload, timeout=10)
            response.raise_for_status()
            return jsonify({'success': True, 'message': 'Test webhook sent!'})
        
        else:
            return jsonify({'success': False, 'message': f'Unknown channel: {channel_id}'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Test failed: {str(e)}'})


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
Config Path: {CONFIG_PATH}
""")
    
    app.run(host=host, port=port, debug=False)
