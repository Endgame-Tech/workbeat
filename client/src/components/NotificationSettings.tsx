import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import { Bell, BellOff, Settings, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'react-hot-toast';

interface NotificationSettingsProps {
  className?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className }) => {
  const {
    isSupported,
    permission,
    isInitialized,
    isLoading,
    requestPermission,
    testNotification,
    showSystemNotification
  } = usePushNotifications();

  const [testing, setTesting] = useState(false);

  const handleRequestPermission = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        toast.success('Push notifications enabled successfully!');
        // Show a welcome notification
        await showSystemNotification(
          'Notifications Enabled',
          'You will now receive real-time attendance updates',
          'success'
        );
      } else {
        toast.error('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable push notifications');
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      const success = await testNotification();
      if (success) {
        toast.success('Test notification sent!');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setTesting(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          text: 'Enabled',
          color: 'text-success-600 dark:text-success-400',
          bgColor: 'bg-success-50 dark:bg-success-900/20',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'denied':
        return {
          text: 'Disabled',
          color: 'text-danger-600 dark:text-danger-400',
          bgColor: 'bg-danger-50 dark:bg-danger-900/20',
          icon: <BellOff className="w-4 h-4" />
        };
      default:
        return {
          text: 'Not Set',
          color: 'text-warning-600 dark:text-warning-400',
          bgColor: 'bg-warning-50 dark:bg-warning-900/20',
          icon: <AlertCircle className="w-4 h-4" />
        };
    }
  };

  const status = getPermissionStatus();

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
              <Info className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Push Notifications
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Not supported in this browser
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-warning-800 dark:text-warning-200 font-medium">
                  Browser Not Supported
                </p>
                <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                  Your browser doesn't support push notifications. Please try using a modern browser like Chrome, Firefox, or Safari.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Push Notifications
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Get notified about attendance updates in real-time
              </p>
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${status.bgColor}`}>
            {status.icon}
            <span className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status and Actions */}
        <div className="space-y-4">
          {permission === 'default' && (
            <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-info-800 dark:text-info-200 font-medium">
                    Enable Notifications
                  </p>
                  <p className="text-sm text-info-700 dark:text-info-300 mt-1">
                    Allow WorkBeat to send you push notifications for attendance updates, even when the tab is not active.
                  </p>
                  <div className="mt-3">
                    <Button
                      onClick={handleRequestPermission}
                      isLoading={isLoading}
                      className="bg-info-600 hover:bg-info-700 text-white"
                      size="sm"
                    >
                      Enable Notifications
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <BellOff className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-danger-800 dark:text-danger-200 font-medium">
                    Notifications Blocked
                  </p>
                  <p className="text-sm text-danger-700 dark:text-danger-300 mt-1">
                    Push notifications are currently blocked. To enable them, click the notification icon in your browser's address bar or go to your browser settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {permission === 'granted' && (
            <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-success-800 dark:text-success-200 font-medium">
                    Notifications Enabled
                  </p>
                  <p className="text-sm text-success-700 dark:text-success-300 mt-1">
                    You'll receive push notifications for attendance updates and system messages.
                  </p>
                  <div className="mt-3">
                    <Button
                      onClick={handleTestNotification}
                      isLoading={testing}
                      variant="outline"
                      size="sm"
                      className="border-success-300 text-success-700 hover:bg-success-100 dark:border-success-700 dark:text-success-300 dark:hover:bg-success-900/30"
                    >
                      Send Test Notification
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Features */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wide">
            What you'll be notified about:
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Employee Check-ins/Check-outs
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Real-time notifications when employees sign in or out
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-warning-500 flex-shrink-0 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Late Arrivals
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Alerts when employees check in after their scheduled time
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-info-500 flex-shrink-0 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Connection Status
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Updates when real-time connection is lost or restored
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-success-500 flex-shrink-0 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  System Updates
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Important system messages and sync status updates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            <Settings className="w-3 h-3 inline mr-1" />
            Notifications respect your browser's notification settings and will only show when the WorkBeat tab is not active.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;