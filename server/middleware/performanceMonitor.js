const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.queries = [];
    this.slowQueryThreshold = 100; // 100ms
  }

  // Monitor query performance
  monitorQuery(operation, startTime) {
    const duration = performance.now() - startTime;
    
    const queryInfo = {
      operation,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      timestamp: new Date().toISOString(),
      isSlow: duration > this.slowQueryThreshold
    };

    this.queries.push(queryInfo);

    // Log slow queries
    if (queryInfo.isSlow) {
      console.warn(`🐌 Slow query detected: ${operation} took ${queryInfo.duration}ms`);
    } else {
      console.log(`⚡ Query: ${operation} completed in ${queryInfo.duration}ms`);
    }

    // Keep only last 100 queries in memory
    if (this.queries.length > 100) {
      this.queries.shift();
    }

    return queryInfo;
  }

  // Get performance statistics
  getStats() {
    if (this.queries.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        fastestQuery: null,
        slowestQuery: null
      };
    }

    const durations = this.queries.map(q => q.duration);
    const slowQueries = this.queries.filter(q => q.isSlow);

    return {
      totalQueries: this.queries.length,
      averageDuration: Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100,
      slowQueries: slowQueries.length,
      slowQueryPercentage: Math.round((slowQueries.length / this.queries.length) * 100),
      fastestQuery: {
        duration: Math.min(...durations),
        operation: this.queries.find(q => q.duration === Math.min(...durations))?.operation
      },
      slowestQuery: {
        duration: Math.max(...durations),
        operation: this.queries.find(q => q.duration === Math.max(...durations))?.operation
      },
      recentQueries: this.queries.slice(-10) // Last 10 queries
    };
  }

  // Middleware to monitor request performance
  requestMonitor() {
    return (req, res, next) => {
      const startTime = performance.now();
      
      // Override res.json to capture response time
      const originalJson = res.json;
      res.json = function(data) {
        const duration = performance.now() - startTime;
        
        // Add performance headers
        res.set('X-Response-Time', `${Math.round(duration * 100) / 100}ms`);
        
        // Log slow requests
        if (duration > 1000) { // 1 second threshold for requests
          console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} took ${Math.round(duration)}ms`);
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    };
  }

  // Database connection monitoring
  monitorDatabaseHealth() {
    return async (req, res, next) => {
      const startTime = performance.now();
      
      try {
        // Simple health check query
        if (req.prisma) {
          await req.prisma.$queryRaw`SELECT 1 as health_check`;
        }
        const duration = performance.now() - startTime;
        
        if (duration > 50) { // 50ms threshold for health check
          console.warn(`🩺 Database health check slow: ${Math.round(duration)}ms`);
        }
        
        // Add database health to request object
        req.dbHealth = {
          status: 'healthy',
          responseTime: Math.round(duration * 100) / 100
        };
      } catch (error) {
        console.error('🚨 Database health check failed:', error);
        req.dbHealth = {
          status: 'unhealthy',
          error: error.message
        };
      }
      
      next();
    };
  }

  // Get performance report endpoint
  getReportEndpoint() {
    return (req, res) => {
      const stats = this.getStats();
      
      res.json({
        success: true,
        performance: {
          ...stats,
          thresholds: {
            slowQuery: this.slowQueryThreshold,
            slowRequest: 1000
          },
          recommendations: this.getRecommendations(stats)
        }
      });
    };
  }

  // Generate performance recommendations
  getRecommendations(stats) {
    const recommendations = [];

    if (stats.slowQueryPercentage > 20) {
      recommendations.push({
        type: 'database',
        severity: 'high',
        message: 'High percentage of slow queries detected. Consider adding database indexes or optimizing query patterns.',
        action: 'Review and optimize database queries'
      });
    }

    if (stats.averageDuration > 200) {
      recommendations.push({
        type: 'database',
        severity: 'medium',
        message: 'Average query duration is high. Consider implementing query caching or optimization.',
        action: 'Implement query caching and optimization'
      });
    }

    if (stats.slowQueries > 10) {
      recommendations.push({
        type: 'monitoring',
        severity: 'medium',
        message: 'Multiple slow queries detected. Enable detailed query logging for analysis.',
        action: 'Enable detailed query logging'
      });
    }

    return recommendations;
  }

  // Clear performance data
  clearStats() {
    this.queries = [];
    console.log('🧹 Performance statistics cleared');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;