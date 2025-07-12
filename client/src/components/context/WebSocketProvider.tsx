import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import webSocketService, { AttendanceUpdate, StatsUpdate, WebSocketStats } from '../../services/websocketService';
import { useAuth } from './AuthContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface WebSocketContextType {
  isConnected: boolean;
  connectionId: string | null;
  connectionAttempts: number;
  lastAttendanceUpdate: AttendanceUpdate | null;
  lastStatsUpdate: StatsUpdate | null;
  onlineUsers: { userId: string; username?: string; timestamp?: string; }[];
  // Methods
  connect: () => Promise<boolean>;
  disconnect: () => void;
  subscribeToDashboard: (type: string) => void;
  unsubscribeFromDashboard: (type: string) => void;
  joinOrganization: (organizationId: number) => void;
  leaveOrganization: (organizationId: number) => void;
  ping: () => void;
  getStats: () => Promise<WebSocketStats | null>;
  // Event handlers
  onAttendanceUpdate: (callback: (data: AttendanceUpdate) => void) => () => void;
  onStatsUpdate: (callback: (data: StatsUpdate) => void) => () => void;
  onUserOnline: (callback: (data: { userId: string; username?: string; timestamp?: string; }) => void) => () => void;
  onUserOffline: (callback: (data: { userId: string; username?: string; timestamp?: string; }) => void) => () => void;
  onError: (callback: (error: Error | string | Record<string, unknown>) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  autoConnect = true 
}) => {
  const { user, isAuthenticated } = useAuth();
  const {
    showAttendanceNotification,
    showConnectionNotification,
    permission: notificationPermission
  } = usePushNotifications();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState<AttendanceUpdate | null>(null);
  const [lastStatsUpdate, setLastStatsUpdate] = useState<StatsUpdate | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; username?: string; timestamp?: string; }[]>([]);

  // Connection management
  const connect = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    setConnectionAttempts(prev => prev + 1);
    
    try {
      const connected = await webSocketService.connect();
      setIsConnected(connected);
      
      if (connected) {
        const id = webSocketService.getConnectionId();
        setConnectionId(id);
        
        // Auto-join organization if user has one
        if (user?.organizationId) {
          webSocketService.joinOrganization(user.organizationId);
        }
        
        // Show connection restored notification (only if this was a reconnection)
        if (notificationPermission === 'granted') {
          showConnectionNotification(true).catch(console.error);
        }
      } else {
        // Show connection lost notification
        if (notificationPermission === 'granted') {
          showConnectionNotification(false).catch(console.error);
        }
      }
      
      return connected;
    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
      setIsConnected(false);
      return false;
    }
  }, [isAuthenticated, user?.organizationId, notificationPermission, showConnectionNotification]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
    setConnectionId(null);
    setLastAttendanceUpdate(null);
    setLastStatsUpdate(null);
    setOnlineUsers([]);
  }, []);

  // Dashboard subscription methods
  const subscribeToDashboard = useCallback((type: string) => {
    webSocketService.subscribeToDashboard(type);
  }, []);

  const unsubscribeFromDashboard = useCallback((type: string) => {
    webSocketService.unsubscribeFromDashboard(type);
  }, []);

  // Organization room methods
  const joinOrganization = useCallback((organizationId: number) => {
    webSocketService.joinOrganization(organizationId);
  }, []);

  const leaveOrganization = useCallback((organizationId: number) => {
    webSocketService.leaveOrganization(organizationId);
  }, []);

  // Utility methods
  const ping = useCallback(() => {
    webSocketService.ping();
  }, []);

  const getStats = useCallback(async (): Promise<WebSocketStats | null> => {
    return await webSocketService.getStats();
  }, []);

  // Event subscription helpers that return cleanup functions
  const onAttendanceUpdate = useCallback((callback: (data: AttendanceUpdate) => void) => {
    webSocketService.on('attendance_updated', callback);
    return () => webSocketService.off('attendance_updated', callback);
  }, []);

  const onStatsUpdate = useCallback((callback: (data: StatsUpdate) => void) => {
    webSocketService.on('stats_updated', callback);
    return () => webSocketService.off('stats_updated', callback);
  }, []);

  const onUserOnline = useCallback((callback: (data: { userId: string; username?: string; timestamp?: string; }) => void) => {
    webSocketService.on('user_online', callback);
    return () => webSocketService.off('user_online', callback);
  }, []);

  const onUserOffline = useCallback((callback: (data: { userId: string; username?: string; timestamp?: string; }) => void) => {
    webSocketService.on('user_offline', callback);
    return () => webSocketService.off('user_offline', callback);
  }, []);

  const onError = useCallback((callback: (error: Error | string | Record<string, unknown>) => void) => {
    webSocketService.on('websocket_error', callback);
    return () => webSocketService.off('websocket_error', callback);
  }, []);

  // Setup global event listeners for context state updates
  useEffect(() => {
    const unsubscribeAttendance = webSocketService.on('attendance_updated', (data: AttendanceUpdate) => {
      setLastAttendanceUpdate(data);
      
      // Show push notification for attendance updates (if permission granted and tab not active)
      if (notificationPermission === 'granted' && document.hidden) {
        showAttendanceNotification(
          data.employeeName,
          data.type,
          data.isLate,
          data.location
        ).catch(console.error);
      }
    });

    const unsubscribeStats = webSocketService.on('stats_updated', (data: StatsUpdate) => {
      setLastStatsUpdate(data);
    });

    const unsubscribeUserOnline = webSocketService.on('user_online', (data: { userId: string; username?: string; timestamp?: string; }) => {
      setOnlineUsers(prev => {
        // Add user if not already in list
        if (!prev.find(u => u.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    });

    const unsubscribeUserOffline = webSocketService.on('user_offline', (data: { userId: string; username?: string; timestamp?: string; }) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    const unsubscribeError = webSocketService.on('websocket_error', (error: Error | string | Record<string, unknown>) => {
      console.error('❌ WebSocket error in context:', error);
      setIsConnected(false);
    });

    const unsubscribeMaxReconnect = webSocketService.on('websocket_max_reconnect_reached', () => {
      console.error('❌ Max reconnection attempts reached');
      setIsConnected(false);
    });

    // Cleanup function
    return () => {
      unsubscribeAttendance();
      unsubscribeStats();
      unsubscribeUserOnline();
      unsubscribeUserOffline();
      unsubscribeError();
      unsubscribeMaxReconnect();
    };
  }, [notificationPermission, showAttendanceNotification]);

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && user && !isConnected) {
      connect();
    }
  }, [autoConnect, isAuthenticated, user, isConnected, connect]);

  // Auto-disconnect when user logs out
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, isConnected, disconnect]);

  // Connection health monitoring
  useEffect(() => {
    if (!isConnected) return;

    // Ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (webSocketService.isConnected()) {
        ping();
      } else {
        setIsConnected(false);
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, ping]);

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionId,
    connectionAttempts,
    lastAttendanceUpdate,
    lastStatsUpdate,
    onlineUsers,
    connect,
    disconnect,
    subscribeToDashboard,
    unsubscribeFromDashboard,
    joinOrganization,
    leaveOrganization,
    ping,
    getStats,
    onAttendanceUpdate,
    onStatsUpdate,
    onUserOnline,
    onUserOffline,
    onError
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Higher-order component for WebSocket integration
export const withWebSocket = <P extends object>(Component: React.ComponentType<P>) => {
  return React.forwardRef<React.ComponentRef<typeof Component>, P>((props, ref) => (
    <WebSocketProvider>
      <Component {...props} ref={ref} />
    </WebSocketProvider>
  ));
};

export default WebSocketProvider;