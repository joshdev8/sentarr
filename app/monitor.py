#!/usr/bin/env python3
"""
   ____            _                  
  / ___|  ___ _ __| |_ __ _ _ __ _ __ 
  \___ \ / _ \ '_ \ __/ _` | '__| '__|
   ___) |  __/ | | | || (_| | |  | |  
  |____/ \___|_| |_|\__\__,_|_|  |_|  
                                      
Sentarr - Your Plex Server's Guardian

Real-time monitoring of Plex Media Server logs
Detects errors, warnings, and issues to send alerts via multiple channels
Integrates with Plex API for enhanced monitoring
"""

import os
import re
import time
import json
import requests
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Optional
import logging

# Try to import plexapi
try:
    from plexapi.server import PlexServer
    PLEXAPI_AVAILABLE = True
except ImportError:
    PLEXAPI_AVAILABLE = False
    logging.warning("plexapi not available - Plex API features disabled")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('sentarr')


class PlexAPIMonitor:
    """Monitor Plex via API for additional insights"""
    
    def __init__(self):
        self.enabled = os.getenv('PLEX_API_ENABLED', 'false').lower() == 'true'
        self.plex_url = os.getenv('PLEX_URL', 'http://plex:32400')
        self.plex_token = os.getenv('PLEX_TOKEN', '')
        self.plex = None
        
        if self.enabled and PLEXAPI_AVAILABLE and self.plex_token:
            try:
                self.plex = PlexServer(self.plex_url, self.plex_token)
                logger.info(f"Connected to Plex: {self.plex.friendlyName}")
            except Exception as e:
                logger.error(f"Failed to connect to Plex API: {e}")
                self.enabled = False
        elif self.enabled and not self.plex_token:
            logger.warning("PLEX_API_ENABLED=true but no PLEX_TOKEN provided")
            self.enabled = False
    
    def get_server_status(self) -> Dict:
        """Get Plex server status"""
        if not self.enabled or not self.plex:
            return {}
        
        try:
            return {
                'version': self.plex.version,
                'platform': self.plex.platform,
                'sessions': len(self.plex.sessions()),
                'libraries': len(self.plex.library.sections()),
            }
        except Exception as e:
            logger.error(f"Failed to get Plex status: {e}")
            return {}
    
    def get_active_streams(self) -> List[Dict]:
        """Get currently active streams"""
        if not self.enabled or not self.plex:
            return []
        
        try:
            sessions = self.plex.sessions()
            return [{
                'user': session.usernames[0] if session.usernames else 'Unknown',
                'title': session.title,
                'state': session.player.state,
                'progress': session.viewOffset,
                'transcoding': session.transcodeSessions[0].videoDecision != 'direct play' if session.transcodeSessions else False
            } for session in sessions]
        except Exception as e:
            logger.error(f"Failed to get active streams: {e}")
            return []
    
    def check_library_issues(self) -> List[str]:
        """Check for library scanning issues"""
        if not self.enabled or not self.plex:
            return []
        
        issues = []
        try:
            for section in self.plex.library.sections():
                if hasattr(section, 'refreshing') and section.refreshing:
                    issues.append(f"Library '{section.title}' is currently scanning")
        except Exception as e:
            logger.error(f"Failed to check library issues: {e}")
        
        return issues


