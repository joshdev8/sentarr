import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  alpha,
  useTheme,
  Tooltip,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Refresh,
  PlayArrow,
  Pause,
  Search,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport,
  DeleteSweep,
} from "@mui/icons-material";

import { LogEntry } from "../types";
import { apiService } from "../services/api";

const LogViewer: React.FC = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [numLines, setNumLines] = useState(200);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getLogs(numLines, filterLevel);
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [numLines]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Live streaming with SSE
  useEffect(() => {
    if (isLive) {
      const streamUrl = apiService.getLogStreamUrl();
      eventSourceRef.current = new EventSource(streamUrl);

      eventSourceRef.current.onmessage = (event) => {
        try {
          const logEntry = JSON.parse(event.data);
          if (!logEntry.error) {
            setLogs((prev) => [...prev.slice(-499), logEntry]);
          }
        } catch (e) {
          console.error("Failed to parse log entry:", e);
        }
      };

      eventSourceRef.current.onerror = () => {
        console.error("SSE connection error");
        setIsLive(false);
      };

      return () => {
        eventSourceRef.current?.close();
      };
    } else {
      eventSourceRef.current?.close();
    }
  }, [isLive]);

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilterLevel(event.target.value);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <ErrorIcon sx={{ fontSize: 16, color: "error.main" }} />;
      case "warning":
        return <WarningIcon sx={{ fontSize: 16, color: "warning.main" }} />;
      case "debug":
        return <BugReport sx={{ fontSize: 16, color: "text.secondary" }} />;
      default:
        return <InfoIcon sx={{ fontSize: 16, color: "info.main" }} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return theme.palette.error.main;
      case "warning":
        return theme.palette.warning.main;
      case "debug":
        return theme.palette.text.secondary;
      default:
        return theme.palette.info.main;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    const matchesSearch =
      !searchTerm ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const clearLogs = () => {
    setLogs([]);
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
            Log Viewer
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            Real-time Plex Media Server logs
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 1, sm: 2 },
            alignItems: "center",
            justifyContent: { xs: "flex-end", sm: "flex-start" },
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={isLive}
                onChange={(e) => setIsLive(e.target.checked)}
                color="success"
                size="small"
              />
            }
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: { xs: "0.8rem", sm: "1rem" },
                }}
              >
                {isLive ? (
                  <PlayArrow sx={{ fontSize: { xs: 16, sm: 18 } }} />
                ) : (
                  <Pause sx={{ fontSize: { xs: 16, sm: 18 } }} />
                )}
                Live
              </Box>
            }
          />

          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchLogs}
              color="primary"
              disabled={isLive}
              size="small"
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent
          sx={{
            p: { xs: 1.5, sm: 2 },
            "&:last-child": { pb: { xs: 1.5, sm: 2 } },
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1, sm: 2 },
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                minWidth: { xs: 150, sm: 250 },
                flex: { xs: 1, sm: "unset" },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Log Level</InputLabel>
              <Select
                value={filterLevel}
                label="Log Level"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="error">Errors</MenuItem>
                <MenuItem value="warning">Warnings</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Lines</InputLabel>
              <Select
                value={numLines.toString()}
                label="Lines"
                onChange={(e) => setNumLines(parseInt(e.target.value))}
              >
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="100">100</MenuItem>
                <MenuItem value="200">200</MenuItem>
                <MenuItem value="500">500</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  size="small"
                />
              }
              label="Auto-scroll"
            />

            <Box sx={{ flex: 1 }} />

            <Tooltip title="Clear logs">
              <IconButton onClick={clearLogs} color="error" size="small">
                <DeleteSweep />
              </IconButton>
            </Tooltip>

            {isLive && (
              <Chip
                label="LIVE"
                color="success"
                size="small"
                sx={{ animation: "pulse 2s infinite" }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Log Stats */}
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <Chip
          icon={<ErrorIcon />}
          label={`${logs.filter((l) => l.level === "error").length} Errors`}
          size="small"
          color="error"
          variant="outlined"
        />
        <Chip
          icon={<WarningIcon />}
          label={`${logs.filter((l) => l.level === "warning").length} Warnings`}
          size="small"
          color="warning"
          variant="outlined"
        />
        <Chip
          label={`${filteredLogs.length} / ${logs.length} shown`}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Log Container */}
      <Card
        sx={{
          backgroundColor: "#0d1117",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Box
          ref={logContainerRef}
          sx={{
            height: "60vh",
            overflowY: "auto",
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            fontSize: "0.8rem",
            lineHeight: 1.6,
            p: 2,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: alpha(theme.palette.primary.main, 0.1),
            },
            "&::-webkit-scrollbar-thumb": {
              background: alpha(theme.palette.primary.main, 0.3),
              borderRadius: "4px",
            },
          }}
        >
          {loading && logs.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              Loading logs...
            </Typography>
          ) : filteredLogs.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No logs to display
            </Typography>
          ) : (
            filteredLogs.map((log, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 1,
                  py: 0.5,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", pt: 0.3 }}
                >
                  {getLevelIcon(log.level)}
                </Box>
                <Box
                  sx={{
                    minWidth: 70,
                    color: getLevelColor(log.level),
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    pt: 0.2,
                  }}
                >
                  {log.level}
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    color:
                      log.level === "error"
                        ? theme.palette.error.light
                        : log.level === "warning"
                          ? theme.palette.warning.light
                          : "#c9d1d9",
                    wordBreak: "break-word",
                  }}
                >
                  {searchTerm ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: log.message.replace(
                          new RegExp(`(${searchTerm})`, "gi"),
                          '<mark style="background-color: #634d00; color: inherit; padding: 0 2px;">$1</mark>',
                        ),
                      }}
                    />
                  ) : (
                    log.message
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Card>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Box>
  );
};

export default LogViewer;
