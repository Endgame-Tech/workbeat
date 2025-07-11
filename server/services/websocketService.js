const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Store user connections
    this.organizationRooms = new Map(); // Track organization rooms
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      roomCount: 0
    };
  }

  // Initialize Socket.IO server
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('🔌 WebSocket service initialized');
  }

  // Setup authentication middleware
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        // Get token from handshake auth or cookies
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];

        if (!token) {
          throw new Error('No authentication token provided');
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: parseInt(decoded.id) },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            organizationId: true
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Attach user to socket
        socket.user = user;
        socket.organizationId = user.organizationId;
        
        console.log(`🔐 User authenticated: ${user.name} (${user.email})`);
        next();
      } catch (error) {
        console.error('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      
      socket.on('disconnect', () => this.handleDisconnection(socket));
      socket.on('join_organization', (data) => this.handleJoinOrganization(socket, data));
      socket.on('leave_organization', (data) => this.handleLeaveOrganization(socket, data));
      socket.on('attendance_update', (data) => this.handleAttendanceUpdate(socket, data));
      socket.on('dashboard_subscribe', (data) => this.handleDashboardSubscribe(socket, data));
      socket.on('dashboard_unsubscribe', (data) => this.handleDashboardUnsubscribe(socket, data));
      socket.on('ping', () => this.handlePing(socket));
    });
  }

  // Handle new connection
  handleConnection(socket) {
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    
    const user = socket.user;
    
    // Store user connection
    this.connectedUsers.set(socket.id, {
      userId: user.id,
      userName: user.name,
      organizationId: user.organizationId,
      role: user.role,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Auto-join organization room if user has organizationId
    if (user.organizationId) {
      this.joinOrganizationRoom(socket, user.organizationId);
    }

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to WorkBeat real-time service',
      userId: user.id,
      organizationId: user.organizationId,
      timestamp: new Date().toISOString()
    });

    console.log(`🔌 User connected: ${user.name} (Total: ${this.stats.activeConnections})`);
    
    // Broadcast user online status to organization
    if (user.organizationId) {
      socket.to(`org_${user.organizationId}`).emit('user_online', {
        userId: user.id,
        userName: user.name,
        role: user.role,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle disconnection
  handleDisconnection(socket) {
    this.stats.activeConnections--;
    
    const userConnection = this.connectedUsers.get(socket.id);
    if (userConnection) {
      console.log(`🔌 User disconnected: ${userConnection.userName} (Total: ${this.stats.activeConnections})`);
      
      // Broadcast user offline status to organization
      if (userConnection.organizationId) {
        socket.to(`org_${userConnection.organizationId}`).emit('user_offline', {
          userId: userConnection.userId,
          userName: userConnection.userName,
          timestamp: new Date().toISOString()
        });
      }
      
      this.connectedUsers.delete(socket.id);
    }
  }

  // Join organization room
  joinOrganizationRoom(socket, organizationId) {
    const roomName = `org_${organizationId}`;
    socket.join(roomName);
    
    // Track organization rooms
    if (!this.organizationRooms.has(organizationId)) {
      this.organizationRooms.set(organizationId, new Set());
      this.stats.roomCount++;
    }
    this.organizationRooms.get(organizationId).add(socket.id);

    console.log(`👥 User joined organization room: ${roomName}`);
  }

  // Handle join organization request
  handleJoinOrganization(socket, data) {
    const { organizationId } = data;
    
    // Verify user has access to this organization
    if (socket.user.organizationId !== organizationId && socket.user.role !== 'admin') {
      socket.emit('error', { message: 'Unauthorized to join this organization' });
      return;
    }

    this.joinOrganizationRoom(socket, organizationId);
    socket.emit('joined_organization', { organizationId, timestamp: new Date().toISOString() });
  }

  // Handle leave organization request
  handleLeaveOrganization(socket, data) {
    const { organizationId } = data;
    const roomName = `org_${organizationId}`;
    
    socket.leave(roomName);
    
    // Update room tracking
    if (this.organizationRooms.has(organizationId)) {
      this.organizationRooms.get(organizationId).delete(socket.id);
      if (this.organizationRooms.get(organizationId).size === 0) {
        this.organizationRooms.delete(organizationId);
        this.stats.roomCount--;
      }
    }

    socket.emit('left_organization', { organizationId, timestamp: new Date().toISOString() });
  }

  // Handle attendance update
  handleAttendanceUpdate(socket, data) {
    if (!socket.user.organizationId) return;

    // Broadcast attendance update to organization
    this.broadcastToOrganization(socket.user.organizationId, 'attendance_updated', {
      ...data,
      updatedBy: {
        id: socket.user.id,
        name: socket.user.name
      },
      timestamp: new Date().toISOString()
    });

    this.stats.messagesSent++;
  }

  // Handle dashboard subscription
  handleDashboardSubscribe(socket, data) {
    const { dashboardType = 'overview' } = data;
    const roomName = `dashboard_${socket.user.organizationId}_${dashboardType}`;
    
    socket.join(roomName);
    socket.emit('dashboard_subscribed', { 
      dashboardType, 
      timestamp: new Date().toISOString() 
    });

    console.log(`📊 User subscribed to dashboard: ${roomName}`);
  }

  // Handle dashboard unsubscription
  handleDashboardUnsubscribe(socket, data) {
    const { dashboardType = 'overview' } = data;
    const roomName = `dashboard_${socket.user.organizationId}_${dashboardType}`;
    
    socket.leave(roomName);
    socket.emit('dashboard_unsubscribed', { 
      dashboardType, 
      timestamp: new Date().toISOString() 
    });
  }

  // Handle ping for connection health
  handlePing(socket) {
    const userConnection = this.connectedUsers.get(socket.id);
    if (userConnection) {
      userConnection.lastActivity = new Date();
    }
    socket.emit('pong', { timestamp: new Date().toISOString() });
  }

  // Broadcast to organization
  broadcastToOrganization(organizationId, event, data) {
    if (!organizationId) return;
    
    const roomName = `org_${organizationId}`;
    this.io.to(roomName).emit(event, data);
    this.stats.messagesSent++;
    
    console.log(`📡 Broadcast to ${roomName}: ${event}`);
  }

  // Broadcast to dashboard subscribers
  broadcastToDashboard(organizationId, dashboardType, event, data) {
    if (!organizationId) return;
    
    const roomName = `dashboard_${organizationId}_${dashboardType}`;
    this.io.to(roomName).emit(event, data);
    this.stats.messagesSent++;
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const userSocket = Array.from(this.connectedUsers.entries())
      .find(([socketId, connection]) => connection.userId === userId);
    
    if (userSocket) {
      this.io.to(userSocket[0]).emit(event, data);
      this.stats.messagesSent++;
      return true;
    }
    return false;
  }

  // Get online users for organization
  getOnlineUsers(organizationId) {
    return Array.from(this.connectedUsers.values())
      .filter(connection => connection.organizationId === organizationId)
      .map(connection => ({
        userId: connection.userId,
        userName: connection.userName,
        role: connection.role,
        connectedAt: connection.connectedAt,
        lastActivity: connection.lastActivity
      }));
  }

  // Get service statistics
  getStats() {
    return {
      ...this.stats,
      connectedUsers: this.connectedUsers.size,
      organizationRooms: Array.from(this.organizationRooms.keys()),
      uptime: process.uptime()
    };
  }

  // Cleanup inactive connections
  cleanupInactiveConnections() {
    const now = new Date();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

    for (const [socketId, connection] of this.connectedUsers.entries()) {
      if (now - connection.lastActivity > maxInactiveTime) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
          console.log(`🧹 Disconnected inactive user: ${connection.userName}`);
        }
      }
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// Cleanup inactive connections every 10 minutes
setInterval(() => {
  webSocketService.cleanupInactiveConnections();
}, 10 * 60 * 1000);

module.exports = webSocketService;