class AlertManager:
    """Manages sending alerts through various channels"""
    
    def __init__(self):
        self.email_enabled = os.getenv('EMAIL_ENABLED', 'false').lower() == 'true'
        self.discord_enabled = os.getenv('DISCORD_ENABLED', 'false').lower() == 'true'
        self.webhook_enabled = os.getenv('WEBHOOK_ENABLED', 'false').lower() == 'true'
        self.slack_enabled = os.getenv('SLACK_ENABLED', 'false').lower() == 'true'
        
        # Alert configuration
        self.smtp_server = os.getenv('SMTP_SERVER')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.email_from = os.getenv('EMAIL_FROM')
        self.email_to = os.getenv('EMAIL_TO')
        
        self.discord_webhook = os.getenv('DISCORD_WEBHOOK_URL')
        self.slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
        self.custom_webhook = os.getenv('CUSTOM_WEBHOOK_URL')
        
        # Alert throttling
        self.alert_cooldown = int(os.getenv('ALERT_COOLDOWN_MINUTES', '15'))
        self.last_alerts: Dict[str, datetime] = {}
    
    def should_send_alert(self, alert_key: str) -> bool:
        """Check if enough time has passed since last alert of this type"""
        if alert_key not in self.last_alerts:
            return True
        
        time_since_last = (datetime.now() - self.last_alerts[alert_key]).total_seconds() / 60
        return time_since_last >= self.alert_cooldown
    
    def send_alert(self, title: str, message: str, severity: str = 'warning', details: dict = None):
        """Send alert through all enabled channels"""
        alert_key = f"{severity}:{title}"
        
        if not self.should_send_alert(alert_key):
            logger.debug(f"Skipping alert (cooldown): {title}")
            return
        
        self.last_alerts[alert_key] = datetime.now()
        logger.info(f"Sending alert: {title}")
        
        if self.email_enabled:
            self._send_email(title, message, severity, details)
        
        if self.discord_enabled:
            self._send_discord(title, message, severity, details)
        
        if self.slack_enabled:
            self._send_slack(title, message, severity, details)
        
        if self.webhook_enabled:
            self._send_webhook(title, message, severity, details)
    
    def _send_email(self, title: str, message: str, severity: str, details: dict):
        """Send email alert"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg['From'] = self.email_from
            msg['To'] = self.email_to
            msg['Subject'] = f"[Plex Alert - {severity.upper()}] {title}"
            
            body = f"{message}\n\n"
            if details:
                body += "Details:\n"
                for key, value in details.items():
                    body += f"  {key}: {value}\n"
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info("Email alert sent successfully")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
    
    def _send_discord(self, title: str, message: str, severity: str, details: dict):
        """Send Discord webhook alert"""
        try:
            color_map = {
                'critical': 0xFF0000,  # Red
                'error': 0xFF6B6B,     # Light Red
                'warning': 0xFFA500,   # Orange
                'info': 0x3498DB       # Blue
            }
            
            embed = {
                "title": title,
                "description": message,
                "color": color_map.get(severity, 0xFFA500),
                "timestamp": datetime.utcnow().isoformat(),
                "footer": {"text": "Sentarr"}
            }
            
            if details:
                embed["fields"] = [
                    {"name": key, "value": str(value), "inline": True}
                    for key, value in details.items()
                ]
            
            payload = {"embeds": [embed]}
            
            response = requests.post(self.discord_webhook, json=payload)
            response.raise_for_status()
            logger.info("Discord alert sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Discord alert: {e}")
    
    def _send_slack(self, title: str, message: str, severity: str, details: dict):
        """Send Slack webhook alert"""
        try:
            color_map = {
                'critical': 'danger',
                'error': 'danger',
                'warning': 'warning',
                'info': 'good'
            }
            
            attachment = {
                "fallback": f"{title}: {message}",
                "color": color_map.get(severity, 'warning'),
                "title": title,
                "text": message,
                "ts": int(time.time())
            }
            
            if details:
                attachment["fields"] = [
                    {"title": key, "value": str(value), "short": True}
                    for key, value in details.items()
                ]
            
            payload = {"attachments": [attachment]}
            
            response = requests.post(self.slack_webhook, json=payload)
            response.raise_for_status()
            logger.info("Slack alert sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
    
    def _send_webhook(self, title: str, message: str, severity: str, details: dict):
        """Send custom webhook alert"""
        try:
            payload = {
                "title": title,
                "message": message,
                "severity": severity,
                "timestamp": datetime.utcnow().isoformat(),
                "details": details or {}
            }
            
            response = requests.post(self.custom_webhook, json=payload)
            response.raise_for_status()
            logger.info("Custom webhook alert sent successfully")
        except Exception as e:
            logger.error(f"Failed to send custom webhook: {e}")


class PlexLogMonitor:
    """Monitors Plex logs for errors and issues"""
    
    # Error patterns to detect
    ERROR_PATTERNS = {
        'stream_error': re.compile(r'ERROR.*stream|ERROR.*playback|ERROR.*transcode', re.IGNORECASE),
        'database_error': re.compile(r'ERROR.*database|ERROR.*sqlite|ERROR.*corruption', re.IGNORECASE),
        'network_error': re.compile(r'ERROR.*network|ERROR.*connection|ERROR.*timeout', re.IGNORECASE),
        'auth_error': re.compile(r'ERROR.*authentication|ERROR.*unauthorized|ERROR.*token', re.IGNORECASE),
        'scanner_error': re.compile(r'ERROR.*scanner|ERROR.*metadata|ERROR.*library', re.IGNORECASE),
        'disk_error': re.compile(r'ERROR.*disk|ERROR.*i/o error|ERROR.*read error', re.IGNORECASE),
    }
    
    WARNING_PATTERNS = {
        'transcoding_warning': re.compile(r'WARN.*transcode|WARN.*codec', re.IGNORECASE),
        'performance_warning': re.compile(r'WARN.*slow|WARN.*performance|WARN.*timeout', re.IGNORECASE),
        'permission_warning': re.compile(r'WARN.*permission|WARN.*access denied', re.IGNORECASE),
    }
    
    def __init__(self, log_path: str, alert_manager: AlertManager):
        self.log_path = Path(log_path)
        self.alert_manager = alert_manager
        
        # Configuration
        self.monitor_errors = os.getenv('MONITOR_ERRORS', 'true').lower() == 'true'
        self.monitor_warnings = os.getenv('MONITOR_WARNINGS', 'true').lower() == 'true'
        self.error_threshold = int(os.getenv('ERROR_THRESHOLD', '5'))
        self.time_window = int(os.getenv('TIME_WINDOW_MINUTES', '5'))
        
        # Tracking
        self.error_counts: Dict[str, List[datetime]] = defaultdict(list)
        self.processed_lines: Set[str] = set()
    
    def get_log_files(self) -> List[Path]:
        """Get all Plex log files to monitor"""
        log_files = []
        
        if not self.log_path.exists():
            logger.error(f"Log path does not exist: {self.log_path}")
            return log_files
        
        # Main Plex Media Server log
        main_log = self.log_path / "Plex Media Server.log"
        if main_log.exists():
            log_files.append(main_log)
        
        # Look for other relevant logs
        patterns = [
            "Plex Media Server*.log",
            "PMS Plugin*.log",
            "Plex Transcoder*.log"
        ]
        
        for pattern in patterns:
            log_files.extend(self.log_path.glob(pattern))
        
        return list(set(log_files))  # Remove duplicates
    
    def parse_log_line(self, line: str) -> dict:
        """Parse a log line and extract relevant information"""
        # Create a unique hash for this line to avoid processing duplicates
        line_hash = hash(line)
        
        if line_hash in self.processed_lines:
            return None
        
        self.processed_lines.add(line_hash)
        
        # Keep processed_lines from growing indefinitely
        if len(self.processed_lines) > 10000:
            self.processed_lines.clear()
        
        result = {
            'raw': line,
            'timestamp': datetime.now(),
            'type': None,
            'pattern': None,
            'message': line.strip()
        }
        
        # Check error patterns
        if self.monitor_errors:
            for pattern_name, pattern in self.ERROR_PATTERNS.items():
                if pattern.search(line):
                    result['type'] = 'error'
                    result['pattern'] = pattern_name
                    return result
        
        # Check warning patterns
        if self.monitor_warnings:
            for pattern_name, pattern in self.WARNING_PATTERNS.items():
                if pattern.search(line):
                    result['type'] = 'warning'
                    result['pattern'] = pattern_name
                    return result
        
        return None
    
    def check_error_threshold(self, pattern: str) -> bool:
        """Check if error threshold has been exceeded"""
        now = datetime.now()
        cutoff = now.timestamp() - (self.time_window * 60)
        
        # Remove old errors
        self.error_counts[pattern] = [
            ts for ts in self.error_counts[pattern]
            if ts.timestamp() > cutoff
        ]
        
        # Add current error
        self.error_counts[pattern].append(now)
        
        # Check threshold
        return len(self.error_counts[pattern]) >= self.error_threshold
    
    def process_log_entry(self, entry: dict):
        """Process a parsed log entry and send alerts if needed"""
        if not entry or not entry['type']:
            return
        
        pattern = entry['pattern']
        severity = entry['type']
        
        # For errors, check threshold
        if severity == 'error':
            if self.check_error_threshold(pattern):
                count = len(self.error_counts[pattern])
                self.alert_manager.send_alert(
                    title=f"Multiple {pattern.replace('_', ' ').title()} Detected",
                    message=f"Detected {count} errors in the last {self.time_window} minutes",
                    severity='error',
                    details={
                        'Pattern': pattern,
                        'Count': count,
                        'Time Window': f"{self.time_window} minutes",
                        'Latest Error': entry['message'][:200]
                    }
                )
        
        # For warnings, send immediate alert (throttled by AlertManager)
        elif severity == 'warning':
            self.alert_manager.send_alert(
                title=f"Plex Warning: {pattern.replace('_', ' ').title()}",
                message=entry['message'][:300],
                severity='warning',
                details={
                    'Pattern': pattern,
                    'Timestamp': entry['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
                }
            )
    
    def tail_file(self, filepath: Path):
        """Tail a log file and process new lines"""
        logger.info(f"Monitoring log file: {filepath}")
        
        try:
            with open(filepath, 'r') as f:
                # Go to end of file
                f.seek(0, 2)
                
                while True:
                    line = f.readline()
                    
                    if line:
                        entry = self.parse_log_line(line)
                        if entry:
                            self.process_log_entry(entry)
                    else:
                        time.sleep(0.5)
        
        except Exception as e:
            logger.error(f"Error tailing file {filepath}: {e}")
    
    def run(self):
        """Main monitoring loop"""
        logger.info("Starting Sentarr - Plex Log Monitor")
        logger.info(f"Log path: {self.log_path}")
        logger.info(f"Monitor errors: {self.monitor_errors}")
        logger.info(f"Monitor warnings: {self.monitor_warnings}")
        logger.info(f"Error threshold: {self.error_threshold} in {self.time_window} minutes")
        
        # Send startup notification
        self.alert_manager.send_alert(
            title="Sentarr Started",
            message="Log monitoring has been initiated",
            severity='info'
        )
        
        log_files = self.get_log_files()
        
        if not log_files:
            logger.error("No log files found to monitor!")
            return
        
        logger.info(f"Found {len(log_files)} log file(s) to monitor")
        
        # For simplicity, we'll monitor the main log file
        # In production, you might want to use threading to monitor multiple files
        main_log = log_files[0]
        self.tail_file(main_log)


def main():
    """Main entry point"""
    log_path = os.getenv('PLEX_LOG_PATH', '/config/Library/Application Support/Plex Media Server/Logs')
    
    # Initialize components
    alert_manager = AlertManager()
    monitor = PlexLogMonitor(log_path, alert_manager)
    
    # Run monitor
    try:
        monitor.run()
    except KeyboardInterrupt:
        logger.info("Monitor stopped by user")
    except Exception as e:
        logger.error(f"Monitor crashed: {e}")
        alert_manager.send_alert(
            title="Sentarr Crashed",
            message=f"Monitor encountered an error: {str(e)}",
            severity='critical'
        )


if __name__ == '__main__':
    main()
