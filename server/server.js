const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/environment.js');
const { connectDB } = require('./config/database.js');

// Security middleware
const { securityConfig, additionalSecurity, securityLogger, sanitizeInput, requestSizeLimit } = require('./middleware/security.js');
const { generalLimiter } = require('./middleware/rateLimiter.js');
const { enhancedCSRFProtection } = require('./middleware/csrfProtection.js');
const performanceMonitor = require('./middleware/performanceMonitor.js');
const { globalErrorHandler, notFoundHandler, handleUnhandledRejection, handleUncaughtException } = require('./utils/errorHandler.js');
const webSocketService = require('./services/websocketService.js');
const employeeRoutes = require('./routes/employeeRoutes.js');
const attendanceRoutes = require('./routes/attendanceRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const biometricRoutes = require('./routes/biometricRoutes.js');
const organizationRoutes = require('./routes/organizationRoutes.js');
const employeeAuthRoutes = require('./routes/employeeAuthRoutes.js');
const departmentRoutes = require('./routes/departmentRoutes.js');
const subscriptionRoutes = require('./routes/subscriptionRoutes.js');
const webhookRoutes = require('./routes/webhookRoutes.js');

// New feature routes
const leaveTypeRoutes = require('./routes/leaveTypeRoutes.js');
const leaveRequestRoutes = require('./routes/leaveRequestRoutes.js');
const leaveBalanceRoutes = require('./routes/leaveBalanceRoutes.js');
const shiftTemplateRoutes = require('./routes/shiftTemplateRoutes.js');
const scheduledShiftRoutes = require('./routes/scheduledShiftRoutes.js');
const notificationTemplateRoutes = require('./routes/notificationTemplateRoutes.js');
const notificationPreferenceRoutes = require('./routes/notificationPreferenceRoutes.js');
const notificationQueueRoutes = require('./routes/notificationQueueRoutes.js');

const path = require('path');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Trust proxy for accurate IP detection (needed for Render/production)
if (config.app.env === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', true);
}

// Connect to database
connectDB();

// Security middleware (order matters!)
app.use(securityConfig.helmet); // Security headers
app.use(additionalSecurity); // Custom security headers
app.use(securityLogger); // Security event logging
app.use(requestSizeLimit); // Request size validation
app.use(performanceMonitor.requestMonitor()); // Performance monitoring
app.use(generalLimiter); // General rate limiting
app.use(enhancedCSRFProtection()); // CSRF protection

// Data parsing and sanitization
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser()); // Parse cookies for secure authentication
app.use(securityConfig.mongoSanitize); // NoSQL injection protection
app.use(securityConfig.xss); // XSS protection
app.use(sanitizeInput); // Additional input sanitization

// CORS configuration
const getDevOrigins = () => {
  if (config.app.env !== 'development') return [];
  
  return [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // React dev server
    'http://localhost:4173', // Vite preview
    'http://127.0.0.1:5173', // Alternative localhost
    'http://127.0.0.1:3000', // Alternative localhost
  ];
};

const allowedOrigins = [
  config.app.frontendUrl,
  ...getDevOrigins()
].filter(Boolean);

// In production, only allow the configured frontend URL
const corsOrigins = config.app.env === 'production' 
  ? [
      config.app.frontendUrl, 
      'https://workbeat.vercel.app',
      'https://workbeat-iota.vercel.app'
    ].filter(Boolean)
  : allowedOrigins;

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, log the origin and allow it anyway
    if (config.app.env !== 'production') {
      console.warn(`⚠️  CORS: Unknown origin allowed in development: ${origin}`);
      return callback(null, true);
    }
    
    // In production, reject unknown origins
    console.error(`🚫 CORS: Origin not allowed: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'X-CSRF-Token']
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employee-auth', employeeAuthRoutes);
app.use('/api/biometrics', biometricRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/organizations', departmentRoutes);
app.use('/api/subscription', subscriptionRoutes);

// New feature routes
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/leave-balances', leaveBalanceRoutes);
app.use('/api/shift-templates', shiftTemplateRoutes);
app.use('/api/scheduled-shifts', scheduledShiftRoutes);
app.use('/api/notification-templates', notificationTemplateRoutes);
app.use('/api/notification-preferences', notificationPreferenceRoutes);
app.use('/api/notification-queue', notificationQueueRoutes);

// Webhook routes (should be before other middleware that might interfere)
app.use('/api/webhooks', webhookRoutes);

// Default route with health check
app.get('/', (req, res) => {
  res.json({
    message: 'WorkBeat API is running',
    version: config.app.version,
    environment: config.app.env,
    timestamp: new Date().toISOString()
  });
});

// Database health check endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    const { prisma } = require('./config/db');
    
    // Test database connection
    await prisma.$connect();
    
    // Test if organizations table exists and is accessible
    const orgCount = await prisma.organization.count();
    
    // Test if users table with resetPasswordToken exists
    const userCount = await prisma.user.count();
    
    await prisma.$disconnect();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      organizations: orgCount,
      users: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Performance monitoring endpoint (admin only)
app.get('/api/performance', (req, res) => {
  // Simple IP-based admin check for demo (in production, use proper auth)
  const adminIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (!adminIPs.includes(req.ip) && !req.headers.authorization) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  return performanceMonitor.getReportEndpoint()(req, res);
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { getDatabaseStats, performHealthCheck } = require('./config/database.js');
    
    await performHealthCheck();
    const dbStats = await getDatabaseStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.env,
      database: dbStats,
      features: config.features
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { getDatabaseStats, performHealthCheck } = require('./config/database.js');
    
    await performHealthCheck();
    const dbStats = await getDatabaseStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.env,
      database: dbStats,
      features: config.features
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Error handling middleware (must be last)
app.use(notFoundHandler); // Handle 404 errors
app.use(globalErrorHandler); // Handle all other errors

// Setup process error handlers
handleUnhandledRejection();
handleUncaughtException();

// Initialize WebSocket service
webSocketService.initialize(server);

// Add WebSocket statistics endpoint
app.get('/api/websocket/stats', (req, res) => {
  // Simple admin check
  if (!req.headers.authorization && !['127.0.0.1', '::1'].includes(req.ip)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  res.json({
    success: true,
    websocket: webSocketService.getStats()
  });
});

// Start server
const PORT = config.app.port;
server.listen(PORT, () => {
  console.log(`🚀 WorkBeat API v${config.app.version} running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.app.env}`);
  console.log(`🔗 Frontend URL: ${config.app.frontendUrl}`);
  const baseUrl = config.app.baseUrl || `http://localhost:${PORT}`;
  console.log(`📊 Health check: ${baseUrl}/health`);
  console.log(`⚡ Performance monitoring: ${baseUrl}/api/performance`);
  console.log(`🔌 WebSocket statistics: ${baseUrl}/api/websocket/stats`);
});