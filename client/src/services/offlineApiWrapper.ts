// API wrapper that provides offline caching capabilities
// Automatically caches API responses and serves cached data when offline

import offlineDataCacheService from './offlineDataCacheService';

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
  ): Promise<any> {
    const {
      maxAge = 30 * 60 * 1000, // 30 minutes default
      cacheKey,
      skipCache = false,
      offlineOnly = false
    } = cacheOptions;

    const method = options.method || 'GET';
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const finalCacheKey = cacheKey || offlineDataCacheService.getCacheKey(fullUrl);

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
  async get(url: string, params?: Record<string, any>, cacheOptions?: any): Promise<any> {
    const urlWithParams = params ? `${url}?${new URLSearchParams(params)}` : url;
    return this.fetchWithCache(urlWithParams, { method: 'GET' }, cacheOptions);
  }

  async post(url: string, data?: any, options: RequestInit = {}): Promise<any> {
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

  async put(url: string, data?: any, options: RequestInit = {}): Promise<any> {
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

  async delete(url: string, options: RequestInit = {}): Promise<any> {
    return this.fetchWithCache(url, {
      method: 'DELETE',
      ...options
    }, { skipCache: true }); // Don't cache DELETE requests
  }

  // Special method for offline-only data retrieval
  async getOfflineOnly(url: string, params?: Record<string, any>): Promise<any> {
    const urlWithParams = params ? `${url}?${new URLSearchParams(params)}` : url;
    return this.fetchWithCache(urlWithParams, { method: 'GET' }, { offlineOnly: true });
  }
}

// Enhanced API services with offline capabilities
export class OfflineEmployeeService extends OfflineApiWrapper {
  constructor() {
    super('/api', {
      'Content-Type': 'application/json'
    });
  }

  async getEmployees(organizationId: string): Promise<any[]> {
    // Try to get from cache first if offline
    if (!isOnline()) {
      const cachedEmployees = await offlineDataCacheService.getCachedEmployees(organizationId);
      if (cachedEmployees) {
        return cachedEmployees;
      }
    }

    try {
      const employees = await this.get(`/employees`, { organizationId });
      
      // Cache the employee data
      await offlineDataCacheService.cacheEmployeeData(organizationId, employees);
      
      return employees;
    } catch (error) {
      // Fallback to cached data
      const cachedEmployees = await offlineDataCacheService.getCachedEmployees(organizationId);
      if (cachedEmployees) {
        console.log('📦 Using cached employees as fallback');
        return cachedEmployees;
      }
      throw error;
    }
  }

  async getEmployee(employeeId: string): Promise<any> {
    return this.get(`/employees/${employeeId}`, undefined, {
      maxAge: 60 * 60 * 1000, // 1 hour cache
      cacheKey: `employee-${employeeId}`
    });
  }

  async createEmployee(employeeData: any): Promise<any> {
    const result = await this.post('/employees', employeeData);
    
    // Invalidate employee cache for this organization
    // This could be enhanced to update the cache instead of invalidating
    return result;
  }

  async updateEmployee(employeeId: string, employeeData: any): Promise<any> {
    const result = await this.put(`/employees/${employeeId}`, employeeData);
    
    // Update cached employee data
    // This could be enhanced to update the specific employee in cache
    return result;
  }
}

export class OfflineOrganizationService extends OfflineApiWrapper {
  constructor() {
    super('/api', {
      'Content-Type': 'application/json'
    });
  }

  async getOrganization(organizationId: string): Promise<any> {
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
      await offlineDataCacheService.cacheOrganizationData(organizationId, organization);
      
      return organization;
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

  async getOrganizationSettings(organizationId: string): Promise<any> {
    return this.get(`/organizations/${organizationId}/settings`, undefined, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hour cache
      cacheKey: `org-settings-${organizationId}`
    });
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
  ): Promise<any> {
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
      await offlineDataCacheService.cacheAnalyticsData(
        organizationId, 
        type, 
        dateRange, 
        analytics
      );
      
      return analytics;
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
  ): Promise<any> {
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