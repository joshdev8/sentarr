import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert as MuiAlert,
  Snackbar,
  IconButton,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Save,
  Refresh,
  Email,
  Send,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

import { SystemConfig, NotificationChannel } from '../types';
import { apiService } from '../services/api';

interface NotificationChannelCardProps {
  channel: NotificationChannel;
  onTest: (channelId: string) => void;
  onToggle: (channelId: string, enabled: boolean) => void;
}

const NotificationChannelCard: React.FC<NotificationChannelCardProps> = ({ channel, onTest, onToggle }) => {
  const theme = useTheme();

  const channelIcons: Record<string, JSX.Element> = {
    email: <Email />,
    discord: <Send />,
    slack: <Send />,
    webhook: <Send />,
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              {channelIcons[channel.type]}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {channel.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {channel.type.toUpperCase()}
              </Typography>
            </Box>
          </Box>

          <Chip
            label={channel.enabled ? 'ENABLED' : 'DISABLED'}
            color={channel.enabled ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={channel.enabled}
                onChange={(e) => onToggle(channel.id, e.target.checked)}
                color="primary"
              />
            }
            label="Enabled"
          />
          
          <Button
            variant="outlined"
            size="small"
            onClick={() => onTest(channel.id)}
            disabled={!channel.enabled}
          >
            Test
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

interface SettingsProps {
  onRefresh: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onRefresh }) => {
  const [config, setConfig] = useState<SystemConfig>({
    monitorErrors: true,
    monitorWarnings: true,
    errorThreshold: 5,
    timeWindowMinutes: 5,
    alertCooldownMinutes: 15,
    logPath: '/config/Library/Application Support/Plex Media Server/Logs',
  });

  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
    loadChannels();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await apiService.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const loadChannels = async () => {
    try {
      const data = await apiService.getNotificationChannels();
      setChannels(data);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const handleConfigChange = (field: keyof SystemConfig, value: any) => {
    setConfig({ ...config, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await apiService.updateConfig(config);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully!',
        severity: 'success',
      });
      setHasChanges(false);
      onRefresh();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
    }
  };

  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    try {
      await apiService.updateNotificationChannel(channelId, { enabled });
      setChannels(channels.map(ch => ch.id === channelId ? { ...ch, enabled } : ch));
      setSnackbar({
        open: true,
        message: `Channel ${enabled ? 'enabled' : 'disabled'} successfully`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update channel',
        severity: 'error',
      });
    }
  };

  const handleChannelTest = async (channelId: string) => {
    try {
      const result = await apiService.testNotificationChannel(channelId);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? 'success' : 'error',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Test notification failed',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure monitoring and notification preferences
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              loadConfig();
              loadChannels();
            }}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Monitoring Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Monitoring Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.monitorErrors}
                    onChange={(e) => handleConfigChange('monitorErrors', e.target.checked)}
                    color="primary"
                  />
                }
                label="Monitor Errors"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6 }}>
                Track error-level log entries
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.monitorWarnings}
                    onChange={(e) => handleConfigChange('monitorWarnings', e.target.checked)}
                    color="primary"
                  />
                }
                label="Monitor Warnings"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6 }}>
                Track warning-level log entries
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Error Threshold"
                type="number"
                value={config.errorThreshold}
                onChange={(e) => handleConfigChange('errorThreshold', parseInt(e.target.value))}
                helperText="Number of errors before alerting"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Time Window (minutes)"
                type="number"
                value={config.timeWindowMinutes}
                onChange={(e) => handleConfigChange('timeWindowMinutes', parseInt(e.target.value))}
                helperText="Period to count errors"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Alert Cooldown (minutes)"
                type="number"
                value={config.alertCooldownMinutes}
                onChange={(e) => handleConfigChange('alertCooldownMinutes', parseInt(e.target.value))}
                helperText="Minimum time between similar alerts"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plex Log Path"
                value={config.logPath}
                onChange={(e) => handleConfigChange('logPath', e.target.value)}
                helperText="Path to Plex Media Server logs"
                disabled
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Notification Channels
      </Typography>

      <Grid container spacing={3}>
        {channels.map((channel) => (
          <Grid item xs={12} md={6} key={channel.id}>
            <NotificationChannelCard
              channel={channel}
              onTest={handleChannelTest}
              onToggle={handleChannelToggle}
            />
          </Grid>
        ))}
      </Grid>

      {channels.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ErrorIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No Notification Channels Configured
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure notification channels in your environment settings
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
