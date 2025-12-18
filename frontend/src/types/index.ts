export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';
export type AlertStatus = 'open' | 'closed';
export type AlertPattern = 
  | 'stream_error' 
  | 'database_error' 
  | 'network_error' 
  | 'auth_error' 
  | 'scanner_error' 
  | 'disk_error'
  | 'transcoding_warning'
  | 'performance_warning'
  | 'permission_warning';

export interface AlertDetails {
  Pattern?: string;
  Count?: number;
  'Time Window'?: string;
  'Latest Error'?: string;
  [key: string]: any;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  pattern?: AlertPattern;
  timestamp: string;
  details?: AlertDetails;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface Stats {
  totalAlerts: number;
  openAlerts: number;
  errorCount: number;
  warningCount: number;
  criticalCount?: number;
  last24Hours?: number;
}

export interface TimelineDataPoint {
  time: string;
  errors: number;
  warnings: number;
}

export interface AlertTypeData {
  name: string;
  value: number;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'discord' | 'slack' | 'webhook';
  enabled: boolean;
  config: {
    [key: string]: any;
  };
}

export interface SystemConfig {
  monitorErrors: boolean;
  monitorWarnings: boolean;
  errorThreshold: number;
  timeWindowMinutes: number;
  alertCooldownMinutes: number;
  logPath: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  stats: Stats;
}

export type PageType = 'dashboard' | 'open-alerts' | 'closed-alerts' | 'settings';
