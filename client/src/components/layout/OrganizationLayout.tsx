import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/authService';
import { useTheme } from '../context/ThemeProvider';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { 
  Layers, 
  Settings, 
  Calendar, 
  Download, 
  Users, 
  RefreshCw, 
  FileText, 
  BarChart3, 
  Clock,
  Menu,
  X,
  ChevronLeft,
  UserCog,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  Crown
} from 'lucide-react';
import SubscriptionStatus from '../subscription/SubscriptionStatus';
import { useSubscription } from '../../hooks/useSubscription';

interface OrganizationLayoutProps {
  children?: React.ReactNode;
}

const OrganizationLayout: React.FC<OrganizationLayoutProps> = ({ children }) => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme, isDarkMode } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('Your Organization');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { plan, daysRemaining, subscription } = useSubscription();

  // Extract organization name and user data on mount
  useEffect(() => {
    const initLayout = async () => {
      try {
        // Get current user
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
        
        // Get organization name
        const userString = localStorage.getItem('user');
        if (userString) {
          const userData = JSON.parse(userString);
          if (userData.organizationName) {
            setOrganizationName(userData.organizationName);
          }
        }
        
        // Try organization localStorage entry as fallback
        if (organizationName === 'Your Organization') {
          const orgString = localStorage.getItem('organization');
          if (orgString) {
            const orgData = JSON.parse(orgString);
            if (orgData.name) {
              setOrganizationName(orgData.name);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing layout:', error);
      }
    };
    
    initLayout();
  }, [organizationName]);

  // Navigation items with better organization
  const navigationItems = [
    {
      key: 'dashboard',
      label: 'Overview',
      icon: <Layers size={18} />,
      path: `/organization/${organizationId}`
    },
    {
      key: 'employees',
      label: 'Employees',
      icon: <Users size={18} />,
      path: `/organization/${organizationId}/employees`
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: <Clock size={18} />,
      path: `/organization/${organizationId}/attendance`
    },
    {
      key: 'leave',
      label: 'Leave Management',
      icon: <Calendar size={18} />,
      path: `/organization/${organizationId}/leave`
    },
    {
      key: 'shifts',
      label: 'Shift Planning',
      icon: <RefreshCw size={18} />,
      path: `/organization/${organizationId}/shifts`
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 size={18} />,
      path: `/organization/${organizationId}/analytics`
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: <FileText size={18} />,
      path: `/organization/${organizationId}/reports`
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
      path: `/organization/${organizationId}/settings`
    }
  ];

  // Get current active navigation item
  const getCurrentNavItem = () => {
    const currentPath = location.pathname;
    
    // Handle exact dashboard match
    if (currentPath === `/organization/${organizationId}`) {
      return 'dashboard';
    }
    
    // Handle other paths
    for (const item of navigationItems) {
      if (currentPath.startsWith(item.path) && item.key !== 'dashboard') {
        return item.key;
      }
    }
    
    return 'dashboard'; // Default fallback
  };

  const activeNavItem = getCurrentNavItem();

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/dashboard');
  };

  // Quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'refresh':
        window.location.reload();
        break;
      case 'export':
        // This would be handled by the specific page component
        toast.info('Export functionality available in Reports section');
        break;
      case 'settings':
        navigate(`/organization/${organizationId}/settings`);
        break;
      default:
        break;
    }
  };

  // Role switching function
  const handleRoleSwitch = () => {
    if (!currentUser) return;
    
    const newRole = currentUser.role === 'admin' ? 'employee' : 'admin';
    const updatedUser = {
      ...currentUser,
      role: newRole
    };
    
    // Update local state
    setCurrentUser(updatedUser);
    
    // Update localStorage
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user in localStorage:', error);
    }
    
    // Navigate to appropriate route
    if (newRole === 'employee') {
      navigate('/employee');
    }
    // If switching to admin, we're already in the admin layout
    
    toast.success(`Switched to ${newRole} view`);
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="flex h-screen">
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-0
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-all duration-300 ease-in-out
          bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700
          flex flex-col shadow-lg
        `}>
          {/* Sidebar Header */}
          <div className="flex items-center px-4 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                <img 
                  data-branding="logo"
                  className="w-8 h-8 object-contain rounded-lg hidden"
                  alt="Organization Logo"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) {
                      fallback.style.display = 'none';
                    }
                  }}
                />
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">WB</span>
                </div>
              </div>
              
              {!sidebarCollapsed && (
                <div className="ml-3 min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                    {organizationName}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Admin Dashboard
                  </p>
                </div>
              )}
            </div>
            
            {/* Collapse button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSidebarCollapsed(!sidebarCollapsed);
                setMobileMenuOpen(false);
              }}
              className="flex-shrink-0 w-8 h-8 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:flex hidden"
            >
              <ChevronRight size={16} className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-0' : 'rotate-180'}`} />
            </Button>
            
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden flex-shrink-0 w-8 h-8 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="px-2 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                    ${sidebarCollapsed ? 'justify-center' : 'justify-start'}
                    ${activeNavItem === item.key 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
                      : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {/* Icon container with consistent alignment */}
                  <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                    {item.icon}
                  </div>
                  
                  {/* Label with proper spacing */}
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-sm font-medium text-left truncate">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Subscription Status - Compact */}
          {!sidebarCollapsed && (
            <div className="px-3 pb-3">
              <SubscriptionStatus compact={true} showDetails={false} />
            </div>
          )}

          {/* User Section */}
          {currentUser && (
            <div className="border-t border-neutral-200 dark:border-neutral-700">
              {/* User Info */}
              {!sidebarCollapsed && (
                <div className="p-3">
                  <div className="flex items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {(currentUser.name || 'User').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {currentUser.name || 'User'}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                        {currentUser.role || 'admin'} View
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="p-2 space-y-1">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`
                    w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${sidebarCollapsed ? 'justify-center' : 'justify-start'}
                    text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800
                  `}
                  title={sidebarCollapsed ? `Switch to ${isDarkMode ? 'light' : 'dark'} mode` : undefined}
                >
                  <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-left">
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  )}
                </button>

                {/* Role Switch */}
                <button
                  onClick={handleRoleSwitch}
                  className={`
                    w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${sidebarCollapsed ? 'justify-center' : 'justify-start'}
                    text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800
                  `}
                  title={sidebarCollapsed ? `Switch to ${currentUser.role === 'admin' ? 'employee' : 'admin'} view` : undefined}
                >
                  <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                    <UserCog size={16} />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-left">
                      Switch to {currentUser.role === 'admin' ? 'Employee' : 'Admin'}
                    </span>
                  )}
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className={`
                    w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${sidebarCollapsed ? 'justify-center' : 'justify-start'}
                    text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20
                  `}
                  title={sidebarCollapsed ? 'Logout' : undefined}
                >
                  <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                    <LogOut size={16} />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-left">Logout</span>
                  )}
                </button>
              </div>

              {/* System Status */}
              {!sidebarCollapsed && (
                <div className="p-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">
                        Online
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {navigationItems.find(item => item.key === activeNavItem)?.label || 'Dashboard'}
              </h1>
              <div className="w-8"></div> {/* Spacer for centering */}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              {children || <Outlet />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationLayout;