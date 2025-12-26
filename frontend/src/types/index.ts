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
  [key: string]: unknown;
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
    [key: string]: unknown;
  };
}

export interface EmailConfig {
  enabled: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromAddress: string;
  toAddress: string;
}

export interface WebhookConfig {
  enabled: boolean;
  webhookUrl: string;
}

export interface NotificationsConfig {
  email: EmailConfig;
  discord: WebhookConfig;
  slack: WebhookConfig;
  webhook: WebhookConfig;
}

export interface SystemConfig {
  monitorErrors: boolean;
  monitorWarnings: boolean;
  errorThreshold: number;
  timeWindowMinutes: number;
  alertCooldownMinutes: number;
  logPath: string;
  notifications: NotificationsConfig;
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
  key: string;
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
  bandwidth?: number;
  error?: string;
  updatedAt?: string;
}

export interface PlayerInfo {
  device: string;
  platform: string;
  product: string;
  state: string;
  address: string;
  local?: boolean;
}

export interface TranscodeInfo {
  videoDecision: string;
  audioDecision: string;
  throttled: boolean;
  speed: number;
  progress?: number;
  transcodeHwRequested?: boolean;
}

export interface MediaInfo {
  videoResolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioChannels?: number;
  container?: string;
  bitrate?: number;
}

export interface EpisodeInfo {
  seasonNumber?: number;
  episodeNumber?: number;
}

export interface PlexStream {
  id: string;
  user: string;
  userThumb?: string;
  title: string;
  type: string;
  year?: number;
  thumb?: string;
  art?: string;
  grandparentTitle?: string;
  grandparentThumb?: string;
  parentTitle?: string;
  summary?: string;
  rating?: number;
  contentRating?: string;
  duration: number;
  viewOffset: number;
  progress: number;
  player: PlayerInfo;
  transcoding: boolean;
  transcodeInfo?: TranscodeInfo;
  mediaInfo?: MediaInfo;
  episodeInfo?: EpisodeInfo;
  bandwidth?: number;
}

export interface PlexStreamsResponse {
  streams: PlexStream[];
  count: number;
  totalBandwidth?: number;
  transcodingCount?: number;
  directPlayCount?: number;
  error?: string;
  updatedAt?: string;
}

export interface PlexMediaItem {
  title: string;
  type: string;
  year?: number;
  thumb?: string;
  addedAt?: string;
  grandparentTitle?: string;
  grandparentThumb?: string;
  parentTitle?: string;
  summary?: string;
  rating?: number;
  duration?: number;
  viewOffset?: number;
  progress?: number;
}

export interface RecentlyAddedResponse {
  items: PlexMediaItem[];
  count: number;
  updatedAt?: string;
}

export interface OnDeckResponse {
  items: PlexMediaItem[];
  count: number;
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
