import { useState, useEffect, useCallback } from 'react';
import pushNotificationService from '../services/pushNotificationService';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isInitialized: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  showNotification: (title: string, body: string, options?: any) => Promise<boolean>;
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
        setPermission(pushNotificationService.getPermissionStatus());
        
        console.log('🔔 Push notification service initialized:', initialized);
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
      setPermission(pushNotificationService.getPermissionStatus());
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
    options?: any
  ): Promise<boolean> => {
    if (permission !== 'granted') {
      console.warn('🔔 Cannot show notification: permission not granted');
      return false;
    }

    return await pushNotificationService.showServiceWorkerNotification({
      title,
      body,
      ...options
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
    
    return await pushNotificationService.showAttendanceNotification(
      employeeName, 
      type, 
      isLate, 
      location
    );
  }, [permission]);

  // Show system notification
  const showSystemNotification = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<boolean> => {
    if (permission !== 'granted') return false;
    
    return await pushNotificationService.showSystemNotification(title, message, type);
  }, [permission]);

  // Show connection status notification
  const showConnectionNotification = useCallback(async (
    isConnected: boolean
  ): Promise<boolean> => {
    if (permission !== 'granted') return false;
    
    return await pushNotificationService.showConnectionNotification(isConnected);
  }, [permission]);

  // Test notification
  const testNotification = useCallback(async (): Promise<boolean> => {
    if (permission !== 'granted') return false;
    
    return await pushNotificationService.testNotification();
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