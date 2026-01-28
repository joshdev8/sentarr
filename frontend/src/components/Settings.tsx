import React, { useState, useEffect } from "react";
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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Save,
  Refresh,
  Email,
  Send,
  ExpandMore,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";

import { SystemConfig, NotificationsConfig } from "../types";
import { apiService } from "../services/api";

interface SettingsProps {
  onRefresh: () => void;
}

const defaultNotifications: NotificationsConfig = {
  email: {
    enabled: false,
    smtpServer: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    fromAddress: "",
    toAddress: "",
  },
  discord: {
    enabled: false,
    webhookUrl: "",
  },
  slack: {
    enabled: false,
    webhookUrl: "",
  },
  webhook: {
    enabled: false,
    webhookUrl: "",
  },
};

const Settings: React.FC<SettingsProps> = ({ onRefresh }) => {
  const [config, setConfig] = useState<SystemConfig>({
    monitorErrors: true,
    monitorWarnings: true,
    errorThreshold: 5,
    timeWindowMinutes: 5,
    alertCooldownMinutes: 15,
    logPath: "/logs",
    temperatureUnit: "C",
    notifications: defaultNotifications,
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await apiService.getConfig();
      setConfig({
        ...config,
        ...data,
        notifications: {
          ...defaultNotifications,
          ...data.notifications,
        },
      });
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const handleConfigChange = (field: keyof SystemConfig, value: unknown) => {
    setConfig({ ...config, [field]: value });
    setHasChanges(true);
  };

  const handleNotificationChange = (
    channel: keyof NotificationsConfig,
    field: string,
    value: unknown,
  ) => {
    setConfig({
      ...config,
      notifications: {
        ...config.notifications,
        [channel]: {
          ...config.notifications[channel],
          [field]: value,
        },
      },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateConfig(config);
      setSnackbar({
        open: true,
        message: "Settings saved successfully!",
        severity: "success",
      });
      setHasChanges(false);
      onRefresh();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to save settings",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestChannel = async (channelId: string) => {
    try {
      setTestingChannel(channelId);
      // Save first to ensure latest config is used
      await apiService.updateConfig(config);
      const result = await apiService.testNotificationChannel(channelId);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Test failed: ${error}`,
        severity: "error",
      });
    } finally {
      setTestingChannel(null);
    }
  };

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          mb: { xs: 2, sm: 4 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
            }}
          >
            Settings
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            Configure monitoring, alerts, and notifications
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadConfig}
            size="small"
            sx={{ flex: { xs: 1, sm: "unset" } }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
            size="small"
            sx={{ flex: { xs: 1, sm: "unset" } }}
          >
            Save
          </Button>
        </Box>
      </Box>

      {/* Monitoring Settings */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Monitoring Settings
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.monitorErrors}
                    onChange={(e) =>
                      handleConfigChange("monitorErrors", e.target.checked)
                    }
                    color="primary"
                  />
                }
                label="Monitor Errors"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ ml: 6 }}
              >
                Track error-level log entries and send alerts
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.monitorWarnings}
                    onChange={(e) =>
                      handleConfigChange("monitorWarnings", e.target.checked)
                    }
                    color="primary"
                  />
                }
                label="Monitor Warnings"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ ml: 6 }}
              >
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
                onChange={(e) =>
                  handleConfigChange("errorThreshold", parseInt(e.target.value))
                }
                helperText="Number of errors before sending an alert"
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Time Window (minutes)"
                type="number"
                value={config.timeWindowMinutes}
                onChange={(e) =>
                  handleConfigChange(
                    "timeWindowMinutes",
                    parseInt(e.target.value),
                  )
                }
                helperText="Period to count errors within"
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Alert Cooldown (minutes)"
                type="number"
                value={config.alertCooldownMinutes}
                onChange={(e) =>
                  handleConfigChange(
                    "alertCooldownMinutes",
                    parseInt(e.target.value),
                  )
                }
                helperText="Minimum time between similar alerts"
                inputProps={{ min: 1, max: 120 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Display Settings
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Temperature Unit
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip
                  label="Celsius"
                  color={config.temperatureUnit === "C" ? "primary" : "default"}
                  onClick={() => handleConfigChange("temperatureUnit", "C")}
                  sx={{ cursor: "pointer" }}
                />
                <Chip
                  label="Fahrenheit"
                  color={config.temperatureUnit === "F" ? "primary" : "default"}
                  onClick={() => handleConfigChange("temperatureUnit", "F")}
                  sx={{ cursor: "pointer" }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1 }}
              >
                Choose how temperatures are displayed in Host Monitor
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Notification Channels
      </Typography>

      {/* Email */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Email sx={{ color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Email Notifications
            </Typography>
            <Box sx={{ ml: "auto", mr: 2 }}>
              <Chip
                label={
                  config.notifications.email.enabled ? "ENABLED" : "DISABLED"
                }
                color={
                  config.notifications.email.enabled ? "success" : "default"
                }
                size="small"
              />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.notifications.email.enabled}
                    onChange={(e) =>
                      handleNotificationChange(
                        "email",
                        "enabled",
                        e.target.checked,
                      )
                    }
                    color="primary"
                  />
                }
                label="Enable Email Notifications"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Server"
                value={config.notifications.email.smtpServer}
                onChange={(e) =>
                  handleNotificationChange(
                    "email",
                    "smtpServer",
                    e.target.value,
                  )
                }
                placeholder="smtp.gmail.com"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Port"
                type="number"
                value={config.notifications.email.smtpPort}
                onChange={(e) =>
                  handleNotificationChange(
                    "email",
                    "smtpPort",
                    parseInt(e.target.value),
                  )
                }
                placeholder="587"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Username"
                value={config.notifications.email.smtpUser}
                onChange={(e) =>
                  handleNotificationChange("email", "smtpUser", e.target.value)
                }
                placeholder="your-email@gmail.com"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Password"
                type={showPassword ? "text" : "password"}
                value={config.notifications.email.smtpPassword}
                onChange={(e) =>
                  handleNotificationChange(
                    "email",
                    "smtpPassword",
                    e.target.value,
                  )
                }
                placeholder="App password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="From Address"
                value={config.notifications.email.fromAddress}
                onChange={(e) =>
                  handleNotificationChange(
                    "email",
                    "fromAddress",
                    e.target.value,
                  )
                }
                placeholder="sentarr@yourdomain.com"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="To Address"
                value={config.notifications.email.toAddress}
                onChange={(e) =>
                  handleNotificationChange("email", "toAddress", e.target.value)
                }
                placeholder="admin@yourdomain.com"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => handleTestChannel("email")}
                disabled={
                  !config.notifications.email.enabled ||
                  testingChannel === "email"
                }
                startIcon={
                  testingChannel === "email" ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Send />
                  )
                }
              >
                Send Test Email
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Discord */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Send sx={{ color: "#5865F2" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Discord Webhook
            </Typography>
            <Box sx={{ ml: "auto", mr: 2 }}>
              <Chip
                label={
                  config.notifications.discord.enabled ? "ENABLED" : "DISABLED"
                }
                color={
                  config.notifications.discord.enabled ? "success" : "default"
                }
                size="small"
              />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.notifications.discord.enabled}
                    onChange={(e) =>
                      handleNotificationChange(
                        "discord",
                        "enabled",
                        e.target.checked,
                      )
                    }
                    color="primary"
                  />
                }
                label="Enable Discord Notifications"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Discord Webhook URL"
                value={config.notifications.discord.webhookUrl}
                onChange={(e) =>
                  handleNotificationChange(
                    "discord",
                    "webhookUrl",
                    e.target.value,
                  )
                }
                placeholder="https://discord.com/api/webhooks/..."
                helperText="Create a webhook in your Discord server settings"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => handleTestChannel("discord")}
                disabled={
                  !config.notifications.discord.enabled ||
                  testingChannel === "discord"
                }
                startIcon={
                  testingChannel === "discord" ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Send />
                  )
                }
              >
                Send Test Message
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Slack */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Send sx={{ color: "#4A154B" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Slack Webhook
            </Typography>
            <Box sx={{ ml: "auto", mr: 2 }}>
              <Chip
                label={
                  config.notifications.slack.enabled ? "ENABLED" : "DISABLED"
                }
                color={
                  config.notifications.slack.enabled ? "success" : "default"
                }
                size="small"
              />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.notifications.slack.enabled}
                    onChange={(e) =>
                      handleNotificationChange(
                        "slack",
                        "enabled",
                        e.target.checked,
                      )
                    }
                    color="primary"
                  />
                }
                label="Enable Slack Notifications"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slack Webhook URL"
                value={config.notifications.slack.webhookUrl}
                onChange={(e) =>
                  handleNotificationChange(
                    "slack",
                    "webhookUrl",
                    e.target.value,
                  )
                }
                placeholder="https://hooks.slack.com/services/..."
                helperText="Create an incoming webhook in your Slack workspace"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => handleTestChannel("slack")}
                disabled={
                  !config.notifications.slack.enabled ||
                  testingChannel === "slack"
                }
                startIcon={
                  testingChannel === "slack" ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Send />
                  )
                }
              >
                Send Test Message
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Custom Webhook */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Send sx={{ color: "warning.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Custom Webhook
            </Typography>
            <Box sx={{ ml: "auto", mr: 2 }}>
              <Chip
                label={
                  config.notifications.webhook.enabled ? "ENABLED" : "DISABLED"
                }
                color={
                  config.notifications.webhook.enabled ? "success" : "default"
                }
                size="small"
              />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.notifications.webhook.enabled}
                    onChange={(e) =>
                      handleNotificationChange(
                        "webhook",
                        "enabled",
                        e.target.checked,
                      )
                    }
                    color="primary"
                  />
                }
                label="Enable Custom Webhook"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={config.notifications.webhook.webhookUrl}
                onChange={(e) =>
                  handleNotificationChange(
                    "webhook",
                    "webhookUrl",
                    e.target.value,
                  )
                }
                placeholder="https://your-service.com/webhook"
                helperText="Any HTTP endpoint that accepts POST requests with JSON payload"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => handleTestChannel("webhook")}
                disabled={
                  !config.notifications.webhook.enabled ||
                  testingChannel === "webhook"
                }
                startIcon={
                  testingChannel === "webhook" ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Send />
                  )
                }
              >
                Send Test Request
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
          icon={
            snackbar.severity === "success" ? <CheckCircle /> : <ErrorIcon />
          }
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
