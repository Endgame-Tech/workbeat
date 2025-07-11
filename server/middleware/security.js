const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Security configuration
const securityConfig = {
  // Helmet configuration for security headers
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' },
    dnsPrefetchControl: true,
    ieNoOpen: true,
    hidePoweredBy: true
  }),

  // NoSQL injection protection
  mongoSanitize: mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Request sanitized for potential NoSQL injection: ${key} from ${req.ip}`);
    }
  }),

  // XSS protection
  xss: xss()
};

// Custom security middleware for additional protection
const additionalSecurity = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Prevent caching of sensitive data
  if (req.path.includes('/auth') || req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// IP whitelist middleware (optional - for high-security environments)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured, allow all
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    const isAllowed = allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR notation support (basic)
        const [network, prefix] = allowedIP.split('/');
        // Simple implementation - for production, use a proper CIDR library
        return clientIP.startsWith(network.split('.').slice(0, Math.floor(prefix / 8)).join('.'));
      } else {
        return clientIP === allowedIP;
      }
    });
    
    if (!isAllowed) {
      console.warn(`Blocked request from unauthorized IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        error: 'IP_NOT_WHITELISTED'
      });
    }
    
    next();
  };
};

// Request size limiter
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 50 * 1024 * 1024; // 50MB limit
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      error: 'REQUEST_TOO_LARGE',
      maxSize: '50MB'
    });
  }
  
  next();
};

// Security audit logging
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log security-relevant events
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: duration,
      user: req.user?.id || 'anonymous'
    };
    
    // Log suspicious activities
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      console.warn('Security event:', logData);
    }
    
    // Log slow requests (potential DoS attempts)
    if (duration > 5000) {
      console.warn('Slow request detected:', logData);
    }
  });
  
  next();
};

// Sanitize input data
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    // Remove potentially dangerous characters
    const sanitize = (obj) => {
      if (typeof obj === 'string') {
        return obj.trim().replace(/[<>]/g, '');
      } else if (typeof obj === 'object' && obj !== null) {
        const sanitized = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };
    
    req.body = sanitize(req.body);
  }
  
  next();
};

module.exports = {
  securityConfig,
  additionalSecurity,
  ipWhitelist,
  requestSizeLimit,
  securityLogger,
  sanitizeInput
};