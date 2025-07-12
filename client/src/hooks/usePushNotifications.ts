import { useState, useEffect, useCallback } from 'react';
import pushNotificationService from '../services/pushNotificationService';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isInitialized: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  showNotification: (title: string, body: string, options?: NotificationOptions) => Promise<boolean>;
  showAttendanceNotification: (
    employeeName: string, 
    type: 'sign-in' | 'sign-out', 
    isLate?: boolean,
    location?: string
  ) => Promise<boolean>;
  showSystemNotification: (
    title: string,
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => Promise<boolean>;
  showConnectionNotification: (isConnected: boolean) => Promise<boolean>;
  testNotification: () => Promise<boolean>;
  clearNotifications: (tag?: string) => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize push notification service
  useEffect(() => {
    const initializeService = async () => {
      setIsLoading(true);
      
      try {
        const initialized = await pushNotificationService.initialize();
        setIsInitialized(initialized);
        setIsSupported(pushNotificationService.isNotificationSupported());
        setPermission(Notification.permission);
        
      } catch (error) {
        console.error('❌ Failed to initialize push notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('🔔 Push notifications not supported');
      return false;
    }

    setIsLoading(true);
    
    try {
      const granted = await pushNotificationService.requestPermission();
      // Extract the permission string from the status object
      const status = pushNotificationService.getPermissionStatus();
      if (status.granted) setPermission('granted');
      else if (status.denied) setPermission('denied');
      else setPermission('default');
      return granted;
    } catch (error) {
      console.error('❌ Failed to request notification permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Show a generic notification
  const showNotification = useCallback(async (
    title: string, 
    body: string, 
    options?: NotificationOptions
  ): Promise<boolean> => {
    if (permission !== 'granted') {
      console.warn('🔔 Cannot show notification: permission not granted');
      return false;
    }

    // Filter out null for silent to satisfy PushNotificationOptions type
    const filteredOptions = options
      ? { ...options, silent: options.silent === null ? undefined : options.silent }
      : undefined;

    return await pushNotificationService.showNotification({
      title,
      body,
      ...(filteredOptions || {})
    });
  }, [permission]);

  // Show attendance-specific notification
  const showAttendanceNotification = useCallback(async (
    employeeName: string, 
    type: 'sign-in' | 'sign-out', 
    isLate?: boolean,
    location?: string
  ): Promise<boolean> => {
    if (permission !== 'granted') return false;
    
    return await pushNotificationService.showAttendanceNotification({
      employeeName,
      type,
      isLate,
      organizationName: location,
      timestamp: new Date().toISOString()
    });
  }, [permission]);

  // Show system notification
  const showSystemNotification = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<boolean> => {
    if (permission !== 'granted') return false;
    
    // Combine title and message for the message argument, since showSystemNotification expects (message, type)
    const fullMessage = title ? `${title}\n${message}` : message;
    // Only pass message and type (type may need to be mapped if 'success' is not supported)
    const mappedType = type === 'success' ? 'info' : type;
    return await pushNotificationService.showSystemNotification(fullMessage, mappedType as 'info' | 'warning' | 'error');
  }, [permission]);

  // Show connection status notification
  const showConnectionNotification = useCallback(async (
    isConnected: boolean
  ): Promise<boolean> => {
    if (permission !== 'granted') return false;
    
    return await pushNotificationService.showOrganizationNotification({
      title: isConnected ? 'Connected to Organization' : 'Disconnected from Organization',
      message: isConnected
        ? 'You are now connected to your organization.'
        : 'You have been disconnected from your organization.',
      type: isConnected ? 'success' : 'warning'
    });
  }, [permission]);

  // Test notification
  const testNotification = useCallback(async (): Promise<boolean> => {
    if (permission !== 'granted') return false;
    
    return await pushNotificationService.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from WorkBeat.'
    });
  }, [permission]);

  // Clear notifications
  const clearNotifications = useCallback(async (tag?: string): Promise<void> => {
    await pushNotificationService.clearNotifications(tag);
  }, []);

  return {
    isSupported,
    permission,
    isInitialized,
    isLoading,
    requestPermission,
    showNotification,
    showAttendanceNotification,
    showSystemNotification,
    showConnectionNotification,
    testNotification,
    clearNotifications
  };
};