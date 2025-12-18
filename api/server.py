#!/usr/bin/env python3
"""
Sentarr API Server
Provides REST API endpoints for the frontend dashboard
"""

import os
import json
import time
from datetime import datetime
from typing import List, Dict, Optional
from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid

app = Flask(__name__)
CORS(app)

# In-memory storage (in production, use a database)
alerts_storage: List[Dict] = []
config_storage = {
    'monitorErrors': True,
    'monitorWarnings': True,
    'errorThreshold': 5,
    'timeWindowMinutes': 5,
    'alertCooldownMinutes': 15,
    'logPath': '/config/Library/Application Support/Plex Media Server/Logs'
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


def create_mock_alert(severity: str, pattern: str) -> Dict:
    """Create a mock alert for demonstration"""
    return {
        'id': str(uuid.uuid4()),
        'title': f'Multiple {pattern.replace("_", " ").title()} Detected',
        'message': f'Detected errors in the system matching pattern: {pattern}',
        'severity': severity,
        'status': 'open',
        'pattern': pattern,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'details': {
            'Pattern': pattern,
            'Count': 5,
            'Time Window': '5 minutes',
            'Latest Error': 'ERROR - Sample error message from logs...'
        }
    }


# Initialize with some mock alerts for demonstration
if not alerts_storage:
    alerts_storage.extend([
        create_mock_alert('error', 'stream_error'),
        create_mock_alert('warning', 'performance_warning'),
        create_mock_alert('critical', 'database_error'),
    ])


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


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get current statistics"""
    open_alerts = [a for a in alerts_storage if a['status'] == 'open']
    error_count = len([a for a in open_alerts if a['severity'] in ['error', 'critical']])
    warning_count = len([a for a in open_alerts if a['severity'] == 'warning'])
    
    return jsonify({
        'totalAlerts': len(alerts_storage),
        'openAlerts': len(open_alerts),
        'errorCount': error_count,
        'warningCount': warning_count,
    })


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
            
            # In production, this would actually send a test notification
            return jsonify({
                'success': True,
                'message': f'Test notification sent successfully to {channel["name"]}'
            })
    
    return jsonify({'error': 'Channel not found'}), 404


@app.route('/api/system/health', methods=['GET'])
def get_system_health():
    """Get system health information"""
    return jsonify({
        'healthy': True,
        'uptime': int(time.time()),
        'version': '1.0.0'
    })


# Simulate new alerts periodically (for demonstration)
@app.route('/api/debug/create-alert', methods=['POST'])
def create_debug_alert():
    """Debug endpoint to create a test alert"""
    data = request.json or {}
    severity = data.get('severity', 'warning')
    pattern = data.get('pattern', 'stream_error')
    
    alert = create_mock_alert(severity, pattern)
    alerts_storage.append(alert)
    
    return jsonify(alert)


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
""")
    
    app.run(host=host, port=port, debug=True)
