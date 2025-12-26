import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  useTheme,
  alpha,
  Skeleton,
} from "@mui/material";
import {
  TrendingUp,
  Warning as WarningIcon,
  CheckCircle,
  Tv,
  Movie,
  PlayArrow,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Stats,
  Alert,
  TimelineDataPoint,
  AlertTypeData,
  AlertSeverity,
  PlexStatus,
  PlexStream,
} from "../types";
import { apiService } from "../services/api";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
  loading,
}) => {
  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.3)} 100%)`,
        },
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${alpha(color, 0.3)}`,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: alpha(color, 0.1),
              mr: 2,
            }}
          >
            <Icon sx={{ fontSize: 28, color }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={40} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 700, color }}>
                {value}
              </Typography>
            )}
          </Box>
        </Box>

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}

        {trend !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <TrendingUp
              sx={{
                fontSize: 16,
                mr: 0.5,
                color: trend > 0 ? "error.main" : "success.main",
                transform: trend < 0 ? "rotate(180deg)" : "none",
              }}
            />
            <Typography
              variant="caption"
              color={trend > 0 ? "error.main" : "success.main"}
            >
              {Math.abs(trend)}% from last hour
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface AlertTypeChartProps {
  data: AlertTypeData[];
}

const AlertTypeChart: React.FC<AlertTypeChartProps> = ({ data }) => {
  const theme = useTheme();

  const COLORS: Record<string, string> = {
    stream_error: theme.palette.error.main,
    database_error: theme.palette.warning.main,
    network_error: theme.palette.info.main,
    auth_error: theme.palette.secondary.main,
    scanner_error: theme.palette.success.main,
    disk_error: theme.palette.error.dark,
  };

  if (data.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <Typography color="text.secondary">No alert data</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.name] || theme.palette.primary.main}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

interface ErrorTimelineChartProps {
  data: TimelineDataPoint[];
}

const ErrorTimelineChart: React.FC<ErrorTimelineChartProps> = ({ data }) => {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <Typography color="text.secondary">No timeline data</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={theme.palette.error.main}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={theme.palette.error.main}
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="colorWarnings" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={theme.palette.warning.main}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={theme.palette.warning.main}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={alpha(theme.palette.text.primary, 0.1)}
        />
        <XAxis
          dataKey="time"
          stroke={theme.palette.text.secondary}
          style={{ fontSize: "12px" }}
        />
        <YAxis
          stroke={theme.palette.text.secondary}
          style={{ fontSize: "12px" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
          }}
        />
        <Area
          type="monotone"
          dataKey="errors"
          stroke={theme.palette.error.main}
          fillOpacity={1}
          fill="url(#colorErrors)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="warnings"
          stroke={theme.palette.warning.main}
          fillOpacity={1}
          fill="url(#colorWarnings)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

interface RecentAlertProps {
  alert: Alert;
}

const RecentAlert: React.FC<RecentAlertProps> = ({ alert }) => {
  const theme = useTheme();

  const severityColors: Record<AlertSeverity, string> = {
    critical: theme.palette.error.main,
    error: theme.palette.error.light,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        background: alpha(severityColors[alert.severity], 0.05),
        border: 1,
        borderColor: alpha(severityColors[alert.severity], 0.2),
        borderRadius: 2,
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateX(4px)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
        <Chip
          label={alert.severity.toUpperCase()}
          size="small"
          sx={{
            backgroundColor: severityColors[alert.severity],
            color: "white",
            fontWeight: 600,
            mr: 1,
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {new Date(alert.timestamp).toLocaleString()}
        </Typography>
      </Box>

      <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
        {alert.title}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {alert.message}
      </Typography>

      {alert.pattern && (
        <Chip
          label={alert.pattern.replace("_", " ")}
          size="small"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      )}
    </Paper>
  );
};

interface ActiveStreamCardProps {
  stream: PlexStream;
}

const ActiveStreamCard: React.FC<ActiveStreamCardProps> = ({ stream }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        background: alpha(theme.palette.success.main, 0.05),
        border: 1,
        borderColor: alpha(theme.palette.success.main, 0.2),
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <PlayArrow sx={{ color: "success.main", fontSize: 18 }} />
        <Typography variant="body2" fontWeight={600}>
          {stream.user}
        </Typography>
        <Chip
          label={stream.player.state}
          size="small"
          color={stream.player.state === "playing" ? "success" : "default"}
          sx={{ ml: "auto", height: 20, fontSize: "0.7rem" }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" noWrap>
        {stream.grandparentTitle ? `${stream.grandparentTitle} - ` : ""}
        {stream.title}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={stream.progress}
        sx={{ mt: 1, height: 4, borderRadius: 2 }}
      />
    </Paper>
  );
};

interface DashboardProps {
  stats: Stats;
  alerts: Alert[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, alerts }) => {
  const theme = useTheme();
  const [plexStatus, setPlexStatus] = useState<PlexStatus | null>(null);
  const [streams, setStreams] = useState<PlexStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [alertTypeData, setAlertTypeData] = useState<AlertTypeData[]>([]);
  const [systemHealth, setSystemHealth] = useState(100);

  useEffect(() => {
    const fetchPlexData = async () => {
      try {
        const [statusData, streamsData] = await Promise.all([
          apiService.getPlexStatus(),
          apiService.getPlexStreams(),
        ]);
        setPlexStatus(statusData);
        setStreams(streamsData.streams || []);
      } catch (error) {
        console.error("Failed to fetch Plex data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlexData();
    const interval = setInterval(fetchPlexData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate timeline data from alerts
    const now = new Date();
    const data: TimelineDataPoint[] = [];

    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60000);
      const timeStr = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Count alerts in this time window
      const windowStart = new Date(time.getTime() - 5 * 60000);
      const windowAlerts = alerts.filter((a) => {
        const alertTime = new Date(a.timestamp);
        return alertTime >= windowStart && alertTime < time;
      });

      data.push({
        time: timeStr,
        errors: windowAlerts.filter(
          (a) => a.severity === "error" || a.severity === "critical",
        ).length,
        warnings: windowAlerts.filter((a) => a.severity === "warning").length,
      });
    }

    setTimelineData(data);

    // Generate alert type distribution from real data
    const typeCounts: Record<string, number> = {};
    alerts.forEach((alert) => {
      if (alert.pattern) {
        typeCounts[alert.pattern] = (typeCounts[alert.pattern] || 0) + 1;
      }
    });

    setAlertTypeData(
      Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
    );
  }, [alerts]);

  // Calculate system health based on alerts and Plex status
  useEffect(() => {
    let health = 100;
    health -= (stats.errorCount || 0) * 5;
    health -= (stats.warningCount || 0) * 2;
    if (!plexStatus?.connected) health -= 20;
    setSystemHealth(Math.max(0, Math.min(100, health)));
  }, [stats, plexStatus]);

  const recentAlerts = alerts.filter((a) => a.status === "open").slice(0, 3);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time monitoring of your Plex Media Server
          {plexStatus?.serverName && ` - ${plexStatus.serverName}`}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Streams"
            value={streams.length}
            icon={Tv}
            color={theme.palette.success.main}
            subtitle={
              plexStatus?.connected ? "Plex connected" : "Plex disconnected"
            }
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Alerts"
            value={stats.openAlerts || 0}
            icon={WarningIcon}
            color={
              stats.openAlerts > 0
                ? theme.palette.error.main
                : theme.palette.success.main
            }
            subtitle="Requires attention"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Movies"
            value={plexStatus?.totalMovies || 0}
            icon={Movie}
            color={theme.palette.info.main}
            subtitle="In library"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Health"
            value={`${systemHealth}%`}
            icon={CheckCircle}
            color={
              systemHealth > 80
                ? theme.palette.success.main
                : systemHealth > 50
                  ? theme.palette.warning.main
                  : theme.palette.error.main
            }
            subtitle="Overall status"
          />
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Alert Timeline (Last Hour)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Real-time error and warning detection
              </Typography>
              <ErrorTimelineChart data={timelineData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Alert Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                By error type
              </Typography>
              <AlertTypeChart data={alertTypeData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                System Status
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Plex Server</Typography>
                  <Chip
                    label={plexStatus?.connected ? "CONNECTED" : "DISCONNECTED"}
                    size="small"
                    color={plexStatus?.connected ? "success" : "error"}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={plexStatus?.connected ? 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(
                      plexStatus?.connected
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                      0.1,
                    ),
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: plexStatus?.connected
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Log Monitoring</Typography>
                  <Chip label="ACTIVE" size="small" color="success" />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: theme.palette.success.main,
                    },
                  }}
                />
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Server Health</Typography>
                  <Chip
                    label={
                      systemHealth > 80
                        ? "HEALTHY"
                        : systemHealth > 50
                          ? "DEGRADED"
                          : "CRITICAL"
                    }
                    size="small"
                    color={
                      systemHealth > 80
                        ? "success"
                        : systemHealth > 50
                          ? "warning"
                          : "error"
                    }
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemHealth}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(
                      systemHealth > 80
                        ? theme.palette.success.main
                        : systemHealth > 50
                          ? theme.palette.warning.main
                          : theme.palette.error.main,
                      0.1,
                    ),
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        systemHealth > 80
                          ? theme.palette.success.main
                          : systemHealth > 50
                            ? theme.palette.warning.main
                            : theme.palette.error.main,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {streams.length > 0 ? "Active Streams" : "Recent Alerts"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {streams.length > 0
                  ? `${streams.length} active stream${streams.length !== 1 ? "s" : ""}`
                  : "Latest alerts"}
              </Typography>

              <Box sx={{ maxHeight: 350, overflowY: "auto" }}>
                {streams.length > 0 ? (
                  streams
                    .slice(0, 4)
                    .map((stream) => (
                      <ActiveStreamCard key={stream.id} stream={stream} />
                    ))
                ) : recentAlerts.length > 0 ? (
                  recentAlerts.map((alert) => (
                    <RecentAlert key={alert.id} alert={alert} />
                  ))
                ) : (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <CheckCircle
                      sx={{ fontSize: 48, color: "success.main", mb: 2 }}
                    />
                    <Typography variant="body1" color="text.secondary">
                      All systems operational
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No active streams or alerts
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
