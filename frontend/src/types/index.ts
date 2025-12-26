export type AlertSeverity = "critical" | "error" | "warning" | "info";
export type AlertStatus = "open" | "closed";
export type AlertPattern =
  | "stream_error"
  | "database_error"
  | "network_error"
  | "auth_error"
  | "scanner_error"
  | "disk_error"
  | "transcoding_warning"
  | "performance_warning"
  | "permission_warning";

export interface AlertDetails {
  Pattern?: string;
  Count?: number;
  "Time Window"?: string;
  "Latest Error"?: string;
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
  activeSessions?: number;
  serverName?: string;
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
  type: "email" | "discord" | "slack" | "webhook";
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

export type PageType =
  | "dashboard"
  | "open-alerts"
  | "closed-alerts"
  | "settings"
  | "logs"
  | "plex-status";

// Plex Types
export interface PlexLibrary {
  title: string;
  type: string;
  count: number;
  scanned: boolean;
}

export interface PlexStatus {
  connected: boolean;
  serverName?: string;
  version?: string;
  platform?: string;
  platformVersion?: string;
  activeSessions?: number;
  libraries?: PlexLibrary[];
  totalMovies?: number;
  totalShows?: number;
  totalMusic?: number;
  transcodeSessions?: number;
  error?: string;
  updatedAt?: string;
}

export interface PlayerInfo {
  device: string;
  platform: string;
  product: string;
  state: string;
  address: string;
}

export interface TranscodeInfo {
  videoDecision: string;
  audioDecision: string;
  throttled: boolean;
  speed: number;
}

export interface PlexStream {
  id: string;
  user: string;
  title: string;
  type: string;
  year?: number;
  thumb?: string;
  grandparentTitle?: string;
  parentTitle?: string;
  duration: number;
  viewOffset: number;
  progress: number;
  player: PlayerInfo;
  transcoding: boolean;
  transcodeInfo?: TranscodeInfo;
}

export interface PlexStreamsResponse {
  streams: PlexStream[];
  count: number;
  error?: string;
  updatedAt?: string;
}

// Log Types
export interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warning" | "error";
  message: string;
  source: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  count: number;
  logPath: string;
  updatedAt?: string;
}

// System Metrics Types
export interface SystemMetrics {
  cpu: {
    percent: number;
    cores: number;
  };
  memory: {
    total: number;
    available: number;
    used: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  uptime: number;
  uptimeFormatted: string;
  updatedAt?: string;
}

export interface SystemHealth {
  healthy: boolean;
  uptime: number;
  version: string;
  plexConnected: boolean;
  plexServerName?: string;
  logPath: string;
  logPathExists: boolean;
}
