// API wrapper that provides offline caching capabilities
// Automatically caches API responses and serves cached data when offline


import offlineDataCacheService from './offlineDataCacheService';

// Utility to generate a cache key for a given URL (simple hash or encode)
function getCacheKey(url: string): string {
  // Simple base64 encoding for uniqueness; customize as needed
  return btoa(unescape(encodeURIComponent(url)));
}

// Helper to check if we're online
const isOnline = (): boolean => navigator.onLine;

// Generic cache-first API wrapper
export class OfflineApiWrapper {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '', headers: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = headers;
  }

  // Enhanced fetch with offline caching
  async fetchWithCache(
    url: string,
    options: RequestInit = {},
    cacheOptions: {
      maxAge?: number; // Cache max age in milliseconds
      cacheKey?: string; // Custom cache key
      skipCache?: boolean; // Skip cache completely
      offlineOnly?: boolean; // Only return cached data
    } = {}
  ): Promise<unknown> {
    const {
      cacheKey,
      skipCache = false,
      offlineOnly = false
    } = cacheOptions;

    const method = options.method || 'GET';
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const finalCacheKey = cacheKey || getCacheKey(fullUrl);

    // If offline only, return cached data immediately
    if (offlineOnly) {
      const cachedData = await offlineDataCacheService.getCachedApiResponse(finalCacheKey, method);
      if (cachedData) {
        return cachedData;
      }
      throw new Error('No cached data available for offline access');
    }

    // If skipCache is true, go directly to network
    if (!skipCache) {
      // Try cache first for GET requests
      if (method === 'GET') {
        const cachedData = await offlineDataCacheService.getCachedApiResponse(finalCacheKey, method);
        if (cachedData) {
          // If online, check if cache is still fresh
          if (isOnline()) {
            // If cache is fresh, return it
            // If cache is stale, continue to network request but return cache as fallback
          } else {
            // If offline, return cached data regardless of age
            console.log(`📦 Returning cached data for ${fullUrl} (offline)`);
            return cachedData;
          }
        }
      }
    }

    // If offline and no cache, throw error
    if (!isOnline() && method === 'GET') {
      const cachedData = await offlineDataCacheService.getCachedApiResponse(finalCacheKey, method);
      if (cachedData) {
        console.log(`📦 Returning stale cached data for ${fullUrl} (offline)`);
        return cachedData;
      }
      throw new Error(`No cached data available for ${fullUrl} and device is offline`);
    }

    // Make network request
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful GET responses
      if (method === 'GET' && !skipCache) {
        await offlineDataCacheService.cacheApiResponse(finalCacheKey, method, data);
      }

      return data;
    } catch (error) {
      console.error(`❌ Network request failed for ${fullUrl}:`, error);

      // If network fails, try to return cached data as fallback
      if (method === 'GET') {
        const cachedData = await offlineDataCacheService.getCachedApiResponse(finalCacheKey, method);
        if (cachedData) {
          console.log(`📦 Returning cached data as fallback for ${fullUrl}`);
          return cachedData;
        }
      }

      throw error;
    }
  }

  // Convenience methods for different HTTP verbs
  async get(
    url: string,
    params?: Record<string, unknown>,
    cacheOptions?: Record<string, unknown>
  ): Promise<unknown> {
    const urlWithParams = params ? `${url}?${new URLSearchParams(params as Record<string, string>)}` : url;
    return this.fetchWithCache(urlWithParams, { method: 'GET' }, cacheOptions);
  }

  async post(url: string, data?: unknown, options: RequestInit = {}): Promise<unknown> {
    return this.fetchWithCache(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    }, { skipCache: true }); // Don't cache POST requests
  }

  async put(url: string, data?: unknown, options: RequestInit = {}): Promise<unknown> {
    return this.fetchWithCache(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    }, { skipCache: true }); // Don't cache PUT requests
  }

  async delete(url: string, options: RequestInit = {}): Promise<unknown> {
    return this.fetchWithCache(url, {
      method: 'DELETE',
      ...options
    }, { skipCache: true }); // Don't cache DELETE requests
  }

  // Special method for offline-only data retrieval
  async getOfflineOnly(url: string, params?: Record<string, unknown>): Promise<unknown> {
    const urlWithParams = params ? `${url}?${new URLSearchParams(params as Record<string, string>)}` : url;
    return this.fetchWithCache(urlWithParams, { method: 'GET' }, { offlineOnly: true });
  }
}


// Enhanced API services with offline capabilities
// Define a specific Employee type
export interface Employee {
  id: string;
  name: string;
  email: string;
  position?: string;
  [key: string]: unknown; // Add more fields as needed
}

// Define EmployeeCacheData type for cached employees
export interface EmployeeCacheData extends Partial<Employee> {
  id: string;
  organizationId: string;
}

// Define OrganizationCacheData for cached organizations
export interface OrganizationCacheData extends Record<string, unknown> {
  id: string;
  name?: string;
}

// Define AnalyticsCacheData for cached analytics
export interface AnalyticsCacheData extends Record<string, unknown> {
  id: string;
  organizationId: string;
  type: string;
  dateRange: string;
}

export class OfflineEmployeeService extends OfflineApiWrapper {
  constructor() {
    super('/api', {
      'Content-Type': 'application/json'
    });
  }

