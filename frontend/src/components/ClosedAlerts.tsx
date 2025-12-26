import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  alpha,
  useTheme,
  Tooltip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { CheckCircle, Search, Delete } from "@mui/icons-material";

import { Alert, AlertSeverity } from "../types";
import { apiService } from "../services/api";

interface ClosedAlertCardProps {
  alert: Alert;
  onDelete: (alertId: string) => void;
}

const ClosedAlertCard: React.FC<ClosedAlertCardProps> = ({
  alert,
  onDelete,
}) => {
  const theme = useTheme();

  const severityColors: Record<AlertSeverity, string> = {
    critical: theme.palette.error.main,
    error: theme.palette.error.light,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        opacity: 0.8,
        transition: "opacity 0.2s, transform 0.2s",
        "&:hover": {
          opacity: 1,
          transform: "translateY(-2px)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "4px",
          background: alpha(severityColors[alert.severity], 0.5),
        },
      }}
    >
      <CardContent sx={{ pl: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
              }}
            >
              <CheckCircle />
            </Box>
            <Box>
              <Chip
                label="RESOLVED"
                size="small"
                sx={{
                  backgroundColor: theme.palette.success.main,
                  color: "white",
                  fontWeight: 600,
                  mb: 0.5,
                }}
              />
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                {new Date(alert.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(alert.id)}
              color="error"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {alert.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {alert.message}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          <Chip
            label={alert.severity.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: alpha(severityColors[alert.severity], 0.2),
              color: severityColors[alert.severity],
              fontWeight: 600,
            }}
          />
          {alert.pattern && (
            <Chip
              label={alert.pattern.replace("_", " ")}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {alert.resolvedAt && (
          <Box
            sx={{
              p: 2,
              backgroundColor: alpha(theme.palette.success.main, 0.05),
              borderRadius: 2,
              borderLeft: 3,
              borderColor: theme.palette.success.main,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 0.5 }}
            >
              Resolved on {new Date(alert.resolvedAt).toLocaleString()}
              {alert.resolvedBy && ` by ${alert.resolvedBy}`}
            </Typography>
            {alert.resolutionNote && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {alert.resolutionNote}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface ClosedAlertsProps {
  alerts: Alert[];
}

const ClosedAlerts: React.FC<ClosedAlertsProps> = ({ alerts }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (alertId: string) => {
    try {
      await apiService.deleteAlert(alertId);
      // In a real app, you'd want to refresh the alerts list here
    } catch (error) {
      console.error("Failed to delete alert:", error);
    }
  };

  const filteredAlerts = searchQuery
    ? alerts.filter(
        (alert) =>
          alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.pattern?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : alerts;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Closed Alerts
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {filteredAlerts.length} resolved alert
          {filteredAlerts.length !== 1 ? "s" : ""}
        </Typography>

        <TextField
          fullWidth
          placeholder="Search closed alerts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {/* Alerts Grid */}
      {filteredAlerts.length > 0 ? (
        <Grid container spacing={3}>
          {filteredAlerts.map((alert) => (
            <Grid item xs={12} key={alert.id}>
              <ClosedAlertCard alert={alert} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CheckCircle
                sx={{
                  fontSize: 64,
                  color: "success.main",
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                No Closed Alerts
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {searchQuery
                  ? "No alerts match your search criteria."
                  : "Resolved alerts will appear here."}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ClosedAlerts;
