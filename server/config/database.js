/**
 * Enhanced Database Configuration with Connection Pooling
 * Supports both SQLite (development) and PostgreSQL (production)
 */

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;

// Connection pool configuration
const poolConfig = {
  min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
  max: parseInt(process.env.DATABASE_POOL_MAX) || 10,
  idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_CONNECTION_TIMEOUT) || 10000,
  allowExitOnIdle: true
};

// PostgreSQL pool (only for PostgreSQL)
let pgPool = null;

// Prisma client configuration
const prismaConfig = {
  log: NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  errorFormat: 'pretty',
};

// Add connection pool for PostgreSQL
if (DATABASE_URL && DATABASE_URL.includes('postgresql')) {
  prismaConfig.datasources = {
    db: {
      url: DATABASE_URL
    }
  };
  
  // Create PostgreSQL connection pool
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    ...poolConfig,
    ssl: process.env.POSTGRES_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });
  
  // Pool event handlers
  pgPool.on('connect', (client) => {
    console.log('🔗 New PostgreSQL client connected');
  });
  
  pgPool.on('remove', (client) => {
    console.log('🔌 PostgreSQL client removed from pool');
  });
  
  pgPool.on('error', (err, client) => {
    console.error('💥 Unexpected error on idle PostgreSQL client:', err.message);
  });
}

// Initialize Prisma client
const prisma = new PrismaClient(prismaConfig);

/**
 * Enhanced database connection function
 */
const connectDB = async () => {
  try {
    // Test Prisma connection
    await prisma.$connect();
    
    // Determine database type
    const dbType = DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite';
    
    console.log(`✅ ${dbType} Database connected successfully`);
    
    // Test PostgreSQL pool if available
    if (pgPool) {
      const client = await pgPool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log(`🏊 PostgreSQL connection pool initialized (${poolConfig.min}-${poolConfig.max} connections)`);
      console.log(`🕐 Database time: ${result.rows[0].now}`);
    }
    
    // Database health check
    await performHealthCheck();
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    
    // Additional error context
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure your database server is running');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Check your database host configuration');
    } else if (error.code === '28P01') {
      console.error('💡 Check your database credentials');
    }
    
    process.exit(1);
  }
};

/**
 * Database health check
 */
const performHealthCheck = async () => {
  try {
    // Simple query to test connectivity
    const result = await prisma.$queryRaw`SELECT 1 as health_check`;
    
    if (result && result.length > 0) {
      console.log('💚 Database health check passed');
      return true;
    } else {
      throw new Error('Health check query returned no results');
    }
  } catch (error) {
    console.error('💔 Database health check failed:', error.message);
    throw error;
  }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  try {
    const stats = {};
    
    if (pgPool) {
      stats.postgresql = {
        totalConnections: pgPool.totalCount,
        idleConnections: pgPool.idleCount,
        waitingClients: pgPool.waitingCount,
        poolConfig: poolConfig
      };
    }
    
    // Get Prisma metrics if available
    try {
      const metrics = await prisma.$metrics.json();
      stats.prisma = metrics;
    } catch (error) {
      // Metrics might not be available in all Prisma versions
      stats.prisma = { error: 'Metrics not available' };
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error.message);
    return { error: error.message };
  }
};

/**
 * Gracefully disconnect from database
 */
const disconnectDB = async () => {
  try {
    console.log('🔌 Disconnecting from database...');
    
    // Close Prisma connection
    await prisma.$disconnect();
    
    // Close PostgreSQL pool
    if (pgPool) {
      await pgPool.end();
      console.log('🏊 PostgreSQL connection pool closed');
    }
    
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error.message);
  }
};

/**
 * Execute raw SQL query with connection pooling
 */
const executeRawQuery = async (query, params = []) => {
  if (pgPool) {
    // Use PostgreSQL pool for better performance
    const client = await pgPool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  } else {
    // Fallback to Prisma for SQLite
    return await prisma.$queryRawUnsafe(query, ...params);
  }
};

/**
 * Transaction wrapper with retry logic
 */
const executeTransaction = async (operations, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await prisma.$transaction(operations);
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, retries) * 1000;
      console.warn(`Transaction failed, retrying in ${delay}ms... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Database maintenance utilities
 */
const maintenance = {
  // Analyze database performance
  analyze: async () => {
    if (pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query('ANALYZE');
        console.log('📊 Database analysis completed');
      } finally {
        client.release();
      }
    }
  },
  
  // Vacuum database (PostgreSQL only)
  vacuum: async () => {
    if (pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query('VACUUM ANALYZE');
        console.log('🧹 Database vacuum completed');
      } finally {
        client.release();
      }
    }
  },
  
  // Get database size
  getSize: async () => {
    if (pgPool) {
      const client = await pgPool.connect();
      try {
        const result = await client.query(`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `);
        return result.rows[0].size;
      } finally {
        client.release();
      }
    } else {
      return 'Size check not available for SQLite';
    }
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, closing database connections...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, closing database connections...');
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  prisma,
  pgPool,
  connectDB,
  disconnectDB,
  performHealthCheck,
  getDatabaseStats,
  executeRawQuery,
  executeTransaction,
  maintenance
};