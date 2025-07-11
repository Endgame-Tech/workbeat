import { io, Socket } from 'socket.io-client';

export interface AttendanceUpdate {
  id: number;
  employeeId: number;
  employeeName: string;
  type: 'sign-in' | 'sign-out';
  timestamp: string;
  isLate: boolean;
  location?: string;
  organizationId: number;
  verificationMethod?: string;
}

export interface StatsUpdate {
  trigger: string;
  timestamp: string;
}

export interface WebSocketStats {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  roomCount: number;
  connectedUsers: number;
  organizationRooms: number[];
  uptime: number;
}

type EventCallback<T = any> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  async connect(token?: string): Promise<boolean> {
    if (this.socket?.connected || this.isConnecting) {
      return this.socket?.connected || false;
    }

    this.isConnecting = true;

    try {
      // Get auth token from cookie or parameter
      const authToken = token || this.getTokenFromCookie();
      
      if (!authToken) {
        // Don't log warning if we're not authenticated yet - this is expected behavior
        this.isConnecting = false;
        return false;
      }

      // Create socket connection
      const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_APP_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
      this.socket = io(wsUrl, {
        auth: { token: authToken },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        withCredentials: true
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Wait for connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('❌ WebSocket connection timeout');
          this.isConnecting = false;
          resolve(false);
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          console.log('🔌 WebSocket connected successfully');
          
          // Subscribe to dashboard updates
          this.subscribeToDashboard('overview');
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error('❌ WebSocket connection failed:', error.message);
          this.handleReconnect();
          resolve(false);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to create WebSocket connection:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected');
    }
    this.eventListeners.clear();
    this.reconnectAttempts = 0;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connected', (data) => {
      console.log('🔌 WebSocket welcome message:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    // Real-time data events
    this.socket.on('attendance_updated', (data: AttendanceUpdate) => {
      console.log('📊 Real-time attendance update:', data);
      this.emit('attendance_updated', data);
    });

    this.socket.on('stats_updated', (data: StatsUpdate) => {
      console.log('📈 Real-time stats update:', data);
      this.emit('stats_updated', data);
    });

    // User presence events
    this.socket.on('user_online', (data) => {
      console.log('👤 User came online:', data);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      console.log('👤 User went offline:', data);
      this.emit('user_offline', data);
    });

    // Dashboard subscription events
    this.socket.on('dashboard_subscribed', (data) => {
      console.log('📊 Subscribed to dashboard:', data);
    });

    // Connection health
    this.socket.on('pong', (data) => {
      // Connection is healthy
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('websocket_error', error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('websocket_max_reconnect_reached', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    // First try to get from httpOnly cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
    
    // Fallback: try to get from localStorage (legacy support)
    try {
      const token = localStorage.getItem('token');
      if (token) {
        return token;
      }
    } catch (error) {
      console.warn('Unable to access localStorage for token');
    }
    
    return null;
  }

  // Event subscription methods
  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  off<T = any>(event: string, callback: EventCallback<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  private emit<T = any>(event: string, data: T): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in WebSocket event callback for ${event}:`, error);
        }
      });
    }
  }

  // Dashboard subscription
  subscribeToDashboard(dashboardType: string = 'overview'): void {
    if (this.socket?.connected) {
      this.socket.emit('dashboard_subscribe', { dashboardType });
    }
  }

  unsubscribeFromDashboard(dashboardType: string = 'overview'): void {
    if (this.socket?.connected) {
      this.socket.emit('dashboard_unsubscribe', { dashboardType });
    }
  }

  // Organization room management
  joinOrganization(organizationId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('join_organization', { organizationId });
    }
  }

  leaveOrganization(organizationId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_organization', { organizationId });
    }
  }

  // Manual attendance update trigger (for testing)
  triggerAttendanceUpdate(data: Partial<AttendanceUpdate>): void {
    if (this.socket?.connected) {
      this.socket.emit('attendance_update', data);
    }
  }

  // Connection health check
  ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get connection ID
  getConnectionId(): string | null {
    return this.socket?.id || null;
  }

  // Get WebSocket statistics (admin only)
  async getStats(): Promise<WebSocketStats | null> {
    try {
      // This would typically be a separate HTTP API call
      const response = await fetch('/api/websocket/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.websocket;
      }
    } catch (error) {
      console.error('❌ Failed to fetch WebSocket stats:', error);
    }
    return null;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// Don't auto-connect immediately - let WebSocketProvider handle connection timing
// This prevents the "No authentication token" error on page load
// The WebSocketProvider will connect when authentication is confirmed

export default webSocketService;