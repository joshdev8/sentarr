import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  alpha,
  useTheme,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle,
  Close,
  MoreVert,
  Refresh,
} from "@mui/icons-material";

import { Alert, AlertSeverity } from "../types";
import { apiService } from "../services/api";

interface AlertCardProps {
  alert: Alert;
  onResolve: (alert: Alert) => void;
  onDetails: (alert: Alert) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onResolve,
  onDetails,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const severityColors: Record<AlertSeverity, string> = {
    critical: theme.palette.error.main,
    error: theme.palette.error.light,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  const severityIcons: Record<AlertSeverity, JSX.Element> = {
    critical: <ErrorIcon />,
    error: <ErrorIcon />,
    warning: <WarningIcon />,
    info: <CheckCircle />,
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleResolve = () => {
    handleMenuClose();
    onResolve(alert);
  };

  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(severityColors[alert.severity], 0.2)}`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "4px",
          background: severityColors[alert.severity],
        },
      }}
    >
      <CardContent
        sx={{
          pl: { xs: 2, sm: 3 },
          pr: { xs: 1, sm: 2 },
          py: { xs: 1.5, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: { xs: 1, sm: 2 },
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
              flex: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(severityColors[alert.severity], 0.1),
                color: severityColors[alert.severity],
                flexShrink: 0,
              }}
            >
              {severityIcons[alert.severity]}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Chip
                label={alert.severity.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: severityColors[alert.severity],
                  color: "white",
                  fontWeight: 600,
                  mb: 0.5,
                  height: { xs: 20, sm: 24 },
                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                }}
              />
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
              >
                {new Date(alert.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ flexShrink: 0 }}
          >
            <MoreVert fontSize="small" />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                onDetails(alert);
              }}
            >
              View Details
            </MenuItem>
            <MenuItem onClick={handleResolve}>Mark as Resolved</MenuItem>
          </Menu>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {alert.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {alert.message}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {alert.pattern && (
            <Chip
              label={alert.pattern.replace("_", " ")}
              size="small"
              variant="outlined"
            />
          )}
          {alert.details && alert.details.Count && (
            <Chip
              label={`${alert.details.Count} occurrences`}
              size="small"
              variant="outlined"
              color="error"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

interface AlertDetailsDialogProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
  onResolve: (alert: Alert, note?: string) => void;
}

const AlertDetailsDialog: React.FC<AlertDetailsDialogProps> = ({
  alert,
  open,
  onClose,
  onResolve,
}) => {
  const theme = useTheme();
  const [note, setNote] = useState("");

  const handleResolve = () => {
    if (alert) {
      onResolve(alert, note);
      onClose();
      setNote("");
    }
  };

  if (!alert) return null;

  const severityColor =
    alert.severity === "critical"
      ? theme.palette.error.main
      : alert.severity === "error"
        ? theme.palette.error.light
        : alert.severity === "warning"
          ? theme.palette.warning.main
          : theme.palette.info.main;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Alert Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Severity
          </Typography>
          <Box>
            <Chip
              label={alert.severity.toUpperCase()}
              sx={{
                backgroundColor: severityColor,
                color: "white",
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Timestamp
          </Typography>
          <Typography variant="body1">
            {new Date(alert.timestamp).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Title
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {alert.title}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Message
          </Typography>
          <Typography variant="body1">{alert.message}</Typography>
        </Box>

        {alert.pattern && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Error Pattern
            </Typography>
            <Typography variant="body1">
              {alert.pattern.replace("_", " ")}
            </Typography>
          </Box>
        )}

        {alert.details && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Additional Details
            </Typography>
            <Box
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(alert.details, null, 2)}
              </pre>
            </Box>
          </Box>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Resolution Note (Optional)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a note about how this was resolved..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleResolve} variant="contained" color="success">
          Mark as Resolved
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface OpenAlertsProps {
  alerts: Alert[];
  onRefresh: () => void;
}

const OpenAlerts: React.FC<OpenAlertsProps> = ({ alerts, onRefresh }) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">(
    "all",
  );

  const handleResolve = async (alert: Alert, note?: string) => {
    try {
      await apiService.resolveAlert(alert.id, note);
      onRefresh();
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  const handleDetails = (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailsOpen(true);
  };

  const handleFilterChange = (
    event: SelectChangeEvent<AlertSeverity | "all">,
  ) => {
    setFilterSeverity(event.target.value as AlertSeverity | "all");
  };

  const filteredAlerts =
    filterSeverity === "all"
      ? alerts
      : alerts.filter((alert) => alert.severity === filterSeverity);

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
            Open Alerts
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            {filteredAlerts.length} alert
            {filteredAlerts.length !== 1 ? "s" : ""} requiring attention
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 150 } }}>
            <InputLabel>Filter by Severity</InputLabel>
            <Select
              value={filterSeverity}
              label="Filter by Severity"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Severities</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts Grid */}
      {filteredAlerts.length > 0 ? (
        <Grid container spacing={3}>
          {filteredAlerts.map((alert) => (
            <Grid item xs={12} key={alert.id}>
              <AlertCard
                alert={alert}
                onResolve={handleResolve}
                onDetails={handleDetails}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CheckCircle
                sx={{ fontSize: 64, color: "success.main", mb: 2 }}
              />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                No Open Alerts
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {filterSeverity === "all"
                  ? "Your server is running smoothly. All alerts have been resolved."
                  : `No ${filterSeverity} alerts at this time.`}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Alert Details Dialog */}
      <AlertDetailsDialog
        alert={selectedAlert}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onResolve={handleResolve}
      />
    </Box>
  );
};

export default OpenAlerts;
