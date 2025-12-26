import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  TrendingUp,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle,
  Speed,
} from '@mui/icons-material';
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
} from 'recharts';

import { Stats, Alert, TimelineDataPoint, AlertTypeData, AlertSeverity } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle, trend }) => {
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.3)} 100%)`,
        },
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${alpha(color, 0.3)}`,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            <Typography variant="h3" sx={{ fontWeight: 700, color }}>
              {value}
            </Typography>
          </Box>
        </Box>
        
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TrendingUp 
              sx={{ 
                fontSize: 16, 
                mr: 0.5, 
                color: trend > 0 ? 'error.main' : 'success.main',
                transform: trend < 0 ? 'rotate(180deg)' : 'none',
              }} 
            />
            <Typography variant="caption" color={trend > 0 ? 'error.main' : 'success.main'}>
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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || theme.palette.primary.main} />
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
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorWarnings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
        <XAxis 
          dataKey="time" 
          stroke={theme.palette.text.secondary}
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke={theme.palette.text.secondary}
          style={{ fontSize: '12px' }}
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
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateX(4px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <Chip
          label={alert.severity.toUpperCase()}
          size="small"
          sx={{
            backgroundColor: severityColors[alert.severity],
            color: 'white',
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
          label={alert.pattern.replace('_', ' ')}
          size="small"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      )}
    </Paper>
  );
};

interface DashboardProps {
  stats: Stats;
  alerts: Alert[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, alerts }) => {
  const theme = useTheme();
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [alertTypeData, setAlertTypeData] = useState<AlertTypeData[]>([]);
  const [systemHealth, setSystemHealth] = useState(85);

  useEffect(() => {
    // Generate mock timeline data (in production, this comes from backend)
    const generateTimelineData = (): TimelineDataPoint[] => {
      const now = new Date();
      const data: TimelineDataPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 5 * 60000);
        data.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          errors: Math.floor(Math.random() * 10),
          warnings: Math.floor(Math.random() * 15),
        });
      }
      return data;
    };

    // Generate alert type distribution
    const generateAlertTypeData = (): AlertTypeData[] => {
      const types = ['stream_error', 'database_error', 'network_error', 'auth_error', 'scanner_error', 'disk_error'];
      return types.map(type => ({
        name: type,
        value: Math.floor(Math.random() * 30) + 5,
      }));
    };

    setTimelineData(generateTimelineData());
    setAlertTypeData(generateAlertTypeData());

    const interval = setInterval(() => {
      setTimelineData(generateTimelineData());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate system health based on recent errors
  useEffect(() => {
    const errorCount = stats.errorCount || 0;
    const health = Math.max(0, 100 - (errorCount * 2));
    setSystemHealth(health);
  }, [stats]);

  const recentAlerts = alerts.slice(0, 5);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time monitoring of your Plex Media Server
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Alerts"
            value={stats.totalAlerts || 0}
            icon={Speed}
            color={theme.palette.primary.main}
            subtitle="All time"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Alerts"
            value={stats.openAlerts || 0}
            icon={WarningIcon}
            color={theme.palette.error.main}
            subtitle="Requires attention"
            trend={5}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Errors (24h)"
            value={stats.errorCount || 0}
            icon={ErrorIcon}
            color={theme.palette.warning.main}
            subtitle="Last 24 hours"
            trend={-12}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Health"
            value={`${systemHealth}%`}
            icon={CheckCircle}
            color={systemHealth > 80 ? theme.palette.success.main : theme.palette.warning.main}
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
                Error Timeline (Last Hour)
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

      {/* System Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                System Status
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Monitoring Active</Typography>
                  <Chip label="ONLINE" size="small" color="success" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={100} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.success.main,
                    },
                  }} 
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Alert Channels</Typography>
                  <Chip label="3 ACTIVE" size="small" color="info" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.info.main,
                    },
                  }} 
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Server Health</Typography>
                  <Chip 
                    label={systemHealth > 80 ? 'HEALTHY' : 'WARNING'} 
                    size="small" 
                    color={systemHealth > 80 ? 'success' : 'warning'} 
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: alpha(
                      systemHealth > 80 ? theme.palette.success.main : theme.palette.warning.main, 
                      0.1
                    ),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: systemHealth > 80 ? theme.palette.success.main : theme.palette.warning.main,
                    },
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Alerts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Latest 5 alerts
              </Typography>
              
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((alert) => (
                    <RecentAlert key={alert.id} alert={alert} />
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No recent alerts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your server is running smoothly
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
