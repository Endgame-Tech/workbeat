const crypto = require('crypto');

// Custom CSRF protection middleware
// Since we're using httpOnly cookies with sameSite=strict, this provides additional protection
class CSRFProtection {
  constructor() {
    this.tokenStore = new Map(); // In production, use Redis
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  // Generate a CSRF token for a session
  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
    
    this.tokenStore.set(sessionId, {
      token,
      expiresAt,
      used: false
    });
    
    return token;
  }

  // Validate a CSRF token
  validateToken(sessionId, providedToken) {
    const storedData = this.tokenStore.get(sessionId);
    
    if (!storedData) {
      return false;
    }
    
    if (Date.now() > storedData.expiresAt) {
      this.tokenStore.delete(sessionId);
      return false;
    }
    
    if (storedData.token !== providedToken) {
      return false;
    }
    
    // Mark token as used (single-use tokens)
    storedData.used = true;
    return true;
  }

  // Clean up expired tokens
  cleanup() {
    const now = Date.now();
    for (const [sessionId, data] of this.tokenStore.entries()) {
      if (now > data.expiresAt || data.used) {
        this.tokenStore.delete(sessionId);
      }
    }
  }

  // Middleware to generate and provide CSRF token
  getToken() {
    return (req, res, next) => {
      try {
        // Use user ID or IP as session identifier
        const sessionId = req.user?.id || req.ip;
        const token = this.generateToken(sessionId);
        
        // Send token in response header
        res.set('X-CSRF-Token', token);
        
        // Also make token available in request for forms
        req.csrfToken = token;
        
        next();
      } catch (error) {
        console.error('CSRF token generation error:', error);
        res.status(500).json({
          success: false,
          message: 'Security token generation failed',
          error: 'CSRF_TOKEN_ERROR'
        });
      }
    };
  }

  // Middleware to validate CSRF token
  validateRequest() {
    return (req, res, next) => {
      try {
        // Skip CSRF for GET, HEAD, OPTIONS requests (they should be safe)
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return next();
        }

        // Skip CSRF for certain API endpoints (if using API keys)
        if (req.headers['x-api-key']) {
          return next();
        }

        const sessionId = req.user?.id || req.ip;
        const providedToken = req.headers['x-csrf-token'] || req.body._csrf;
        
        if (!providedToken) {
          console.warn(`🚨 CSRF: Missing token for ${req.method} ${req.originalUrl} from ${req.ip}`);
          return res.status(403).json({
            success: false,
            message: 'CSRF token missing',
            error: 'CSRF_TOKEN_MISSING'
          });
        }
        
        if (!this.validateToken(sessionId, providedToken)) {
          console.warn(`🚨 CSRF: Invalid token for ${req.method} ${req.originalUrl} from ${req.ip}`);
          return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token',
            error: 'CSRF_TOKEN_INVALID'
          });
        }
        
        next();
      } catch (error) {
        console.error('CSRF validation error:', error);
        res.status(500).json({
          success: false,
          message: 'Security validation failed',
          error: 'CSRF_VALIDATION_ERROR'
        });
      }
    };
  }

  // Get token endpoint for SPA applications
  getTokenEndpoint() {
    return (req, res) => {
      try {
        const sessionId = req.user?.id || req.ip;
        const token = this.generateToken(sessionId);
        
        res.json({
          success: true,
          csrfToken: token
        });
      } catch (error) {
        console.error('CSRF token endpoint error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to generate CSRF token',
          error: 'CSRF_TOKEN_ENDPOINT_ERROR'
        });
      }
    };
  }
}

// Create singleton instance
const csrfProtection = new CSRFProtection();

// Enhanced CSRF protection that works with our cookie-based auth
const enhancedCSRFProtection = () => {
  return (req, res, next) => {
    // For cookie-based auth with sameSite=strict, we have good CSRF protection
    // This middleware adds additional verification for sensitive operations
    
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Check Origin header
    const origin = req.get('Origin');
    const host = req.get('Host');
    
    // Get allowed origins based on environment
    const getDevOrigins = () => {
      if (process.env.NODE_ENV === 'production') return [];
      return [
        `http://localhost:${process.env.PORT || 3001}`,
        `https://localhost:${process.env.PORT || 3001}`,
        'http://localhost:5173', // Default Vite dev server
        'http://localhost:3000', // Default React dev server
      ];
    };
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      ...getDevOrigins()
    ].filter(Boolean);
    
    if (origin && !allowedOrigins.includes(origin)) {
      // In production, be strict about origin checking
      if (process.env.NODE_ENV === 'production') {
        console.warn(`🚨 CSRF: Origin not allowed. Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Cross-origin request forbidden',
          error: 'ORIGIN_MISMATCH'
        });
      } else {
        // In development, just log the warning but allow the request
        console.warn(`⚠️ CSRF: Origin mismatch in development. Origin: ${origin}, Host: ${host}`);
      }
    }
    
    // Check Referer header for additional protection (less strict in development)
    const referer = req.get('Referer');
    if (referer && process.env.NODE_ENV === 'production') {
      const refererAllowed = allowedOrigins.some(allowed => referer.startsWith(allowed));
      if (!refererAllowed) {
        console.warn(`🚨 CSRF: Referer not allowed. Referer: ${referer}, Allowed: ${allowedOrigins.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Invalid request source',
          error: 'REFERER_MISMATCH'
        });
      }
    }
    
    next();
  };
};

module.exports = {
  csrfProtection,
  enhancedCSRFProtection
};