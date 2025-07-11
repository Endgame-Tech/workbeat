const { prisma } = require('../config/db');

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Cache key generator
  generateCacheKey(model, operation, params) {
    return `${model}_${operation}_${JSON.stringify(params)}`;
  }

  // Check if cache entry is valid
  isCacheValid(entry) {
    return Date.now() - entry.timestamp < this.cacheTimeout;
  }

  // Get from cache or execute query
  async cachedQuery(model, operation, params) {
    const cacheKey = this.generateCacheKey(model, operation, params);
    const cached = this.queryCache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      console.log(`📦 Cache hit for ${cacheKey}`);
      return cached.data;
    }

    console.log(`🔍 Cache miss for ${cacheKey}, executing query`);
    const result = await prisma[model][operation](params);
    
    this.queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  // Optimized attendance records with employee data
  async getOptimizedAttendanceRecords(filters) {
    const { organizationId, page = 1, limit = 100, ...otherFilters } = filters;
    const skip = (page - 1) * limit;

    try {
      // Single optimized query with proper includes
      const [records, total] = await Promise.all([
        prisma.attendance.findMany({
          where: {
            organizationId,
            ...otherFilters
          },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                department: true,
                position: true,
                email: true
              }
            }
          }
        }),
        prisma.attendance.count({
          where: {
            organizationId,
            ...otherFilters
          }
        })
      ]);

      return {
        records: records.map(record => ({
          ...record,
          _id: String(record.id),
          employeeId: String(record.employeeId),
          organizationId: String(record.organizationId),
          employee: record.employee ? {
            ...record.employee,
            id: String(record.employee.id),
            name: record.employee.name || `${record.employee.firstName} ${record.employee.lastName}`.trim()
          } : null
        })),
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      };
    } catch (error) {
      console.error('Optimized attendance query failed:', error);
      throw error;
    }
  }

  // Optimized employee list with attendance stats
  async getOptimizedEmployeeList(organizationId, filters = {}) {
    try {
      // Get employees with aggregated attendance data in a single query
      const employees = await prisma.employee.findMany({
        where: {
          organizationId,
          ...filters
        },
        orderBy: { firstName: 'asc' },
        include: {
          _count: {
            select: {
              attendances: {
                where: {
                  timestamp: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
                  }
                }
              }
            }
          },
          attendances: {
            take: 1,
            orderBy: { timestamp: 'desc' },
            select: {
              timestamp: true,
              type: true,
              isLate: true
            }
          }
        }
      });

      return employees.map(employee => ({
        ...employee,
        id: String(employee.id),
        organizationId: String(employee.organizationId),
        attendanceThisMonth: employee._count.attendances,
        lastAttendance: employee.attendances[0] || null,
        _count: undefined,
        attendances: undefined
      }));
    } catch (error) {
      console.error('Optimized employee query failed:', error);
      throw error;
    }
  }

  // Optimized organization dashboard stats
  async getOptimizedDashboardStats(organizationId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    try {
      // Execute all statistics queries in parallel
      const [
        totalEmployees,
        activeEmployees,
        todayAttendance,
        monthlyAttendance,
        lateArrivals,
        earlyDepartures,
        departmentStats
      ] = await Promise.all([
        // Total employees
        prisma.employee.count({
          where: { organizationId, isActive: true }
        }),
        
        // Active employees (those who attended today)
        prisma.attendance.groupBy({
          by: ['employeeId'],
          where: {
            organizationId,
            timestamp: { gte: startOfDay },
            type: 'sign-in'
          }
        }).then(result => result.length),

        // Today's attendance records
        prisma.attendance.count({
          where: {
            organizationId,
            timestamp: { gte: startOfDay }
          }
        }),

        // Monthly attendance
        prisma.attendance.count({
          where: {
            organizationId,
            timestamp: { gte: startOfMonth }
          }
        }),

        // Late arrivals today
        prisma.attendance.count({
          where: {
            organizationId,
            timestamp: { gte: startOfDay },
            type: 'sign-in',
            isLate: true
          }
        }),

        // Early departures today
        prisma.attendance.count({
          where: {
            organizationId,
            timestamp: { gte: startOfDay },
            type: 'sign-out',
            isEarly: true
          }
        }),

        // Department-wise stats
        prisma.employee.groupBy({
          by: ['department'],
          where: { organizationId, isActive: true },
          _count: { id: true }
        })
      ]);

      return {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          attendance_rate: totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(1) : 0
        },
        attendance: {
          today: todayAttendance,
          monthly: monthlyAttendance,
          late_arrivals: lateArrivals,
          early_departures: earlyDepartures
        },
        departments: departmentStats.map(dept => ({
          name: dept.department || 'Unassigned',
          employee_count: dept._count.id
        }))
      };
    } catch (error) {
      console.error('Optimized dashboard stats failed:', error);
      throw error;
    }
  }

  // Batch operations for multiple queries
  async batchQueries(operations) {
    try {
      const results = await Promise.all(operations);
      return results;
    } catch (error) {
      console.error('Batch query failed:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.queryCache.clear();
    console.log('🧹 Query cache cleared');
  }

  // Clear expired cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.queryCache.delete(key);
      }
    }
  }
}

// Create singleton instance
const queryOptimizer = new QueryOptimizer();

// Clean up cache periodically
setInterval(() => {
  queryOptimizer.cleanupCache();
}, 60000); // Every minute

module.exports = queryOptimizer;