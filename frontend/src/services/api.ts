/// <reference types="vite/client" />
import {
  Alert,
  AlertsResponse,
  Stats,
  SystemConfig,
  NotificationChannel,
  PlexStatus,
  PlexStreamsResponse,
  LogsResponse,
  SystemMetrics,
  SystemHealth,
  RecentlyAddedResponse,
  OnDeckResponse,
  HostMetrics,
} from "../types";

// In production, use relative URL so nginx proxies to the API
// In development, Vite proxy handles /api -> localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiService {
  private async fetchJson<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================
  // ALERTS
  // ============================================

  async getAlerts(): Promise<AlertsResponse> {
    return this.fetchJson<AlertsResponse>("/alerts");
  }

  async resolveAlert(alertId: string, note?: string): Promise<Alert> {
    return this.fetchJson<Alert>(`/alerts/${alertId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.fetchJson(`/alerts/${alertId}`, {
      method: "DELETE",
    });
  }

  // ============================================
  // STATS
  // ============================================

  async getStats(): Promise<Stats> {
    return this.fetchJson<Stats>("/stats");
  }

  // ============================================
  // PLEX
  // ============================================

  async getPlexStatus(): Promise<PlexStatus> {
    return this.fetchJson<PlexStatus>("/plex/status");
  }

  async getPlexStreams(): Promise<PlexStreamsResponse> {
    return this.fetchJson<PlexStreamsResponse>("/plex/streams");
  }

  async getRecentlyAdded(limit: number = 10): Promise<RecentlyAddedResponse> {
    return this.fetchJson<RecentlyAddedResponse>(
      `/plex/recently-added?limit=${limit}`,
    );
  }

  async getOnDeck(limit: number = 10): Promise<OnDeckResponse> {
    return this.fetchJson<OnDeckResponse>(`/plex/on-deck?limit=${limit}`);
  }

  // ============================================
  // LOGS
  // ============================================

  async getLogs(lines: number = 100, level?: string): Promise<LogsResponse> {
    const params = new URLSearchParams({ lines: lines.toString() });
    if (level && level !== "all") {
      params.append("level", level);
    }
    return this.fetchJson<LogsResponse>(`/logs?${params}`);
  }

  getLogStreamUrl(): string {
    return `${API_BASE_URL}/logs/stream`;
  }

  // ============================================
  // SYSTEM
  // ============================================

  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.fetchJson<SystemMetrics>("/system/metrics");
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return this.fetchJson<SystemHealth>("/system/health");
  }

  async getHostMetrics(): Promise<HostMetrics> {
    return this.fetchJson<HostMetrics>("/host/metrics");
  }

  // ============================================
  // CONFIG
  // ============================================

  async getConfig(): Promise<SystemConfig> {
    return this.fetchJson<SystemConfig>("/config");
  }

  async updateConfig(
    config: Partial<SystemConfig>,
  ): Promise<{ success: boolean; config: SystemConfig }> {
    return this.fetchJson<{ success: boolean; config: SystemConfig }>(
      "/config",
      {
        method: "PUT",
        body: JSON.stringify(config),
      },
    );
  }

  // ============================================
  // NOTIFICATION CHANNELS
  // ============================================

  async getNotificationChannels(): Promise<NotificationChannel[]> {
    return this.fetchJson<NotificationChannel[]>("/notifications/channels");
  }

  async updateNotificationChannel(
    channelId: string,
    updates: Partial<NotificationChannel>,
  ): Promise<NotificationChannel> {
    return this.fetchJson<NotificationChannel>(
      `/notifications/channels/${channelId}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      },
    );
  }

  async testNotificationChannel(
    channelId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.fetchJson(`/notifications/channels/${channelId}/test`, {
      method: "POST",
    });
  }
}

export const apiService = new ApiService();
