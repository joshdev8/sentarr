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
  CardActionArea,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  Warning as WarningIcon,
  CheckCircle,
  Tv,
  Movie,
  PlayArrow,
  Speed,
  Storage,
  Wifi,
  NewReleases,
  History,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Stats,
  Alert,
  TimelineDataPoint,
  PlexStatus,
  PlexStream,
  PlexMediaItem,
  SystemMetrics,
  PageType,
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
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
  loading,
  onClick,
}) => {
  const content = (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
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
        "&:hover": onClick
          ? {
            transform: "translateY(-4px)",
            boxShadow: `0 8px 24px ${alpha(color, 0.3)}`,
          }
          : {},
      }}
    >
      <CardContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          "&:last-child": { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", mb: { xs: 1, sm: 2 } }}
        >
          <Box
            sx={{
              width: { xs: 36, sm: 48 },
              height: { xs: 36, sm: 48 },
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: alpha(color, 0.1),
              mr: { xs: 1, sm: 2 },
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: { xs: 20, sm: 28 }, color }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
              noWrap
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={40} />
            ) : (
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color,
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                }}
                noWrap
              >
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

  return onClick ? (
    <CardActionArea onClick={onClick}>{content}</CardActionArea>
  ) : (
    content
  );
};

interface ActiveStreamCardProps {
  stream: PlexStream;
  onClick?: () => void;
}

