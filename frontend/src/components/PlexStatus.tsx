import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  alpha,
  useTheme,
  Tooltip,
  Skeleton,
  Avatar,
  Paper,
} from "@mui/material";
import {
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  Movie,
  Tv,
  MusicNote,
  PlayArrow,
  Pause,
  Devices,
  Speed,
  Storage,
  Wifi,
  Home,
  Public,
  Videocam,
  Cast,
} from "@mui/icons-material";

import {
  PlexStatus as PlexStatusType,
  SystemMetrics,
  PlexStreamsResponse,
} from "../types";
import { apiService } from "../services/api";

interface PlexStatusProps {
  onRefresh?: () => void;
}

const PlexStatusComponent: React.FC<PlexStatusProps> = () => {
  const theme = useTheme();
  const [plexStatus, setPlexStatus] = useState<PlexStatusType | null>(null);
  const [streamsData, setStreamsData] = useState<PlexStreamsResponse | null>(
    null,
  );
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusData, streams, metricsData] = await Promise.all([
        apiService.getPlexStatus(),
        apiService.getPlexStreams(),
        apiService.getSystemMetrics(),
      ]);
      setPlexStatus(statusData);
      setStreamsData(streams);
      setMetrics(metricsData);
    } catch (err) {
      console.error("Failed to fetch Plex status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const streams = streamsData?.streams || [];

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Plex Status
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time Plex server information and active streams
          </Typography>
        </Box>

        <Tooltip title="Refresh">
          <IconButton onClick={fetchData} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            {loading ? (
              <Skeleton variant="circular" width={48} height={48} />
            ) : plexStatus?.connected ? (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                }}
              >
                <CheckCircle sx={{ color: "success.main", fontSize: 28 }} />
              </Box>
            ) : (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                }}
              >
                <ErrorIcon sx={{ color: "error.main", fontSize: 28 }} />
              </Box>
            )}

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {loading ? (
                  <Skeleton width={200} />
                ) : (
                  plexStatus?.serverName || "Plex Server"
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {loading ? (
                  <Skeleton width={150} />
                ) : plexStatus?.connected ? (
                  <>
                    Version {plexStatus.version} • {plexStatus.platform}
                  </>
                ) : (
                  plexStatus?.error || "Not connected"
                )}
              </Typography>
            </Box>

            <Box sx={{ ml: "auto" }}>
              <Chip
                label={plexStatus?.connected ? "CONNECTED" : "DISCONNECTED"}
                color={plexStatus?.connected ? "success" : "error"}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Box>

          {/* Library Stats */}
          {plexStatus?.connected && (
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <Movie sx={{ fontSize: 32, color: "primary.main", mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {plexStatus.totalMovies || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Movies
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                  }}
                >
                  <Tv sx={{ fontSize: 32, color: "secondary.main", mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {plexStatus.totalShows || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    TV Shows
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                  }}
                >
                  <MusicNote sx={{ fontSize: 32, color: "info.main", mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {plexStatus.totalMusic || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Artists
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.warning.main, 0.05),
                  }}
                >
                  <PlayArrow
                    sx={{ fontSize: 32, color: "warning.main", mb: 1 }}
                  />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {plexStatus.activeSessions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Streams
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Bandwidth Summary */}
      {streamsData && streams.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Wifi sx={{ fontSize: 24, color: "info.main", mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatBitrate(streamsData.totalBandwidth)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Bandwidth
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Cast sx={{ fontSize: 24, color: "success.main", mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {streamsData.directPlayCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Direct Play
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Videocam
                    sx={{ fontSize: 24, color: "warning.main", mb: 1 }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {streamsData.transcodingCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Transcoding
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Active Streams */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Active Streams ({streams.length})
      </Typography>

      {streams.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Pause
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  opacity: 0.5,
                  mb: 2,
                }}
              />
              <Typography variant="h6" color="text.secondary">
                No Active Streams
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nobody is currently watching
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {streams.map((stream) => (
            <Grid item xs={12} key={stream.id}>
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
                    background: stream.transcoding
                      ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`
                      : `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", gap: 3 }}>
                    {/* Poster */}
                    {stream.thumb ? (
                      <Box
                        component="img"
                        src={stream.thumb}
                        alt={stream.title}
                        sx={{
                          width: 120,
                          height: 180,
                          borderRadius: 2,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement>,
                        ) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 120,
                          height: 180,
                          borderRadius: 2,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.1,
                          ),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {stream.type === "episode" ? (
                          <Tv sx={{ fontSize: 48 }} />
                        ) : (
                          <Movie sx={{ fontSize: 48 }} />
                        )}
                      </Box>
                    )}

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* User Info */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 32,
                            height: 32,
                          }}
                        >
                          {stream.user.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {stream.user}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {stream.player.local ? (
                              <Home
                                sx={{ fontSize: 14, color: "success.main" }}
                              />
                            ) : (
                              <Public
                                sx={{ fontSize: 14, color: "info.main" }}
                              />
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {stream.player.device} • {stream.player.platform}{" "}
                              • {stream.player.product}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={stream.player.state.toUpperCase()}
                          size="small"
                          color={
                            stream.player.state === "playing"
                              ? "success"
                              : "default"
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      {/* Title */}
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                        noWrap
                      >
                        {stream.grandparentTitle || stream.title}
                      </Typography>
                      {stream.grandparentTitle && (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          {stream.parentTitle} - {stream.title}
                          {stream.episodeInfo &&
                            ` (S${stream.episodeInfo.seasonNumber}E${stream.episodeInfo.episodeNumber})`}
                        </Typography>
                      )}

                      {/* Metadata */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={stream.type.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                        {stream.year && (
                          <Chip
                            label={stream.year}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {stream.contentRating && (
                          <Chip
                            label={stream.contentRating}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {stream.rating && (
                          <Chip
                            label={`★ ${stream.rating.toFixed(1)}`}
                            size="small"
                            variant="outlined"
                            color="warning"
                          />
                        )}
                      </Box>

                      {/* Summary */}
                      {stream.summary && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {stream.summary}
                        </Typography>
                      )}

                      {/* Progress */}
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(stream.viewOffset)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stream.progress.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(stream.duration)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={stream.progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.1,
                            ),
                          }}
                        />
                      </Box>

                      {/* Quality & Transcoding */}
                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        {stream.mediaInfo && (
                          <Paper sx={{ p: 1.5, flex: 1, minWidth: 150 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Quality
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mt: 0.5,
                              }}
                            >
                              {stream.mediaInfo.videoResolution && (
                                <Chip
                                  label={stream.mediaInfo.videoResolution.toUpperCase()}
                                  size="small"
                                  color="primary"
                                />
                              )}
                              {stream.mediaInfo.videoCodec && (
                                <Chip
                                  label={stream.mediaInfo.videoCodec.toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {stream.mediaInfo.audioCodec && (
                                <Chip
                                  label={stream.mediaInfo.audioCodec.toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {stream.mediaInfo.audioChannels && (
                                <Chip
                                  label={`${stream.mediaInfo.audioChannels}ch`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Paper>
                        )}

                        {stream.transcoding && stream.transcodeInfo ? (
                          <Paper
                            sx={{
                              p: 1.5,
                              flex: 1,
                              minWidth: 150,
                              backgroundColor: alpha(
                                theme.palette.warning.main,
                                0.1,
                              ),
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: "warning.main", fontWeight: 600 }}
                              display="block"
                            >
                              TRANSCODING
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2">
                                Video: {stream.transcodeInfo.videoDecision} •
                                Audio: {stream.transcodeInfo.audioDecision}
                              </Typography>
                              {stream.transcodeInfo.speed && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Speed: {stream.transcodeInfo.speed.toFixed(1)}
                                  x
                                  {stream.transcodeInfo.transcodeHwRequested &&
                                    " • HW Accelerated"}
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        ) : (
                          <Paper
                            sx={{
                              p: 1.5,
                              flex: 1,
                              minWidth: 150,
                              backgroundColor: alpha(
                                theme.palette.success.main,
                                0.1,
                              ),
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: "success.main", fontWeight: 600 }}
                              display="block"
                            >
                              DIRECT PLAY
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              No transcoding needed
                            </Typography>
                          </Paper>
                        )}

                        {stream.bandwidth && (
                          <Paper sx={{ p: 1.5, minWidth: 100 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Bandwidth
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, mt: 0.5 }}
                            >
                              {formatBitrate(stream.bandwidth)}
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* System Metrics */}
      {metrics && (
        <>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            System Metrics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Speed sx={{ color: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      CPU Usage
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {metrics.cpu.percent.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.cpu.percent}
                    sx={{ height: 8, borderRadius: 4 }}
                    color={
                      metrics.cpu.percent > 80
                        ? "error"
                        : metrics.cpu.percent > 50
                          ? "warning"
                          : "primary"
                    }
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {metrics.cpu.cores} cores
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Devices sx={{ color: "secondary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Memory
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {metrics.memory.percent.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.memory.percent}
                    sx={{ height: 8, borderRadius: 4 }}
                    color={
                      metrics.memory.percent > 80
                        ? "error"
                        : metrics.memory.percent > 50
                          ? "warning"
                          : "secondary"
                    }
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {formatBytes(metrics.memory.used)} /{" "}
                    {formatBytes(metrics.memory.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Storage sx={{ color: "info.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Disk
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {metrics.disk.percent.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.disk.percent}
                    sx={{ height: 8, borderRadius: 4 }}
                    color={
                      metrics.disk.percent > 80
                        ? "error"
                        : metrics.disk.percent > 50
                          ? "warning"
                          : "info"
                    }
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {formatBytes(metrics.disk.free)} free of{" "}
                    {formatBytes(metrics.disk.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Uptime: {metrics.uptimeFormatted}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PlexStatusComponent;
