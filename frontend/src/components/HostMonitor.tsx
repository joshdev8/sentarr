import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  IconButton,
  alpha,
  useTheme,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Refresh,
  Memory,
  Storage,
  Speed,
  Timer,
  Thermostat,
  Computer,
  DataUsage,
  NetworkCheck,
  DeveloperBoard,
  Circle,
  Usb,
  Cloud,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

import { HostMetrics, SystemConfig } from "../types";
import { apiService } from "../services/api";

const HostMonitor: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<HostMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [temperatureUnit, setTemperatureUnit] = useState<"C" | "F">("C");
  const [selectedInterface, setSelectedInterface] = useState<string>("");
  const [selectedProcess, setSelectedProcess] = useState<string>("");

  const fetchMetrics = async () => {
    try {
      const data = await apiService.getHostMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch host metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const config: SystemConfig = await apiService.getConfig();
      if (config.temperatureUnit) {
        setTemperatureUnit(config.temperatureUnit);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Temperature conversion helper
  const convertTemp = (celsius: number): number => {
    if (temperatureUnit === "F") {
      return (celsius * 9) / 5 + 32;
    }
    return celsius;
  };

  const formatTemp = (celsius: number): string => {
    const temp = convertTemp(celsius);
    return `${temp.toFixed(0)}°${temperatureUnit}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getColorByPercent = (percent: number): string => {
    if (percent > 90) return theme.palette.error.main;
    if (percent > 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Host Monitoring
        </Typography>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton
                variant="rectangular"
                height={300}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">
          Failed to load host metrics
        </Typography>
      </Box>
    );
  }

  // Prepare chart data
  const cpuHistoryData = metrics.history.cpu.map((point) => ({
    time: new Date(point.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    cpu: point.value || 0,
  }));

  const memoryHistoryData = metrics.history.memory.map((point) => ({
    time: new Date(point.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    memory: point.value || 0,
  }));

  const networkHistoryData = metrics.history.network.map((point) => ({
    time: new Date(point.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    sent: (point.sent || 0) / 1024, // KB/s
    recv: (point.recv || 0) / 1024,
  }));

  const diskIOHistoryData = metrics.history.diskIO.map((point) => ({
    time: new Date(point.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    read: (point.read || 0) / (1024 * 1024), // MB/s
    write: (point.write || 0) / (1024 * 1024),
  }));

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          mb: { xs: 2, sm: 4 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            Host Monitoring
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            Comprehensive system resource monitoring
          </Typography>
        </Box>

        <Tooltip title="Refresh">
          <IconButton onClick={fetchMetrics} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 },
              }}
            >
              <Speed
                sx={{
                  fontSize: { xs: 24, sm: 32 },
                  color: "primary.main",
                  mb: 0.5,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: getColorByPercent(metrics.cpu.percent),
                  fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2rem" },
                }}
              >
                {metrics.cpu.percent.toFixed(1)}%
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
              >
                CPU Usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 },
              }}
            >
              <Memory
                sx={{
                  fontSize: { xs: 24, sm: 32 },
                  color: "secondary.main",
                  mb: 0.5,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: getColorByPercent(metrics.memory.percent),
                  fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2rem" },
                }}
              >
                {metrics.memory.percent.toFixed(1)}%
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
              >
                Memory Usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 },
              }}
            >
              <Timer
                sx={{
                  fontSize: { xs: 24, sm: 32 },
                  color: "info.main",
                  mb: 0.5,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2rem" },
                }}
              >
                {metrics.uptime.systemFormatted}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
              >
                System Uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 },
              }}
            >
              <DeveloperBoard
                sx={{
                  fontSize: { xs: 24, sm: 32 },
                  color: "success.main",
                  mb: 0.5,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2rem" },
                }}
              >
                {metrics.cpu.logicalCores}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
              >
                CPU Cores
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CPU Section */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          mb: { xs: 1, sm: 2 },
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
        }}
      >
        <Speed sx={{ color: "primary.main", fontSize: { xs: 20, sm: 24 } }} />{" "}
        CPU
      </Typography>

      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        {/* CPU Usage Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                CPU Usage Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={cpuHistoryData}>
                  <defs>
                    <linearGradient
                      id="cpuGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={theme.palette.primary.main}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={theme.palette.primary.main}
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
                    domain={[0, 100]}
                    stroke={theme.palette.text.secondary}
                    style={{ fontSize: "10px" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                    formatter={(value: number) => [
                      `${value.toFixed(1)}%`,
                      "CPU",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke={theme.palette.primary.main}
                    fill="url(#cpuGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Per-Core Usage */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Per-Core Usage
              </Typography>
              <Box sx={{ maxHeight: 250, overflowY: "auto" }}>
                {metrics.cpu.perCore.map((usage, i) => (
                  <Box key={i} sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2">Core {i}</Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: getColorByPercent(usage),
                        }}
                      >
                        {usage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={usage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getColorByPercent(usage),
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary">
                  Load Average: {metrics.cpu.loadAverage["1min"]} /{" "}
                  {metrics.cpu.loadAverage["5min"]} /{" "}
                  {metrics.cpu.loadAverage["15min"]}
                </Typography>
                {metrics.cpu.frequency && (
                  <Typography variant="body2" color="text.secondary">
                    Frequency: {metrics.cpu.frequency.current.toFixed(0)} MHz
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Memory Section */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          mb: { xs: 1, sm: 2 },
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontSize: { xs: "1.1rem", sm: "1.5rem" },
        }}
      >
        <Memory sx={{ color: "secondary.main" }} /> Memory
      </Typography>

      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        {/* Memory Usage Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Memory Usage Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={memoryHistoryData}>
                  <defs>
                    <linearGradient
                      id="memGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={theme.palette.secondary.main}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={theme.palette.secondary.main}
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
                    domain={[0, 100]}
                    stroke={theme.palette.text.secondary}
                    style={{ fontSize: "10px" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                    formatter={(value: number) => [
                      `${value.toFixed(1)}%`,
                      "Memory",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke={theme.palette.secondary.main}
                    fill="url(#memGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Details */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Memory Details
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  RAM
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {formatBytes(metrics.memory.used)} /{" "}
                    {formatBytes(metrics.memory.total)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: getColorByPercent(metrics.memory.percent) }}
                  >
                    {metrics.memory.percent.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics.memory.percent}
                  sx={{ height: 12, borderRadius: 6 }}
                  color={
                    metrics.memory.percent > 80
                      ? "error"
                      : metrics.memory.percent > 50
                        ? "warning"
                        : "secondary"
                  }
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Swap
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {formatBytes(metrics.swap.used)} /{" "}
                    {formatBytes(metrics.swap.total)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: getColorByPercent(metrics.swap.percent) }}
                  >
                    {metrics.swap.percent.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics.swap.percent}
                  sx={{ height: 12, borderRadius: 6 }}
                  color={
                    metrics.swap.percent > 80
                      ? "error"
                      : metrics.swap.percent > 50
                        ? "warning"
                        : "info"
                  }
                />
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-around", mt: 2 }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatBytes(metrics.memory.available)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Available
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatBytes(metrics.memory.cached)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cached
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatBytes(metrics.memory.buffers)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Buffers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Composition Breakdown */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Memory Composition
              </Typography>

              {/* Stacked bar showing memory breakdown */}
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    height: 32,
                    borderRadius: 2,
                    overflow: "hidden",
                    backgroundColor: alpha(theme.palette.divider, 0.2),
                  }}
                >
                  {/* Active/Used (excluding cached and buffers) */}
                  <Tooltip
                    title={`Active: ${formatBytes(metrics.memory.used - metrics.memory.cached - metrics.memory.buffers)}`}
                  >
                    <Box
                      sx={{
                        width: `${((metrics.memory.used - metrics.memory.cached - metrics.memory.buffers) / metrics.memory.total) * 100}%`,
                        backgroundColor: theme.palette.error.main,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Tooltip>
                  {/* Cached */}
                  <Tooltip title={`Cached: ${formatBytes(metrics.memory.cached)}`}>
                    <Box
                      sx={{
                        width: `${(metrics.memory.cached / metrics.memory.total) * 100}%`,
                        backgroundColor: theme.palette.warning.main,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Tooltip>
                  {/* Buffers */}
                  <Tooltip title={`Buffers: ${formatBytes(metrics.memory.buffers)}`}>
                    <Box
                      sx={{
                        width: `${(metrics.memory.buffers / metrics.memory.total) * 100}%`,
                        backgroundColor: theme.palette.info.main,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Tooltip>
                  {/* Free */}
                  <Tooltip title={`Free: ${formatBytes(metrics.memory.free)}`}>
                    <Box
                      sx={{
                        width: `${(metrics.memory.free / metrics.memory.total) * 100}%`,
                        backgroundColor: theme.palette.success.main,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Tooltip>
                </Box>
              </Box>

              {/* Legend */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: { xs: 1, sm: 2 },
                  justifyContent: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 1,
                      backgroundColor: theme.palette.error.main,
                    }}
                  />
                  <Typography variant="caption">
                    Active ({formatBytes(metrics.memory.used - metrics.memory.cached - metrics.memory.buffers)})
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 1,
                      backgroundColor: theme.palette.warning.main,
                    }}
                  />
                  <Typography variant="caption">
                    Cached ({formatBytes(metrics.memory.cached)})
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 1,
                      backgroundColor: theme.palette.info.main,
                    }}
                  />
                  <Typography variant="caption">
                    Buffers ({formatBytes(metrics.memory.buffers)})
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 1,
                      backgroundColor: theme.palette.success.main,
                    }}
                  />
                  <Typography variant="caption">
                    Free ({formatBytes(metrics.memory.free)})
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Storage Section */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          mb: { xs: 1, sm: 2 },
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontSize: { xs: "1.1rem", sm: "1.5rem" },
        }}
      >
        <Storage sx={{ color: "info.main" }} /> Storage
      </Typography>

      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        {metrics.disks.map((disk) => (
          <Grid item xs={12} md={6} lg={4} key={disk.mountpoint}>
            <Card>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Storage sx={{ color: getColorByPercent(disk.percent) }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      noWrap
                      title={disk.mountpoint}
                    >
                      {disk.mountpoint}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      title={disk.device}
                    >
                      {disk.device} • {disk.fstype}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${disk.percent.toFixed(0)}%`}
                    size="small"
                    sx={{
                      backgroundColor: alpha(
                        getColorByPercent(disk.percent),
                        0.1,
                      ),
                      color: getColorByPercent(disk.percent),
                      fontWeight: 600,
                    }}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={disk.percent}
                  sx={{
                    height: 16,
                    borderRadius: 8,
                    mb: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: getColorByPercent(disk.percent),
                      borderRadius: 8,
                    },
                  }}
                />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body1" fontWeight={600}>
                      {formatBytes(disk.used)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Used
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body1" fontWeight={600}>
                      {formatBytes(disk.free)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Free
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body1" fontWeight={600}>
                      {formatBytes(disk.total)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Disk I/O Chart */}
      {diskIOHistoryData.length > 0 && (
        <Grid
          container
          spacing={{ xs: 1.5, sm: 2, md: 3 }}
          sx={{ mb: { xs: 2, sm: 4 } }}
        >
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Disk I/O Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={diskIOHistoryData}>
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
                      formatter={(value: number) => [`${value.toFixed(2)} MB/s`]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="read"
                      name="Read"
                      stroke={theme.palette.info.main}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="write"
                      name="Write"
                      stroke={theme.palette.warning.main}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* External & Network Storage Section */}
      {metrics.externalDisks && metrics.externalDisks.length > 0 && (
        <>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: { xs: 1, sm: 2 },
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: { xs: "1.1rem", sm: "1.5rem" },
            }}
          >
            <Usb sx={{ color: "warning.main" }} /> External & Network Storage
          </Typography>

          <Grid
            container
            spacing={{ xs: 1.5, sm: 2, md: 3 }}
            sx={{ mb: { xs: 2, sm: 4 } }}
          >
            {metrics.externalDisks.map((disk) => (
              <Grid item xs={12} md={6} lg={4} key={disk.mountpoint}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                    >
                      {disk.type === "network" ? (
                        <Cloud sx={{ color: theme.palette.info.main }} />
                      ) : (
                        <Usb sx={{ color: theme.palette.warning.main }} />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          noWrap
                          title={disk.mountpoint}
                        >
                          {disk.mountpoint}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          title={disk.device}
                        >
                          {disk.device} • {disk.fstype}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                        <Chip
                          label={disk.type === "network" ? "Network" : "External"}
                          size="small"
                          sx={{
                            backgroundColor: alpha(
                              disk.type === "network"
                                ? theme.palette.info.main
                                : theme.palette.warning.main,
                              0.1,
                            ),
                            color:
                              disk.type === "network"
                                ? theme.palette.info.main
                                : theme.palette.warning.main,
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            height: 20,
                          }}
                        />
                        <Chip
                          label={`${disk.percent.toFixed(0)}%`}
                          size="small"
                          sx={{
                            backgroundColor: alpha(
                              getColorByPercent(disk.percent),
                              0.1,
                            ),
                            color: getColorByPercent(disk.percent),
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={disk.percent}
                      sx={{
                        height: 16,
                        borderRadius: 8,
                        mb: 2,
                        backgroundColor: alpha(theme.palette.warning.main, 0.1),
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getColorByPercent(disk.percent),
                          borderRadius: 8,
                        },
                      }}
                    />

                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body1" fontWeight={600}>
                          {formatBytes(disk.used)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Used
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body1" fontWeight={600}>
                          {formatBytes(disk.free)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Free
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body1" fontWeight={600}>
                          {formatBytes(disk.total)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Network Section */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 600,
          mb: { xs: 1, sm: 2 },
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontSize: { xs: "1.1rem", sm: "1.5rem" },
        }}
      >
        <NetworkCheck sx={{ color: "success.main" }} /> Network
      </Typography>

      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        {/* Network Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Network I/O
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={networkHistoryData}>
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
                    formatter={(value: number) => [`${value.toFixed(1)} KB/s`]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    name="Upload"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="recv"
                    name="Download"
                    stroke={theme.palette.info.main}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Interfaces */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Network Interfaces
              </Typography>

              <Box sx={{ maxHeight: 250, overflowY: "auto" }}>
                {metrics.network.interfaces.map((iface) => (
                  <Paper
                    key={iface.name}
                    sx={{
                      p: 1.5,
                      mb: 1.5,
                      backgroundColor: alpha(
                        theme.palette.background.paper,
                        0.5,
                      ),
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Circle
                        sx={{
                          fontSize: 10,
                          color: iface.isUp ? "success.main" : "error.main",
                        }}
                      />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {iface.name}
                      </Typography>
                      {iface.speed > 0 && (
                        <Chip
                          label={`${iface.speed} Mbps`}
                          size="small"
                          sx={{ ml: "auto", height: 20, fontSize: "0.65rem" }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {iface.ip}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <Typography variant="caption">
                        ↑ {formatBytes(iface.bytesSent)}
                      </Typography>
                      <Typography variant="caption">
                        ↓ {formatBytes(iface.bytesRecv)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>

              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary">
                  Total: ↑ {formatBytes(metrics.network.total.bytesSent)} / ↓{" "}
                  {formatBytes(metrics.network.total.bytesRecv)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Per-Interface Network Chart */}
        {metrics.history.interfaces && Object.keys(metrics.history.interfaces).length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Per-Interface Traffic
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Interface</InputLabel>
                    <Select
                      value={selectedInterface || Object.keys(metrics.history.interfaces)[0] || ""}
                      label="Interface"
                      onChange={(e) => setSelectedInterface(e.target.value)}
                    >
                      {Object.keys(metrics.history.interfaces).map((iface) => (
                        <MenuItem key={iface} value={iface}>
                          {iface}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={(metrics.history.interfaces[selectedInterface || Object.keys(metrics.history.interfaces)[0]] || []).map((point) => ({
                      time: new Date(point.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      sent: (point.sent || 0) / 1024, // KB/s
                      recv: (point.recv || 0) / 1024,
                    }))}
                  >
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
                      formatter={(value: number) => [`${value.toFixed(1)} KB/s`]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sent"
                      name="Upload"
                      stroke={theme.palette.success.main}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="recv"
                      name="Download"
                      stroke={theme.palette.info.main}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Processes & Temperature */}
      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 3 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        {/* Top Processes */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Computer /> Top Processes
              </Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>PID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        CPU %
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Memory %
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.processes.map((proc) => (
                      <TableRow key={proc.pid} hover>
                        <TableCell sx={{ color: "text.secondary" }}>
                          {proc.pid}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            noWrap
                            sx={{ maxWidth: 200 }}
                          >
                            {proc.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ color: getColorByPercent(proc.cpu) }}
                          >
                            {proc.cpu.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ color: getColorByPercent(proc.memory) }}
                          >
                            {proc.memory.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={proc.status}
                            size="small"
                            color={
                              proc.status === "running" ? "success" : "default"
                            }
                            sx={{ height: 20, fontSize: "0.65rem" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Temperature Sensors */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Thermostat /> Temperature Sensors
              </Typography>

              {metrics.temperatures.length > 0 ? (
                <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
                  {metrics.temperatures.map((temp) => (
                    <Paper
                      key={temp.name}
                      sx={{
                        p: 1.5,
                        mb: 1.5,
                        backgroundColor: alpha(
                          theme.palette.background.paper,
                          0.5,
                        ),
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                          {temp.name}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color:
                              temp.current > (temp.high || 80)
                                ? theme.palette.error.main
                                : temp.current > (temp.high || 80) * 0.8
                                  ? theme.palette.warning.main
                                  : theme.palette.success.main,
                          }}
                        >
                          {formatTemp(temp.current)}
                        </Typography>
                      </Box>
                      {(temp.high || temp.critical) && (
                        <Typography variant="caption" color="text.secondary">
                          {temp.high && `High: ${formatTemp(temp.high)}`}
                          {temp.high && temp.critical && " • "}
                          {temp.critical && `Critical: ${formatTemp(temp.critical)}`}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Thermostat
                    sx={{
                      fontSize: 48,
                      color: "text.secondary",
                      opacity: 0.3,
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    No temperature sensors detected
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Process Trends Chart */}
        {metrics.history.processes && Object.keys(metrics.history.processes).length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Process Resource Trends
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Process</InputLabel>
                    <Select
                      value={selectedProcess || Object.keys(metrics.history.processes)[0] || ""}
                      label="Process"
                      onChange={(e) => setSelectedProcess(e.target.value)}
                    >
                      {Object.keys(metrics.history.processes)
                        .sort((a, b) => {
                          // Sort by most recent CPU usage
                          const aHistory = metrics.history.processes![a];
                          const bHistory = metrics.history.processes![b];
                          const aLast = aHistory[aHistory.length - 1]?.cpu || 0;
                          const bLast = bHistory[bHistory.length - 1]?.cpu || 0;
                          return bLast - aLast;
                        })
                        .slice(0, 20) // Limit to top 20 processes
                        .map((proc) => (
                          <MenuItem key={proc} value={proc}>
                            {proc}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={(metrics.history.processes[selectedProcess || Object.keys(metrics.history.processes)[0]] || []).map((point) => ({
                      time: new Date(point.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      cpu: point.cpu || 0,
                      memory: point.memory || 0,
                    }))}
                  >
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
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}%`,
                        name === "cpu" ? "CPU" : "Memory",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      name="CPU"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      name="Memory"
                      stroke={theme.palette.secondary.main}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* System Info */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <DataUsage /> System Information
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                System Uptime
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {metrics.uptime.systemFormatted}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                App Uptime
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {metrics.uptime.appFormatted}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Boot Time
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {new Date(metrics.uptime.bootTime).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {metrics.updatedAt
                  ? new Date(metrics.updatedAt).toLocaleTimeString()
                  : "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HostMonitor;
