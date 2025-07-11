const rateLimit = require('express-rate-limit');

// General API rate limiter - applies to all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict limiter for authentication routes with progressive delays
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Custom key generator to include user email if available
  keyGenerator: (req) => {
    return req.body?.email ? `${req.ip}-${req.body.email}` : req.ip;
  },
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    console.warn(`🚨 Auth rate limit exceeded for IP: ${req.ip}, Email: ${req.body?.email || 'unknown'}`);
    
    // Log security event
    if (req.body?.email) {
      console.warn(`🔒 Potential brute force attack detected for email: ${req.body.email}`);
    }
    
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again after 15 minutes.',
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

// Stricter limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts from this IP, please try again after 1 hour.',
    error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email ? `${req.ip}-${req.body.email}` : req.ip;
  }
});

// Limiter for organization registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // limit each IP to 2 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts from this IP, please try again after 1 hour.',
    error: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for attendance creation (prevent spam)
const attendanceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 attendance records per minute
  message: {
    success: false,
    message: 'Too many attendance submissions from this IP, please wait a moment.',
    error: 'ATTENDANCE_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for biometric operations (more strict due to processing cost)
const biometricLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 biometric operations per minute
  message: {
    success: false,
    message: 'Too many biometric operations from this IP, please wait a moment.',
    error: 'BIOMETRIC_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for report generation (expensive operations)
const reportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 report generations per 5 minutes
  message: {
    success: false,
    message: 'Too many report generation requests from this IP, please wait a few minutes.',
    error: 'REPORT_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many upload requests from this IP, please try again later.',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create user-specific limiter for authenticated routes
const createUserLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests from this user, please try again later.',
      error: 'USER_RATE_LIMIT_EXCEEDED',
      retryAfter: `${windowMs / 60000} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id ? `user-${req.user.id}` : req.ip;
    }
  });
};

// Intelligent rate limiter that adapts based on request patterns
const intelligentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Authenticated users get higher limits
    if (req.user) {
      // Admin users get even higher limits
      if (req.user.role === 'admin') {
        return 2000;
      }
      return 1500;
    }
    // Anonymous users get lower limits
    return 100;
  },
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: 'INTELLIGENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id ? `user-${req.user.id}` : req.ip;
  }
});

// Suspicious activity detector
const suspiciousActivityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Very low limit for suspicious patterns
  message: {
    success: false,
    message: 'Suspicious activity detected. Access temporarily restricted.',
    error: 'SUSPICIOUS_ACTIVITY_DETECTED',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip if user is authenticated and verified
    return req.user && req.user.isVerified;
  },
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    console.error(`🚨 SECURITY ALERT: Suspicious activity from IP ${req.ip}`);
    console.error(`🔍 Request details: ${req.method} ${req.originalUrl}`);
    console.error(`🔍 User Agent: ${req.get('User-Agent')}`);
    
    // TODO: Send security alert to administrators
    // TODO: Log to security monitoring system
    
    res.status(429).json({
      success: false,
      message: 'Suspicious activity detected. Access temporarily restricted.',
      error: 'SUSPICIOUS_ACTIVITY_DETECTED',
      retryAfter: '5 minutes'
    });
  }
});

// API endpoint protection
const apiProtectionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    // Different limits based on endpoint sensitivity
    if (req.originalUrl.includes('/admin')) {
      return 10; // Very strict for admin endpoints
    }
    if (req.originalUrl.includes('/biometric')) {
      return 5; // Strict for biometric endpoints
    }
    if (req.originalUrl.includes('/export')) {
      return 3; // Very strict for export endpoints
    }
    return 60; // Default limit
  },
  message: {
    success: false,
    message: 'API rate limit exceeded for this endpoint.',
    error: 'API_ENDPOINT_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => {
    return req.user?.id ? `api-${req.user.id}-${req.route?.path}` : `api-${req.ip}-${req.route?.path}`;
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  registerLimiter,
  attendanceLimiter,
  biometricLimiter,
  reportLimiter,
  uploadLimiter,
  createUserLimiter,
  intelligentLimiter,
  suspiciousActivityLimiter,
  apiProtectionLimiter
};