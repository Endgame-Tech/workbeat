

// Comprehensive offline data caching service for PWA
// Caches API responses, employee data, organization data, and analytics for offline access

import { openDB, DBSchema, IDBPDatabase } from 'idb';


// Define the database schema
import {
  EmployeeCacheData,
  OrganizationCacheData,
  ApiResponseCacheData,
  AnalyticsCacheData,
  SettingsCacheData
} from '../types';

interface OfflineCacheDB extends DBSchema {
  employees: {
    key: string;
    value: {
      id: string;
      organizationId: string;
      data: EmployeeCacheData;
      lastUpdated: number;
      expiresAt: number;
    };
  };
  organizations: {
    key: string;
    value: {
      id: string;
      data: OrganizationCacheData;
      lastUpdated: number;
      expiresAt: number;
    };
  };
  apiResponses: {
    key: string;
    value: {
      url: string;
      method: string;
      data: ApiResponseCacheData;
      lastUpdated: number;
      expiresAt: number;
    };
  };
  analytics: {
    key: string;
    value: {
      id: string;
      organizationId: string;
      type: string;
      data: AnalyticsCacheData;
      dateRange: string;
      lastUpdated: number;
      expiresAt: number;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      data: SettingsCacheData;
      lastUpdated: number;
    };
  };
}


// --- IndexedDB Types Fix ---
// These should match the structure of your object stores and indexes


// Define the structure of each object store

// (Removed duplicate interface declarations for *CacheData types. These should only be imported from '../types'.)

// Update OfflineCacheDB type

// (Removed empty interface OfflineCacheDB extending IDBDatabase; not needed.)

// --- End IndexedDB Types Fix ---

class OfflineDataCacheService {
  private db: IDBPDatabase<OfflineCacheDB> | null = null;
  private dbName = 'WorkBeatOfflineCache';
  private dbVersion = 1;

  // Cache durations (in milliseconds)
  private cacheDurations = {
    employees: 60 * 60 * 1000, // 1 hour
    organizations: 24 * 60 * 60 * 1000, // 24 hours
    apiResponses: 30 * 60 * 1000, // 30 minutes
    analytics: 2 * 60 * 60 * 1000, // 2 hours
    settings: 24 * 60 * 60 * 1000 // 24 hours
  };

