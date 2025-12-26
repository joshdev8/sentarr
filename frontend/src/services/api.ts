/// <reference types="vite/client" />
import { Alert, AlertsResponse, Stats, SystemConfig, NotificationChannel } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Alerts
  async getAlerts(): Promise<AlertsResponse> {
    return this.fetchJson<AlertsResponse>('/alerts');
  }

  async resolveAlert(alertId: string, note?: string): Promise<Alert> {
    return this.fetchJson<Alert>(`/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.fetchJson(`/alerts/${alertId}`, {
      method: 'DELETE',
    });
  }

  // Stats
  async getStats(): Promise<Stats> {
    return this.fetchJson<Stats>('/stats');
  }

  // Config
  async getConfig(): Promise<SystemConfig> {
    return this.fetchJson<SystemConfig>('/config');
  }

  async updateConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    return this.fetchJson<SystemConfig>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Notification Channels
  async getNotificationChannels(): Promise<NotificationChannel[]> {
    return this.fetchJson<NotificationChannel[]>('/notifications/channels');
  }

  async updateNotificationChannel(
    channelId: string,
    updates: Partial<NotificationChannel>
  ): Promise<NotificationChannel> {
    return this.fetchJson<NotificationChannel>(`/notifications/channels/${channelId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async testNotificationChannel(channelId: string): Promise<{ success: boolean; message: string }> {
    return this.fetchJson(`/notifications/channels/${channelId}/test`, {
      method: 'POST',
    });
  }

  // System
  async getSystemHealth(): Promise<{ healthy: boolean; uptime: number; version: string }> {
    return this.fetchJson('/system/health');
  }
}

export const apiService = new ApiService();
