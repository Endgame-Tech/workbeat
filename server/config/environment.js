/**
 * Environment Configuration Manager
 * Handles different environment settings and validates configuration
 */

const dotenv = require('dotenv');
const path = require('path');

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment-specific .env file
const envFile = `.env.${NODE_ENV}`;
const envPath = path.join(__dirname, '..', envFile);

console.log(`🌍 Loading environment: ${NODE_ENV}`);
console.log(`📄 Environment file: ${envFile}`);

// Load the environment file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`⚠️  Could not load ${envFile}, falling back to .env`);
  // Fallback to default .env file
  dotenv.config();
}

/**
 * Environment configuration object
 */
const config = {
  // Application settings
  app: {
    name: 'WorkBeat API',
    version: process.env.npm_package_version || '1.0.0',
    env: NODE_ENV,
    port: parseInt(process.env.PORT) || 5000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    baseUrl: process.env.APP_URL || (NODE_ENV === 'production' ? undefined : `http://localhost:${parseInt(process.env.PORT) || 5000}`)
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
      max: parseInt(process.env.DATABASE_POOL_MAX) || 10,
      idleTimeout: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT) || 30000,
      connectionTimeout: parseInt(process.env.DATABASE_POOL_CONNECTION_TIMEOUT) || 10000
    },
    ssl: process.env.POSTGRES_SSL === 'true'
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_development_only',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // File upload configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50mb',
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ]
  },

  // Feature flags
  features: {
    biometricAuth: process.env.ENABLE_BIOMETRIC_AUTH === 'true',
    facialRecognition: process.env.ENABLE_FACIAL_RECOGNITION === 'true',
    fingerprintAuth: process.env.ENABLE_FINGERPRINT_AUTH === 'true',
    geofencing: process.env.ENABLE_GEOFENCING === 'true',
    twoFactorAuth: process.env.ENABLE_TWO_FACTOR_AUTH === 'true'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/workbeat.log'
  },

  // Email configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    secure: process.env.SMTP_SECURE === 'true'
  },

  // AWS configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET
  },

  // SSL/TLS configuration
  ssl: {
    enabled: process.env.FORCE_HTTPS === 'true',
    keyPath: process.env.SSL_KEY_PATH,
    certPath: process.env.SSL_CERT_PATH,
    caPath: process.env.SSL_CA_PATH
  },

  // Monitoring configuration
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    sentryDsn: process.env.SENTRY_DSN,
    analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true'
  },

  // Backup configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
  }
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  const errors = [];

  // Production-specific validations
  if (NODE_ENV === 'production') {
    if (!config.jwt.secret || config.jwt.secret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }

    if (!config.security.sessionSecret || config.security.sessionSecret.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters in production');
    }

    if (config.database.url.includes('file:')) {
      errors.push('SQLite database should not be used in production');
    }

    if (!config.ssl.enabled) {
      console.warn('⚠️  HTTPS is not enabled in production');
    }
  }

  // General validations
  if (!config.app.port || isNaN(config.app.port)) {
    errors.push('PORT must be a valid number');
  }

  if (config.database.pool.min > config.database.pool.max) {
    errors.push('DATABASE_POOL_MIN cannot be greater than DATABASE_POOL_MAX');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('✅ Configuration validation passed');
}

/**
 * Get database type from URL
 */
function getDatabaseType() {
  if (config.database.url.includes('postgresql')) {
    return 'postgresql';
  } else if (config.database.url.includes('mysql')) {
    return 'mysql';
  } else if (config.database.url.includes('file:')) {
    return 'sqlite';
  } else {
    return 'unknown';
  }
}

/**
 * Print configuration summary
 */
function printConfigSummary() {
  console.log('📋 Configuration Summary:');
  console.log(`   Environment: ${config.app.env}`);
  console.log(`   Port: ${config.app.port}`);
  console.log(`   Database: ${getDatabaseType()}`);
  console.log(`   Database URL: ${config.database.url}`);
  console.log(`   Features: Biometric(${config.features.biometricAuth}), 2FA(${config.features.twoFactorAuth})`);
  console.log(`   Security: Rate limiting(${config.security.rateLimitMaxRequests} req/${config.security.rateLimitWindowMs}ms)`);
  
  if (NODE_ENV === 'development') {
    console.log('🔧 Development mode - additional debugging enabled');
  } else if (NODE_ENV === 'production') {
    console.log('🚀 Production mode - optimized for performance');
  }
}

// Validate configuration on load
validateConfig();

// Print summary in development mode
if (NODE_ENV === 'development') {
  printConfigSummary();
}

module.exports = config;