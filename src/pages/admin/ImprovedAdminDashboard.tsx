import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  RefreshCw,
  Plus,
  Settings,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  Wifi,
  FileText,
  Download,
  Code,
  LifeBuoy,
  Zap,
  Globe,
  Lock,
  Users as UserManagement,
  Building2,
  CreditCard,
  Mail,
  MessageSquare,
  Cloud,
  Bell,
  ChevronRight,
  Home,
  Menu,
  X
} from 'lucide-react';

interface SystemHealth {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeSessions: number;
  databaseHealth: 'excellent' | 'good' | 'warning' | 'critical';
  serverLoad: number;
  memoryUsage: number;
  diskUsage: number;
  networkTraffic: number;
}

interface SecurityStatus {
  firewallStatus: 'active' | 'inactive';
  sslCertificate: 'valid' | 'expired' | 'missing';
  encryptionStatus: 'enabled' | 'disabled';
  twoFactorAuth: 'enabled' | 'disabled';
  failedLogins: number;
  suspiciousActivity: number;
  securityEvents: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  variant: 'primary' | 'secondary' | 'outline';
  badge?: string;
}

interface RecentActivity {
  id: string;
  type: 'clinic_created' | 'user_registered' | 'appointment_booked' | 'payment_received' | 'system_alert' | 'backup_completed';
  title: string;
  description: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
  clinicId?: string;
  userId?: string;
}

const ImprovedAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock data - in real app, fetch from API
  const [systemHealth] = useState<SystemHealth>({
    uptime: 99.9,
    responseTime: 245,
    errorRate: 0.02,
    activeSessions: 1247,
    databaseHealth: 'excellent',
    serverLoad: 45,
    memoryUsage: 67,
    diskUsage: 23,
    networkTraffic: 89
  });

  const [securityStatus] = useState<SecurityStatus>({
    firewallStatus: 'active',
    sslCertificate: 'valid',
    encryptionStatus: 'enabled',
    twoFactorAuth: 'enabled',
    failedLogins: 12,
    suspiciousActivity: 3,
    securityEvents: 8
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'clinic_created',
      title: 'New clinic registered',
      description: 'Dental Care Plus has been registered',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      severity: 'info'
    },
    {
      id: '2',
      type: 'payment_received',
      title: 'Payment received',
      description: '$2,450 received from Smile Dental Clinic',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      severity: 'success'
    },
    {
      id: '3',
      type: 'system_alert',
      title: 'High server load detected',
      description: 'Server load reached 85%',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      severity: 'warning'
    },
    {
      id: '4',
      type: 'backup_completed',
      title: 'Backup completed successfully',
      description: 'Daily backup completed at 2:00 AM',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      severity: 'success'
    }
  ]);

  const isAdmin = useMemo(() => 
    user?.role === 'admin' || user?.role === 'super_admin', 
    [user?.role]
  );

  useEffect(() => {
    if (isAdmin) {
      // Simulate loading
      setTimeout(() => setLoading(false), 1000);
    }
  }, [isAdmin]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'add-clinic',
      title: t('admin_dashboard.add_clinic'),
      description: 'Register a new clinic',
      icon: Plus,
      action: () => window.location.href = '/clinics/create',
      variant: 'primary'
    },
    {
      id: 'manage-users',
      title: t('admin_dashboard.manage_users'),
      description: 'Manage system users',
      icon: UserManagement,
      action: () => window.location.href = '/admin/users',
      variant: 'secondary'
    },
    {
      id: 'system-settings',
      title: t('admin_dashboard.system_settings'),
      description: 'Configure system settings',
      icon: Settings,
      action: () => window.location.href = '/admin/settings',
      variant: 'outline'
    },
    {
      id: 'reports-center',
      title: t('admin_dashboard.reports_center'),
      description: 'Generate and view reports',
      icon: FileText,
      action: () => window.location.href = '/reports',
      variant: 'outline'
    },
    {
      id: 'backup-restore',
      title: t('admin_dashboard.backup_restore'),
      description: 'Manage backups and restores',
      icon: Download,
      action: () => window.location.href = '/admin/backup',
      variant: 'outline'
    },
    {
      id: 'support-center',
      title: t('admin_dashboard.support_center'),
      description: 'Get help and support',
      icon: LifeBuoy,
      action: () => window.location.href = '/support',
      variant: 'outline'
    }
  ], [t]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };



  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('admin_dashboard.access_denied')}</h1>
          <p className="text-gray-600 mb-6">{t('admin_dashboard.access_denied_message')}</p>
          <div className="space-y-3">
            <Link to="/dashboard" className="block">
              <Button variant="primary" className="w-full">{t('admin_dashboard.go_to_dashboard')}</Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="outline" className="w-full">{t('admin_dashboard.go_to_home')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Admin Dashboard...</h2>
          <p className="text-gray-500">Preparing your comprehensive system overview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar - Breadcrumbs & Mobile Menu */}
          <div className="flex items-center justify-between py-3 border-b border-blue-800/30">
            <div className="flex items-center space-x-2 text-sm text-blue-200/70">
              <Link to="/" className="flex items-center space-x-1 hover:text-blue-300 transition-colors">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-300 font-medium">Admin Dashboard</span>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Main Header Content */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 lg:py-8 space-y-4 lg:space-y-0">
            {/* Left Section - Brand & Title */}
            <div className="flex items-center space-x-4 lg:space-x-6">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0 transform hover:scale-105 transition-transform duration-200">
                  <BarChart3 className="w-7 h-7 lg:w-9 lg:h-9 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white truncate">
                    {t('admin_dashboard.title')}
                  </h1>
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">Live</span>
                  </div>
                </div>
                <p className="text-sm lg:text-base text-blue-100/80 hidden sm:block">
                  Comprehensive system management and monitoring dashboard
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-200/70">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>System Online</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section - Actions & Stats */}
            <div className="flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-4 text-white/80">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{systemHealth.uptime}%</div>
                  <div className="text-xs">Uptime</div>
                </div>
                <div className="w-px h-8 bg-blue-700"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{systemHealth.activeSessions.toLocaleString()}</div>
                  <div className="text-xs">Sessions</div>
                </div>
                <div className="w-px h-8 bg-blue-700"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{systemHealth.responseTime}ms</div>
                  <div className="text-xs">Response</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 lg:space-x-3">
                {/* Notifications */}
                <Button 
                  variant="outline"
                  className="relative flex items-center gap-2 text-sm lg:text-base px-3 lg:px-4 py-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notifications</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                </Button>

                <Button 
                  onClick={handleRefresh} 
                  variant="outline"
                  disabled={refreshing}
                  className="flex items-center gap-2 text-sm lg:text-base px-3 lg:px-4 py-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                
                <Link to="/admin/clinics">
                  <Button 
                    variant="primary" 
                    className="flex items-center gap-2 text-sm lg:text-base px-4 lg:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Manage Clinics</span>
                  </Button>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2 text-sm lg:text-base px-3 lg:px-4 py-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <span className="hidden sm:inline">{user?.firstName || 'Admin'}</span>
                    <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></div>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-blue-800/30">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleRefresh} 
                  variant="outline"
                  disabled={refreshing}
                  className="flex items-center justify-center gap-2 text-sm px-3 py-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                
                <Link to="/admin/clinics">
                  <Button 
                    variant="primary" 
                    className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Manage Clinics</span>
                  </Button>
                </Link>

                <Button 
                  variant="outline"
                  className="flex items-center justify-center gap-2 text-sm px-3 py-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                >
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </Button>

                <Button 
                  variant="outline"
                  className="flex items-center justify-center gap-2 text-sm px-3 py-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </div>

              {/* Mobile Stats */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-center text-white/80">
                <div>
                  <div className="text-lg font-bold text-green-400">{systemHealth.uptime}%</div>
                  <div className="text-xs">Uptime</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">{systemHealth.activeSessions.toLocaleString()}</div>
                  <div className="text-xs">Sessions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">{systemHealth.responseTime}ms</div>
                  <div className="text-xs">Response</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* System Health */}
          <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
                <Activity className="text-2xl text-green-600" />
              </div>
              <Badge className={getHealthColor(systemHealth.databaseHealth)}>
                {systemHealth.databaseHealth}
              </Badge>
            </div>
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('admin_dashboard.system_health')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin_dashboard.uptime')}</span>
                <span className="font-semibold">{systemHealth.uptime}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin_dashboard.response_time')}</span>
                <span className="font-semibold">{systemHealth.responseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin_dashboard.active_sessions')}</span>
                <span className="font-semibold">{systemHealth.activeSessions.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Security Status */}
          <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-red-100 to-red-200 rounded-lg">
                <Shield className="text-2xl text-red-600" />
              </div>
              <Badge className="text-green-600 bg-green-100">
                Secure
              </Badge>
            </div>
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">Security Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Firewall</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SSL Certificate</span>
                <span className="font-semibold text-green-600">Valid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">2FA</span>
                <span className="font-semibold text-green-600">Enabled</span>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                <TrendingUp className="text-2xl text-blue-600" />
              </div>
              <Badge className="text-blue-600 bg-blue-100">
                Optimal
              </Badge>
            </div>
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('admin_dashboard.performance_metrics')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin_dashboard.server_load')}</span>
                <span className="font-semibold">{systemHealth.serverLoad}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin_dashboard.memory_usage')}</span>
                <span className="font-semibold">{systemHealth.memoryUsage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin_dashboard.disk_usage')}</span>
                <span className="font-semibold">{systemHealth.diskUsage}%</span>
              </div>
            </div>
          </Card>

          {/* Network Status */}
          <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg">
                <Wifi className="text-2xl text-purple-600" />
              </div>
              <Badge className="text-purple-600 bg-purple-100">
                Stable
              </Badge>
            </div>
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('admin_dashboard.network_traffic')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Traffic</span>
                <span className="font-semibold">{systemHealth.networkTraffic}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Error Rate</span>
                <span className="font-semibold">{systemHealth.errorRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CDN Status</span>
                <span className="font-semibold text-green-600">Online</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  {t('admin_dashboard.quick_actions')}
                </h2>
                <Link to="/admin/actions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                {quickActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant={action.variant}
                      onClick={action.action}
                      className="h-auto p-4 justify-start text-left"
                    >
                      <IconComponent className="w-5 h-5 mr-3" />
                      <div>
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm opacity-75">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  {t('admin_dashboard.recent_activity')}
                </h2>
                <Link to="/admin/activity" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getSeverityIcon(activity.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* System Monitoring Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-6 lg:mt-8">
          {/* System Services Status */}
          <Card className="p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              System Services
            </h2>
            <div className="space-y-4">
              {[
                { name: 'Database', status: 'online', icon: Database, color: 'green' },
                { name: 'Email Service', status: 'online', icon: Mail, color: 'green' },
                { name: 'Payment Gateway', status: 'online', icon: CreditCard, color: 'green' },
                { name: 'File Storage', status: 'online', icon: Cloud, color: 'green' },
                { name: 'SMS Service', status: 'warning', icon: MessageSquare, color: 'yellow' },
                { name: 'CDN', status: 'online', icon: Globe, color: 'green' }
              ].map((service) => {
                const IconComponent = service.icon;
                return (
                  <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-5 h-5 text-${service.color}-600`} />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <Badge className={`text-${service.color}-600 bg-${service.color}-100`}>
                      {service.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Security Overview */}
          <Card className="p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Security Overview
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{securityStatus.failedLogins}</div>
                  <div className="text-sm text-gray-600">Failed Logins</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{securityStatus.suspiciousActivity}</div>
                  <div className="text-sm text-gray-600">Suspicious Activity</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Firewall Status</span>
                  <span className="text-sm font-semibold text-green-600">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SSL Certificate</span>
                  <span className="text-sm font-semibold text-green-600">Valid (30 days)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Encryption</span>
                  <span className="text-sm font-semibold text-green-600">AES-256</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">2FA Enabled</span>
                  <span className="text-sm font-semibold text-green-600">Yes</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-6 lg:mt-8">
          <Link to="/admin/backup" className="block">
            <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-lg inline-block mb-4">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('admin_dashboard.backup_restore')}</h3>
                <p className="text-sm text-gray-600">Manage system backups and restores</p>
              </div>
            </Card>
          </Link>

          <Link to="/admin/audit" className="block">
            <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-lg inline-block mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('admin_dashboard.audit_logs')}</h3>
                <p className="text-sm text-gray-600">View system audit trails and logs</p>
              </div>
            </Card>
          </Link>

          <Link to="/admin/api" className="block">
            <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-lg inline-block mb-4">
                  <Code className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('admin_dashboard.api_documentation')}</h3>
                <p className="text-sm text-gray-600">Access API documentation and tools</p>
              </div>
            </Card>
          </Link>

          <Link to="/admin/support" className="block">
            <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="p-3 bg-orange-100 rounded-lg inline-block mb-4">
                  <LifeBuoy className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('admin_dashboard.support_center')}</h3>
                <p className="text-sm text-gray-600">Get help and support resources</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ImprovedAdminDashboard;
