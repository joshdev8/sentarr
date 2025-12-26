import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useMediaQuery,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Brightness4,
  Brightness7,
  Tv,
  Terminal,
} from "@mui/icons-material";

import Dashboard from "./components/Dashboard";
import OpenAlerts from "./components/OpenAlerts";
import ClosedAlerts from "./components/ClosedAlerts";
import Settings from "./components/Settings";
import PlexStatus from "./components/PlexStatus";
import LogViewer from "./components/LogViewer";

import { Alert, Stats, PageType, SystemHealth } from "./types";
import { apiService } from "./services/api";

const drawerWidth = 260;

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAlerts: 0,
    openAlerts: 0,
    errorCount: 0,
    warningCount: 0,
  });
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const isMobile = useMediaQuery("(max-width:900px)");

  // Create theme with custom styling
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#00e5ff" : "#0097a7",
        light: "#6effff",
        dark: "#00b2cc",
      },
      secondary: {
        main: darkMode ? "#ff6b6b" : "#d32f2f",
      },
      background: {
        default: darkMode ? "#0a0e27" : "#f5f5f5",
        paper: darkMode ? "#131b3a" : "#ffffff",
      },
      error: {
        main: "#ff5252",
      },
      warning: {
        main: "#ffa726",
      },
      success: {
        main: "#66bb6a",
      },
      info: {
        main: "#29b6f6",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: '"Rajdhani", "Inter", sans-serif',
        fontWeight: 700,
        letterSpacing: "0.02em",
      },
      h2: {
        fontFamily: '"Rajdhani", "Inter", sans-serif',
        fontWeight: 600,
      },
      h3: {
        fontFamily: '"Rajdhani", "Inter", sans-serif',
        fontWeight: 600,
      },
      h4: {
        fontFamily: '"Rajdhani", "Inter", sans-serif',
        fontWeight: 600,
      },
      h5: {
        fontFamily: '"Rajdhani", "Inter", sans-serif',
        fontWeight: 500,
      },
      h6: {
        fontFamily: '"Rajdhani", "Inter", sans-serif',
        fontWeight: 500,
      },
      button: {
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: darkMode
              ? "linear-gradient(135deg, rgba(19, 27, 58, 0.95) 0%, rgba(13, 18, 38, 0.95) 100%)"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 245, 0.95) 100%)",
          },
        },
      },
    },
  });

  // Fetch alerts from backend
  const fetchAlerts = async () => {
    try {
      const data = await apiService.getAlerts();
      setAlerts(data.alerts || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const data = await apiService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Fetch system health
  const fetchHealth = async () => {
    try {
      const data = await apiService.getSystemHealth();
      setHealth(data);
    } catch (error) {
      console.error("Failed to fetch health:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchStats();
    fetchHealth();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchAlerts();
      fetchStats();
      fetchHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar
        sx={{
          background:
            "linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(0, 178, 204, 0.1) 100%)",
          borderBottom: 1,
          borderColor: "primary.main",
          borderOpacity: 0.3,
        }}
      >
        <ShieldIcon sx={{ mr: 2, fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          component="div"
          sx={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700 }}
        >
          SENTARR
        </Typography>
      </Toolbar>

      <List sx={{ flex: 1, pt: 3 }}>
        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "dashboard"}
            onClick={() => handlePageChange("dashboard")}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "background.default",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  currentPage === "dashboard"
                    ? "background.default"
                    : "primary.main",
              }}
            >
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "plex-status"}
            onClick={() => handlePageChange("plex-status")}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "background.default",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  currentPage === "plex-status"
                    ? "background.default"
                    : "info.main",
              }}
            >
              <Badge
                badgeContent={stats.activeSessions}
                color="success"
                invisible={!stats.activeSessions}
              >
                <Tv />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Plex Status" />
            {health?.plexConnected && (
              <Chip
                label="Live"
                size="small"
                color="success"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            )}
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "logs"}
            onClick={() => handlePageChange("logs")}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "background.default",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  currentPage === "logs"
                    ? "background.default"
                    : "warning.main",
              }}
            >
              <Terminal />
            </ListItemIcon>
            <ListItemText primary="Log Viewer" />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 2, opacity: 0.3 }} />

        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "open-alerts"}
            onClick={() => handlePageChange("open-alerts")}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "background.default",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  currentPage === "open-alerts"
                    ? "background.default"
                    : "error.main",
              }}
            >
              <Badge badgeContent={stats.openAlerts} color="error">
                <WarningIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Open Alerts" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "closed-alerts"}
            onClick={() => handlePageChange("closed-alerts")}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "background.default",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  currentPage === "closed-alerts"
                    ? "background.default"
                    : "success.main",
              }}
            >
              <CheckCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Closed Alerts" />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 2, opacity: 0.3 }} />

        <ListItem disablePadding>
          <ListItemButton
            selected={currentPage === "settings"}
            onClick={() => handlePageChange("settings")}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "background.default",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  currentPage === "settings"
                    ? "background.default"
                    : "text.secondary",
              }}
            >
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        {health?.plexConnected && (
          <Chip
            label={health.plexServerName || "Plex Connected"}
            color="success"
            size="small"
            sx={{ mb: 1, width: "100%" }}
          />
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1 }}
        >
          v1.0.0 | MIT License
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Your Plex Server's Guardian
        </Typography>
      </Box>
    </Box>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard stats={stats} alerts={alerts} />;
      case "plex-status":
        return <PlexStatus />;
      case "logs":
        return <LogViewer />;
      case "open-alerts":
        return (
          <OpenAlerts
            alerts={alerts.filter((a) => a.status === "open")}
            onRefresh={fetchAlerts}
          />
        );
      case "closed-alerts":
        return (
          <ClosedAlerts alerts={alerts.filter((a) => a.status === "closed")} />
        );
      case "settings":
        return <Settings onRefresh={fetchStats} />;
      default:
        return <Dashboard stats={stats} alerts={alerts} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            background: darkMode
              ? "linear-gradient(90deg, rgba(10, 14, 39, 0.95) 0%, rgba(19, 27, 58, 0.95) 100%)"
              : "linear-gradient(90deg, rgba(245, 245, 245, 0.95) 0%, rgba(255, 255, 255, 0.95) 100%)",
            backdropFilter: "blur(10px)",
            borderBottom: 1,
            borderColor: "primary.main",
            borderOpacity: 0.2,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1 }} />

            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                backgroundImage: "none",
              },
            }}
          >
            {drawer}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                backgroundImage: "none",
                borderRight: 1,
                borderColor: "primary.main",
                borderOpacity: 0.2,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: 8,
          }}
        >
          {renderPage()}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