  async getEmployees(organizationId: string): Promise<Employee[]> {
    // Try to get from cache first if offline
    if (!isOnline()) {
      const cachedEmployees = await offlineDataCacheService.getCachedEmployees(organizationId);
      if (cachedEmployees) {
        // Ensure cached data matches Employee type (add default name/email if missing)
        return cachedEmployees.map((emp: EmployeeCacheData): Employee => ({
          ...emp,
          id: emp.id,
          name: emp.name || '',
          email: emp.email || '',
          position: emp.position
        }));
      }
    }

    try {
      const employees = await this.get(`/employees`, { organizationId }) as Employee[];
      // Cache the employee data (convert to EmployeeCacheData[])
      const employeesForCache: EmployeeCacheData[] = employees.map((emp) => ({
        ...emp,
        organizationId
      }));
      await offlineDataCacheService.cacheEmployeeData(organizationId, employeesForCache);
      return employees;
    } catch (error) {
      // Fallback to cached data
      const cachedEmployees = await offlineDataCacheService.getCachedEmployees(organizationId);
      if (cachedEmployees) {
        console.log('📦 Using cached employees as fallback');
        return cachedEmployees.map((emp: EmployeeCacheData): Employee => ({
          ...emp,
          id: emp.id,
          name: emp.name || '',
          email: emp.email || '',
          position: emp.position
        }));
      }
      throw error;
    }
  }

  async getEmployee(employeeId: string): Promise<Employee | undefined> {
    return this.get(`/employees/${employeeId}`, undefined, {
      maxAge: 60 * 60 * 1000, // 1 hour cache
      cacheKey: `employee-${employeeId}`
    }) as Promise<Employee | undefined>;
  }

  async createEmployee(employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const result = await this.post('/employees', employeeData);
    // Invalidate employee cache for this organization
    // This could be enhanced to update the cache instead of invalidating
    return result as Employee | undefined;
  }

  async updateEmployee(employeeId: string, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const result = await this.put(`/employees/${employeeId}`, employeeData);
    // Update cached employee data
    // This could be enhanced to update the specific employee in cache
    return result as Employee | undefined;
  }
}

export class OfflineOrganizationService extends OfflineApiWrapper {
  constructor() {
    super('/api', {
      'Content-Type': 'application/json'
    });
  }

  async getOrganization(organizationId: string): Promise<Record<string, unknown> | undefined> {
    // Try to get from cache first if offline
    if (!isOnline()) {
      const cachedOrg = await offlineDataCacheService.getCachedOrganization(organizationId);
      if (cachedOrg) {
        return cachedOrg;
      }
    }

    try {
      const organization = await this.get(`/organizations/${organizationId}`);
      // Cache the organization data
      await offlineDataCacheService.cacheOrganizationData(organizationId, organization as OrganizationCacheData);
      return organization as Record<string, unknown>;
    } catch (error) {
      // Fallback to cached data
      const cachedOrg = await offlineDataCacheService.getCachedOrganization(organizationId);
      if (cachedOrg) {
        console.log('📦 Using cached organization as fallback');
        return cachedOrg;
      }
      throw error;
    }
  }

  async getOrganizationSettings(organizationId: string): Promise<Record<string, unknown> | undefined> {
    return this.get(`/organizations/${organizationId}/settings`, undefined, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hour cache
      cacheKey: `org-settings-${organizationId}`
    }) as Promise<Record<string, unknown> | undefined>;
  }
}

export class OfflineAnalyticsService extends OfflineApiWrapper {
  constructor() {
    super('/api', {
      'Content-Type': 'application/json'
    });
  }

  async getAnalyticsData(
    organizationId: string, 
    type: string, 
    dateRange: string
  ): Promise<Record<string, unknown> | undefined> {
    // Try to get from cache first if offline
    if (!isOnline()) {
      const cachedAnalytics = await offlineDataCacheService.getCachedAnalytics(
        organizationId, 
        type, 
        dateRange
      );
      if (cachedAnalytics) {
        return cachedAnalytics;
      }
    }

    try {
      const analytics = await this.get('/analytics', {
        organizationId,
        type,
        dateRange
      });
      
      // Cache the analytics data
      // Ensure analytics object has an 'id' property for cache compatibility
      const analyticsForCache: AnalyticsCacheData = {
        ...(analytics as Record<string, unknown>),
        id: `${organizationId}-${type}-${dateRange}`,
        organizationId,
        type,
        dateRange
      };
      await offlineDataCacheService.cacheAnalyticsData(
        organizationId, 
        type, 
        dateRange, 
        analyticsForCache
      );
      return analytics as Record<string, unknown>;
    } catch (error) {
      // Fallback to cached data
      const cachedAnalytics = await offlineDataCacheService.getCachedAnalytics(
        organizationId, 
        type, 
        dateRange
      );
      if (cachedAnalytics) {
        console.log('📦 Using cached analytics as fallback');
        return cachedAnalytics;
      }
      throw error;
    }
  }

  async getAttendanceReport(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown> | undefined> {
    const dateRange = `${startDate}-${endDate}`;
    return this.getAnalyticsData(organizationId, 'attendance-report', dateRange);
  }
}

// Create service instances
export const offlineEmployeeService = new OfflineEmployeeService();
export const offlineOrganizationService = new OfflineOrganizationService();
export const offlineAnalyticsService = new OfflineAnalyticsService();

// Generic API wrapper instance
export const offlineApiWrapper = new OfflineApiWrapper();