  async init(): Promise<void> {
    try {
      this.db = await openDB<OfflineCacheDB>(this.dbName, this.dbVersion, {
        upgrade(db) {
          // Employees cache
          if (!db.objectStoreNames.contains('employees')) {
            const employeeStore = db.createObjectStore('employees', { keyPath: 'id' });
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            employeeStore.createIndex('organizationId', 'organizationId');
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            employeeStore.createIndex('lastUpdated', 'lastUpdated');
          }

          // Organizations cache
          if (!db.objectStoreNames.contains('organizations')) {
            const orgStore = db.createObjectStore('organizations', { keyPath: 'id' });
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            orgStore.createIndex('lastUpdated', 'lastUpdated');
          }

          // API responses cache
          if (!db.objectStoreNames.contains('apiResponses')) {
            const apiStore = db.createObjectStore('apiResponses', { keyPath: 'url' });
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            apiStore.createIndex('method', 'method');
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            apiStore.createIndex('lastUpdated', 'lastUpdated');
          }

          // Analytics cache
          if (!db.objectStoreNames.contains('analytics')) {
            const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            analyticsStore.createIndex('organizationId', 'organizationId');
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            analyticsStore.createIndex('type', 'type');
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            analyticsStore.createIndex('lastUpdated', 'lastUpdated');
          }

          // Settings cache
          if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
            // @ts-expect-error: TypeScript may not infer value type, but this is valid
            settingsStore.createIndex('lastUpdated', 'lastUpdated');
          }
        },
      });
      
      // Clean up expired entries on init
      await this.cleanupExpiredEntries();
    } catch (error) {
      console.error('❌ Failed to initialize offline data cache:', error);
      throw error;
    }
  }

  // Employee data caching
  async cacheEmployeeData(organizationId: string, employees: EmployeeCacheData[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('employees', 'readwrite');
    const now = Date.now();
    const expiresAt = now + this.cacheDurations.employees;

    try {
      for (const employee of employees) {
        await tx.store.put({
          id: employee.id,
          organizationId,
          data: employee,
          lastUpdated: now,
          expiresAt
        });
      }
      await tx.done;
    } catch (error) {
      console.error('❌ Failed to cache employee data:', error);
      throw error;
    }
  }

  async getCachedEmployees(organizationId: string): Promise<EmployeeCacheData[] | null> {
    if (!this.db) return null;

    try {
      const now = Date.now();
      // Provide correct generic type for getAllFromIndex
      const employees = await (this.db as IDBPDatabase).getAllFromIndex('employees', 'organizationId', organizationId);
      // Filter out expired entries
      const validEmployees = employees.filter(emp => emp.expiresAt > now);
      if (validEmployees.length === 0) return null;
      return validEmployees.map(emp => emp.data);
    } catch (error) {
      console.error('❌ Failed to get cached employees:', error);
      return null;
    }
  }

  // Organization data caching
  async cacheOrganizationData(organizationId: string, data: OrganizationCacheData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const expiresAt = now + this.cacheDurations.organizations;

    try {
      await (this.db as IDBPDatabase).put('organizations', {
        id: organizationId,
        data,
        lastUpdated: now,
        expiresAt
      });
    } catch (error) {
      console.error('❌ Failed to cache organization data:', error);
      throw error;
    }
  }

  async getCachedOrganization(organizationId: string): Promise<OrganizationCacheData | null> {
    if (!this.db) return null;

    try {
      const org = await this.db.get('organizations', organizationId);
      
      if (!org || org.expiresAt <= Date.now()) {
        return null;
      }
      
      return org.data;
    } catch (error) {
      console.error('❌ Failed to get cached organization:', error);
      return null;
    }
  }

  // API response caching
  async cacheApiResponse(url: string, method: string, data: ApiResponseCacheData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const expiresAt = now + this.cacheDurations.apiResponses;

    try {
      await (this.db as IDBPDatabase).put('apiResponses', {
        url,
        method,
        data,
        lastUpdated: now,
        expiresAt
      });
    } catch (error) {
      console.error('❌ Failed to cache API response:', error);
      throw error;
    }
  }

  async getCachedApiResponse(url: string, method: string = 'GET'): Promise<ApiResponseCacheData | null> {
    if (!this.db) return null;

    try {
      const response = await this.db.get('apiResponses', url);
      
      if (!response || response.method !== method || response.expiresAt <= Date.now()) {
        return null;
      }
      
      return response.data;
    } catch {
      return null;
    }
  }

  // Analytics data caching
  async cacheAnalyticsData(
    organizationId: string, 
    type: string, 
    dateRange: string, 
    data: AnalyticsCacheData
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${organizationId}-${type}-${dateRange}`;
    const now = Date.now();
    const expiresAt = now + this.cacheDurations.analytics;

    try {
      await (this.db as IDBPDatabase).put('analytics', {
        id,
        organizationId,
        type,
        data,
        dateRange,
        lastUpdated: now,
        expiresAt
      });
    } catch (error) {
      console.error('❌ Failed to cache analytics data:', error);
      throw error;
    }
  }

  async getCachedAnalytics(
    organizationId: string, 
    type: string, 
    dateRange: string
  ): Promise<AnalyticsCacheData | null> {
    if (!this.db) return null;

    const id = `${organizationId}-${type}-${dateRange}`;

    try {
      const analytics = await this.db.get('analytics', id);
      
      if (!analytics || analytics.expiresAt <= Date.now()) {
        return null;
      }
      return analytics.data;
    } catch (error) {
      console.error('❌ Failed to get cached analytics:', error);
      return null;
    }
  }

  // Settings caching
  async cacheSetting(key: string, data: SettingsCacheData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();

    try {
      await this.db.put('settings', {
        key,
        data,
        lastUpdated: now
      });
    } catch (error) {
      console.error('❌ Failed to cache setting:', error);
      throw error;
    }
  }

  async getCachedSetting(key: string): Promise<SettingsCacheData | null> {
    if (!this.db) return null;

    try {
      const setting = await this.db.get('settings', key);
      
      if (!setting) return null;
      
      return setting.data;
    } catch (error) {
      console.error('❌ Failed to get cached setting:', error);
      return null;
    }
  }

  // Cleanup expired entries
  async cleanupExpiredEntries(): Promise<void> {
    if (!this.db) return;

    const now = Date.now();

    try {
      // Clean up employees
      const employees = await this.db.getAll('employees');
      const expiredEmployees = employees.filter(emp => emp.expiresAt <= now);
      for (const emp of expiredEmployees) {
        await this.db.delete('employees', emp.id);
      }

      // Clean up organizations
      const organizations = await this.db.getAll('organizations');
      const expiredOrgs = organizations.filter(org => org.expiresAt <= now);
      for (const org of expiredOrgs) {
        await this.db.delete('organizations', org.id);
      }

      // Clean up API responses
      const apiResponses = await this.db.getAll('apiResponses');
      const expiredApis = apiResponses.filter(api => api.expiresAt <= now);
      for (const api of expiredApis) {
        await this.db.delete('apiResponses', api.url);
      }

      // Clean up analytics
      const analytics = await this.db.getAll('analytics');
      const expiredAnalytics = analytics.filter(item => item.expiresAt <= now);
      for (const item of expiredAnalytics) {
        await this.db.delete('analytics', item.id);
      }

      const totalCleaned = expiredEmployees.length + expiredOrgs.length + 
                         expiredApis.length + expiredAnalytics.length;
      
      if (totalCleaned > 0) {
        console.log(`🧹 Cleaned up ${totalCleaned} expired cache entries`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired entries:', error);
    }
  }

  // Get cache statistics

  async getCacheStats(): Promise<{
    employees: number;
    organizations: number;
    apiResponses: number;
    analytics: number;
    settings: number;
    totalSize: number;
  }> {
    if (!this.db) {
      return { employees: 0, organizations: 0, apiResponses: 0, analytics: 0, settings: 0, totalSize: 0 };
    }
    try {
      const [employees, organizations, apiResponses, analytics, settings] = await Promise.all([
        this.db.count('employees'),
        this.db.count('organizations'),
        this.db.count('apiResponses'),
        this.db.count('analytics'),
        this.db.count('settings')
      ]);

      const totalSize = employees + organizations + apiResponses + analytics + settings;

      return {
        employees,
        organizations,
        apiResponses,
        analytics,
        settings,
        totalSize
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return { employees: 0, organizations: 0, apiResponses: 0, analytics: 0, settings: 0, totalSize: 0 };
    }
  }

  // Clear all cache data
  async clearAllCache(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(['employees', 'organizations', 'apiResponses', 'analytics', 'settings'], 'readwrite');
      
      await Promise.all([
        tx.objectStore('employees').clear(),
        tx.objectStore('organizations').clear(),
        tx.objectStore('apiResponses').clear(),
        tx.objectStore('analytics').clear(),
        tx.objectStore('settings').clear()
      ]);

      await tx.done;
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  // Check if online and cache is fresh
  isCacheFresh(lastUpdated: number, maxAge: number = 30 * 60 * 1000): boolean {
    return (Date.now() - lastUpdated) < maxAge;
  }

  // Get cache key for API requests
  getCacheKey(url: string, params?: Record<string, unknown>): string {
    if (!params) return url;
    
    const sortedParams = Object.keys(params).sort().reduce((sorted: Record<string, unknown>, key) => {
      sorted[key] = params[key];
      return sorted;
    }, {} as Record<string, unknown>);
    
    const paramString = new URLSearchParams(sortedParams as Record<string, string>).toString();
    return `${url}?${paramString}`;
  }
}

// Export singleton instance
const offlineDataCacheService = new OfflineDataCacheService();
export default offlineDataCacheService;