const ActiveStreamCard: React.FC<ActiveStreamCardProps> = ({
  stream,
  onClick,
}) => {
  const theme = useTheme();

  const formatBitrate = (kbps?: number): string => {
    if (!kbps) return "";
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
    return `${kbps} kbps`;
  };

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: { xs: 1.5, sm: 2 },
        background: alpha(theme.palette.success.main, 0.05),
        border: 1,
        borderColor: alpha(theme.palette.success.main, 0.2),
        borderRadius: 2,
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s",
        "&:hover": onClick ? { transform: "translateX(4px)" } : {},
      }}
    >
      <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 2 } }}>
        {/* Poster/Thumbnail */}
        {stream.thumb ? (
          <Box
            component="img"
            src={stream.thumb}
            alt={stream.title}
            sx={{
              width: { xs: 45, sm: 60 },
              height: { xs: 68, sm: 90 },
              borderRadius: 1,
              objectFit: "cover",
              flexShrink: 0,
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Box
            sx={{
              width: { xs: 45, sm: 60 },
              height: { xs: 68, sm: 90 },
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {stream.type === "episode" ? <Tv /> : <Movie />}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mb: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Avatar
              sx={{
                width: { xs: 20, sm: 24 },
                height: { xs: 20, sm: 24 },
                bgcolor: "primary.main",
                fontSize: { xs: 10, sm: 12 },
              }}
            >
              {stream.user.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              noWrap
            >
              {stream.user}
            </Typography>
            <Chip
              label={stream.player.state}
              size="small"
              color={stream.player.state === "playing" ? "success" : "default"}
              sx={{
                ml: "auto",
                height: { xs: 18, sm: 20 },
                fontSize: { xs: "0.6rem", sm: "0.7rem" },
              }}
            />
          </Box>

          <Typography
            variant="subtitle2"
            fontWeight={600}
            noWrap
            sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
          >
            {stream.grandparentTitle
              ? `${stream.grandparentTitle}`
              : stream.title}
          </Typography>
          {stream.grandparentTitle && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {stream.parentTitle} - {stream.title}
              {stream.episodeInfo &&
                ` (S${stream.episodeInfo.seasonNumber}E${stream.episodeInfo.episodeNumber})`}
            </Typography>
          )}

          {/* Quality/Transcoding info */}
          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
            {stream.mediaInfo?.videoResolution && (
              <Chip
                label={stream.mediaInfo.videoResolution.toUpperCase()}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.65rem" }}
              />
            )}
            {stream.transcoding ? (
              <Chip
                label="Transcoding"
                size="small"
                color="warning"
                sx={{ height: 20, fontSize: "0.65rem" }}
              />
            ) : (
              <Chip
                label="Direct Play"
                size="small"
                color="success"
                sx={{ height: 20, fontSize: "0.65rem" }}
              />
            )}
            {stream.bandwidth && (
              <Chip
                label={formatBitrate(stream.bandwidth)}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.65rem" }}
              />
            )}
          </Box>

          {/* Progress */}
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={stream.progress}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

interface MediaItemCardProps {
  item: PlexMediaItem;
  type: "recently-added" | "on-deck";
}

const MediaItemCard: React.FC<MediaItemCardProps> = ({ item, type }) => {
  const theme = useTheme();

  return (
    <Tooltip title={item.title} arrow>
      <Paper
        sx={{
          width: { xs: 80, sm: 100 },
          flexShrink: 0,
          overflow: "hidden",
          borderRadius: { xs: 1, sm: 2 },
          transition: "transform 0.2s",
          "&:hover": { transform: "scale(1.05)" },
        }}
      >
        {item.thumb ? (
          <Box
            component="img"
            src={item.thumb}
            alt={item.title}
            sx={{
              width: "100%",
              height: { xs: 120, sm: 150 },
              objectFit: "cover",
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = "";
              e.currentTarget.style.backgroundColor = alpha(
                theme.palette.primary.main,
                0.1,
              );
            }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: { xs: 120, sm: 150 },
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.type === "episode" ? <Tv /> : <Movie />}
          </Box>
        )}
        <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
          <Typography
            variant="caption"
            noWrap
            display="block"
            fontWeight={600}
            sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
          >
            {item.grandparentTitle || item.title}
          </Typography>
          {item.grandparentTitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              display="block"
              sx={{ fontSize: { xs: "0.6rem", sm: "0.7rem" } }}
            >
              {item.title}
            </Typography>
          )}
          {type === "on-deck" && item.progress !== undefined && (
            <LinearProgress
              variant="determinate"
              value={item.progress}
              sx={{ mt: 0.5, height: 2, borderRadius: 1 }}
            />
          )}
        </Box>
      </Paper>
    </Tooltip>
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
          height: 200,
        }}
      >
        <Typography color="text.secondary">No timeline data</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
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
          style={{ fontSize: "10px" }}
        />
        <YAxis
          stroke={theme.palette.text.secondary}
          style={{ fontSize: "10px" }}
        />
        <RechartsTooltip
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

interface DashboardProps {
  stats: Stats;
  alerts: Alert[];
  onNavigate?: (page: PageType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, alerts, onNavigate }) => {
  const theme = useTheme();
  const [plexStatus, setPlexStatus] = useState<PlexStatus | null>(null);
  const [streams, setStreams] = useState<PlexStream[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<PlexMediaItem[]>([]);
  const [onDeck, setOnDeck] = useState<PlexMediaItem[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [systemHealth, setSystemHealth] = useState(100);

  useEffect(() => {
    const fetchPlexData = async () => {
      try {
        const [statusData, streamsData, recentData, deckData, metricsData] =
          await Promise.all([
            apiService.getPlexStatus(),
            apiService.getPlexStreams(),
            apiService.getRecentlyAdded(12),
            apiService.getOnDeck(12),
            apiService.getSystemMetrics(),
          ]);
        setPlexStatus(statusData);
        setStreams(streamsData.streams || []);
        setRecentlyAdded(recentData.items || []);
        setOnDeck(deckData.items || []);
        setMetrics(metricsData);
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
    const now = new Date();
    const data: TimelineDataPoint[] = [];

    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60000);
      const timeStr = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

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
  }, [alerts]);

  useEffect(() => {
    let health = 100;
    health -= (stats.errorCount || 0) * 5;
    health -= (stats.warningCount || 0) * 2;
    if (!plexStatus?.connected) health -= 20;
    setSystemHealth(Math.max(0, Math.min(100, health)));
  }, [stats, plexStatus]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatBitrate = (kbps?: number): string => {
    if (!kbps) return "0 kbps";
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
    return `${kbps} kbps`;
  };

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
          }}
        >
          Dashboard
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
        >
          Real-time monitoring of your Plex Media Server
          {plexStatus?.serverName && ` - ${plexStatus.serverName}`}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Active Streams"
            value={streams.length}
            icon={Tv}
            color={theme.palette.success.main}
            subtitle={
              plexStatus?.connected ? "Plex connected" : "Plex disconnected"
            }
            loading={loading}
            onClick={() => onNavigate?.("plex-status")}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
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
            onClick={() => onNavigate?.("open-alerts")}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Bandwidth"
            value={formatBitrate(plexStatus?.bandwidth)}
            icon={Wifi}
            color={theme.palette.info.main}
            subtitle={`${streams.filter((s) => s.transcoding).length} transcoding`}
            loading={loading}
            onClick={() => onNavigate?.("plex-status")}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
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
            onClick={() => onNavigate?.("settings")}
          />
        </Grid>
      </Grid>

      {/* Active Streams & System Metrics */}
      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        {/* Active Streams */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardActionArea onClick={() => onNavigate?.("plex-status")}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: { xs: 1, sm: 2 },
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "1rem", sm: "1.25rem" },
                    }}
                  >
                    Active Streams ({streams.length})
                  </Typography>
                  {streams.length > 0 && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Chip
                        label={`${streams.filter((s: PlexStream) => !s.transcoding).length} Direct`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{
                          height: { xs: 20, sm: 24 },
                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                        }}
                      />
                      <Chip
                        label={`${streams.filter((s: PlexStream) => s.transcoding).length} Transcode`}
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{
                          height: { xs: 20, sm: 24 },
                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </CardActionArea>
            <Box
              sx={{
                px: { xs: 1.5, sm: 2 },
                pb: { xs: 1.5, sm: 2 },
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {loading ? (
                <Skeleton
                  variant="rectangular"
                  height={100}
                  sx={{ borderRadius: 2 }}
                />
              ) : streams.length > 0 ? (
                streams.map((stream: PlexStream) => (
                  <ActiveStreamCard
                    key={stream.id}
                    stream={stream}
                    onClick={() => onNavigate?.("plex-status")}
                  />
                ))
              ) : (
                <Box sx={{ textAlign: "center", py: { xs: 2, sm: 4 } }}>
                  <PlayArrow
                    sx={{
                      fontSize: { xs: 32, sm: 48 },
                      color: "text.secondary",
                      opacity: 0.5,
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                  >
                    No active streams
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* System Metrics */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              height: "100%",
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
            }}
            onClick={() => onNavigate?.("host-monitor")}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2 },
                "&:last-child": { pb: { xs: 1.5, sm: 2 } },
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                System Resources
              </Typography>

              {metrics ? (
                <Box>
                  <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Speed
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            color: "primary.main",
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          CPU
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                      >
                        {metrics.cpu.percent.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.cpu.percent}
                      sx={{ height: { xs: 6, sm: 8 }, borderRadius: 4 }}
                      color={
                        metrics.cpu.percent > 80
                          ? "error"
                          : metrics.cpu.percent > 50
                            ? "warning"
                            : "primary"
                      }
                    />
                  </Box>

                  <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Storage
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            color: "secondary.main",
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          Memory
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                      >
                        {formatBytes(metrics.memory.used)} /{" "}
                        {formatBytes(metrics.memory.total)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.memory.percent}
                      sx={{ height: { xs: 6, sm: 8 }, borderRadius: 4 }}
                      color={
                        metrics.memory.percent > 80
                          ? "error"
                          : metrics.memory.percent > 50
                            ? "warning"
                            : "secondary"
                      }
                    />
                  </Box>

                  <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Storage
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            color: "info.main",
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          Disk
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                      >
                        {formatBytes(metrics.disk.free)} free
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.disk.percent}
                      sx={{ height: { xs: 6, sm: 8 }, borderRadius: 4 }}
                      color={
                        metrics.disk.percent > 80
                          ? "error"
                          : metrics.disk.percent > 50
                            ? "warning"
                            : "info"
                      }
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textAlign: "center",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    Uptime: {metrics.uptimeFormatted}
                  </Typography>
                </Box>
              ) : (
                <Skeleton variant="rectangular" height={200} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <Card sx={{ mb: { xs: 2, sm: 4 } }}>
          <CardContent
            sx={{
              p: { xs: 1.5, sm: 2 },
              "&:last-child": { pb: { xs: 1.5, sm: 2 } },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: { xs: 1, sm: 2 },
              }}
            >
              <NewReleases
                sx={{ color: "primary.main", fontSize: { xs: 20, sm: 24 } }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                Recently Added
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1, sm: 2 },
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 3,
                },
              }}
            >
              {recentlyAdded.map((item: PlexMediaItem, i: number) => (
                <MediaItemCard key={i} item={item} type="recently-added" />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* On Deck */}
      {onDeck.length > 0 && (
        <Card sx={{ mb: { xs: 2, sm: 4 } }}>
          <CardContent
            sx={{
              p: { xs: 1.5, sm: 2 },
              "&:last-child": { pb: { xs: 1.5, sm: 2 } },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: { xs: 1, sm: 2 },
              }}
            >
              <History
                sx={{ color: "warning.main", fontSize: { xs: 20, sm: 24 } }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                Continue Watching
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1, sm: 2 },
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: alpha(theme.palette.warning.main, 0.3),
                  borderRadius: 3,
                },
              }}
            >
              {onDeck.map((item: PlexMediaItem, i: number) => (
                <MediaItemCard key={i} item={item} type="on-deck" />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Alert Timeline */}
      <Card>
        <CardActionArea onClick={() => onNavigate?.("open-alerts")}>
          <CardContent
            sx={{
              p: { xs: 1.5, sm: 2 },
              "&:last-child": { pb: { xs: 1.5, sm: 2 } },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              Alert Timeline (Last Hour)
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: { xs: 1, sm: 2 },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {stats.errorCount || 0} errors, {stats.warningCount || 0} warnings
            </Typography>
            <ErrorTimelineChart data={timelineData} />
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );
};

export default Dashboard;
