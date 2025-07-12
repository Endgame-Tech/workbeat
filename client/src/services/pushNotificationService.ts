interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, unknown>;
}

interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;
  private permissionStatus: NotificationPermissionStatus;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'Notification' in window;
    this.permissionStatus = {
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      default: Notification.permission === 'default'
    };
  }

  // Check if push notifications are supported
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermissionStatus {
    return {
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      default: Notification.permission === 'default'
    };
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('🔔 Push notifications not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus = {
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default'
      };

      if (permission === 'granted') {
        return true;
      } else {
        console.warn('🔔 Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('🔔 Error requesting notification permission:', error);
      return false;
    }
  }

  // Register service worker for push notifications
  async registerServiceWorker(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('🔔 Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return true;
    } catch (error) {
      console.error('🔔 Service Worker registration failed:', error);
      return false;
    }
  }

  // Show local notification
  async showNotification(options: PushNotificationOptions): Promise<boolean> {
    if (!this.permissionStatus.granted) {
      console.warn('🔔 Cannot show notification: permission not granted');
      return false;
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.svg',
        badge: options.badge || '/icons/icon-72x72.svg',
        tag: options.tag || 'workbeat-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || {}
      };

      if (this.registration) {
        // Use service worker registration if available
        await this.registration.showNotification(options.title, notificationOptions);
      } else {
        // Fallback to basic notification
        new Notification(options.title, notificationOptions);
      }
      return true;
    } catch (error) {
      console.error('🔔 Error showing notification:', error);
      return false;
    }
  }

  // Attendance-specific notification methods
  async showAttendanceNotification(attendanceData: {
    employeeName: string;
    type: 'sign-in' | 'sign-out';
    isLate?: boolean;
    timestamp: string;
    organizationName?: string;
  }): Promise<boolean> {
    const action = attendanceData.type === 'sign-in' ? 'checked in' : 'checked out';
    const lateText = attendanceData.isLate ? ' (Late)' : '';
    const orgText = attendanceData.organizationName ? ` at ${attendanceData.organizationName}` : '';

    return await this.showNotification({
      title: `Employee ${attendanceData.type === 'sign-in' ? 'Check-in' : 'Check-out'}`,
      body: `${attendanceData.employeeName} ${action}${lateText}${orgText}`,
      tag: `attendance-${attendanceData.type}`,
      requireInteraction: attendanceData.isLate, // Require interaction for late check-ins
      data: {
        type: 'attendance',
        employeeName: attendanceData.employeeName,
        attendanceType: attendanceData.type,
        isLate: attendanceData.isLate,
        timestamp: attendanceData.timestamp
      }
    });
  }

  // Organization event notifications
  async showOrganizationNotification(eventData: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    organizationName?: string;
  }): Promise<boolean> {
    const icons = {
      info: '/icons/info.png',
      warning: '/icons/warning.png',
      success: '/icons/success.png',
      error: '/icons/error.png'
    };

    return await this.showNotification({
      title: eventData.title,
      body: eventData.message,
      icon: icons[eventData.type],
      tag: `org-${eventData.type}`,
      requireInteraction: eventData.type === 'error' || eventData.type === 'warning',
      data: {
        type: 'organization',
        eventType: eventData.type,
        organizationName: eventData.organizationName
      }
    });
  }

  // System notifications
  async showSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<boolean> {
    const titles = {
      info: 'WorkBeat Info',
      warning: 'WorkBeat Warning',
      error: 'WorkBeat Error'
    };

    return await this.showNotification({
      title: titles[type],
      body: message,
      tag: `system-${type}`,
      requireInteraction: type === 'error',
      data: {
        type: 'system',
        level: type
      }
    });
  }

  // Clear all notifications with a specific tag
  async clearNotifications(tag?: string): Promise<void> {
    if (!this.registration) return;

    try {
      const notifications = await this.registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('🔔 Error clearing notifications:', error);
    }
  }

  // Get active notifications
  async getActiveNotifications(tag?: string): Promise<Notification[]> {
    if (!this.registration) return [];

    try {
      return await this.registration.getNotifications({ tag });
    } catch (error) {
      console.error('🔔 Error getting active notifications:', error);
      return [];
    }
  }

  // Initialize push notification service
  async initialize(): Promise<boolean> {

    if (!this.isSupported) {
      console.warn('🔔 Push notifications not supported in this browser');
      return false;
    }

    // Check current permission status
    this.permissionStatus = this.getPermissionStatus();

    if (this.permissionStatus.granted) {
      // Register service worker if permission already granted
      await this.registerServiceWorker();
      return true;
    }

    return false;
  }

  // Setup with permission request
  async setup(): Promise<boolean> {

    // Initialize first
    await this.initialize();

    // Request permission if not already granted
    if (!this.permissionStatus.granted && !this.permissionStatus.denied) {
      const permissionGranted = await this.requestPermission();
      
      if (permissionGranted) {
        await this.registerServiceWorker();
        return true;
      }
    }

    return this.permissionStatus.granted;
  }

  // Notification preferences management
  private getStorageKey(key: string): string {
    return `workbeat_notification_${key}`;
  }

  // Save notification preferences
  savePreferences(preferences: {
    enabled: boolean;
    attendanceUpdates: boolean;
    lateArrivals: boolean;
    systemAlerts: boolean;
    sound: boolean;
    vibration: boolean;
  }): void {
    try {
      localStorage.setItem(this.getStorageKey('preferences'), JSON.stringify(preferences));
    } catch (error) {
      console.error('🔔 Error saving notification preferences:', error);
    }
  }

  // Load notification preferences
  loadPreferences(): {
    enabled: boolean;
    attendanceUpdates: boolean;
    lateArrivals: boolean;
    systemAlerts: boolean;
    sound: boolean;
    vibration: boolean;
  } {
    try {
      const stored = localStorage.getItem(this.getStorageKey('preferences'));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('🔔 Error loading notification preferences:', error);
    }

    // Default preferences
    return {
      enabled: true,
      attendanceUpdates: true,
      lateArrivals: true,
      systemAlerts: true,
      sound: true,
      vibration: true
    };
  }

  // Check if specific notification type is enabled
  isNotificationTypeEnabled(type: 'attendance' | 'lateArrivals' | 'system'): boolean {
    const preferences = this.loadPreferences();
    
    if (!preferences.enabled || !this.permissionStatus.granted) {
      return false;
    }

    switch (type) {
      case 'attendance':
        return preferences.attendanceUpdates;
      case 'lateArrivals':
        return preferences.lateArrivals;
      case 'system':
        return preferences.systemAlerts;
      default:
        return false;
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
export type { PushNotificationOptions, NotificationPermissionStatus };