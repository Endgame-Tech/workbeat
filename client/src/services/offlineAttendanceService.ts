// TypeScript type declaration for SyncManager (for background sync API)
interface SyncManager {
  register(tag: string): Promise<void>;
}

import { attendanceService as originalAttendanceService } from './attendanceService';
import offlineAttendanceDB from './offlineAttendanceDB';
import { AttendanceRecord } from '../types';
import { employeeService } from './employeeService';

// Helper to check if we're online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Create enhanced service with offline capabilities
export const offlineAttendanceService = {
  // Initialize - ensure DB is ready
  async init(): Promise<void> {
    await offlineAttendanceDB.init();
    
    // Register sync event listeners
    window.addEventListener('online', this.handleNetworkOnline.bind(this));
    
    // Register service worker message handler for background sync
    this.setupServiceWorkerMessageHandler();
    
    // Try initial sync if online
    if (isOnline()) {
      setTimeout(() => this.syncOfflineRecords(), 3000); // Delay initial sync
    }
  },

  // Handle network coming online
  async handleNetworkOnline(): Promise<void> {
    console.log('🌐 Network connection restored');
    
    // Register background sync if supported
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const syncManager = (registration as ServiceWorkerRegistration & { sync?: SyncManager }).sync;
        if (syncManager) {
          await syncManager.register('attendance-sync');
          console.log('🔄 Background sync registered for attendance');
        } else {
          // Fallback to immediate sync if background sync not supported
          this.syncOfflineRecords();
        }
      } catch (error) {
        console.error('🔄 Failed to register background sync:', error);
        // Fallback to immediate sync
        this.syncOfflineRecords();
      }
    } else {
      // Fallback to immediate sync if background sync not supported
      this.syncOfflineRecords();
    }
  },

  // Setup service worker message handler
  setupServiceWorkerMessageHandler(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'get-offline-attendance':
            this.handleGetOfflineAttendance(event);
            break;
          case 'mark-record-synced':
            this.handleMarkRecordSynced(event, data);
            break;
          case 'update-retry-count':
            this.handleUpdateRetryCount(event, data);
            break;
          case 'sync-event':
            this.handleSyncEvent(data);
            break;
          default:
            console.log('🔄 Unknown service worker message:', type);
        }
      });
    }
  },

  // Handle get offline attendance data request from service worker
  async handleGetOfflineAttendance(event: MessageEvent): Promise<void> {
    try {
      const unsynced = await offlineAttendanceDB.getUnsyncedRecords();
      const authToken = localStorage.getItem('authToken'); // Get current auth token
      
      // Transform records to include auth token and required fields
      const records = unsynced.map(record => ({
        id: record.id,
        employeeId: record.employeeId,
        organizationId: record.organizationId,
        type: record.type,
        timestamp: record.timestamp,
        locationData: record.location,
        deviceId: record.deviceId,
        authToken
      }));
      
      event.ports[0].postMessage({ result: records });
    } catch (error) {
      console.error('🔄 Error getting offline attendance data:', error);
      const errorMessage = (error && typeof error === 'object' && 'message' in error)
        ? (error as { message: string }).message
        : String(error);
      event.ports[0].postMessage({ error: errorMessage });
    }
  },

  // Handle mark record as synced request from service worker
  async handleMarkRecordSynced(event: MessageEvent, data: { recordId: string }): Promise<void> {
    try {
      await offlineAttendanceDB.markAsSynced(data.recordId);
      event.ports[0].postMessage({ result: 'success' });
    } catch (error) {
      console.error('🔄 Error marking record as synced:', error);
      const errorMessage = (error && typeof error === 'object' && 'message' in error)
        ? (error as { message: string }).message
        : String(error);
      event.ports[0].postMessage({ error: errorMessage });
    }
  },

  // Handle update retry count request from service worker
  async handleUpdateRetryCount(event: MessageEvent, data: { recordId: string }): Promise<void> {
    try {
      await offlineAttendanceDB.markSyncAttempt(data.recordId);
      event.ports[0].postMessage({ result: 'success' });
    } catch (error) {
      console.error('🔄 Error updating retry count:', error);
      const errorMessage = (error && typeof error === 'object' && 'message' in error)
        ? (error as { message: string }).message
        : String(error);
      event.ports[0].postMessage({ error: errorMessage });
    }
  },

  // Handle sync events from service worker
  handleSyncEvent(data: { eventType: string; data: unknown }): void {
    const { eventType, data: eventData } = data;
    
    switch (eventType) {
      case 'attendance-sync-complete':
        console.log('🔄 Background sync completed:', eventData);
        // Trigger UI refresh if needed
        window.dispatchEvent(new CustomEvent('attendance-sync-complete', { detail: eventData }));
        break;
      default:
        console.log('🔄 Unknown sync event:', eventType);
    }
  },
  
  // Override original record attendance with offline fallback
  async recordAttendance(
    employeeIdOrData: string | {
      employeeId: string;
      type: 'sign-in' | 'sign-out';
      location?: { latitude: number; longitude: number };
      notes?: string;
      employeeName?: string;
      ipAddress?: string;
      qrValue?: string;
    },
    employeeName?: string,
    type?: 'sign-in' | 'sign-out',
    ipAddress?: string | null,
    location?: { latitude: number; longitude: number } | null,
    notes?: string,
    qrValue?: string
  ): Promise<AttendanceRecord> {
    // Try online submission first if we're connected
    if (isOnline()) {
      try {
        return await originalAttendanceService.recordAttendance(
          employeeIdOrData,
          employeeName,
          type,
          ipAddress,
          location,
          notes,
          qrValue
        );
      } catch (error) {
        console.warn('Online attendance submission failed, falling back to offline mode:', error);
        // Fall through to offline handling
      }
    }
    
    // We're offline or online submission failed
    console.log('Recording attendance in offline mode');
    
    // Prepare record data
    let offlineRecord: {
      employeeId: string;
      employeeName: string;
      type: 'sign-in' | 'sign-out';
      ipAddress?: string | null;
      location?: { latitude: number; longitude: number } | null;
      notes?: string;
      qrValue?: string;
      organizationId: string;
    };
    
    if (typeof employeeIdOrData === 'string') {
      offlineRecord = {
        employeeId: employeeIdOrData,
        employeeName: employeeName || 'Unknown Employee',
        type: type || 'sign-in',
        ipAddress,
        location,
        notes,
        qrValue,
        organizationId: employeeService.getCurrentOrganizationId() || ''
      };
    } else {
      offlineRecord = {
        ...employeeIdOrData,
        employeeName: employeeIdOrData.employeeName || 'Unknown Employee',
        organizationId: employeeService.getCurrentOrganizationId() || ''
      };
    }
    
    // Save to IndexedDB
    const recordId = await offlineAttendanceDB.saveAttendanceRecord(offlineRecord);
    
    // Return a locally generated attendance record
    const timestamp = new Date();
    
    // Create a mock record for the UI to use
    return {
      _id: recordId,
      employeeId: offlineRecord.employeeId,
      employeeName: offlineRecord.employeeName,
      type: offlineRecord.type,
      timestamp,
      notes: offlineRecord.notes,
      location: offlineRecord.location,
      isLate: false, // We can't determine this offline
      verificationMethod: 'manual',
      organizationId: offlineRecord.organizationId || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      offline: true // Mark as offline record
    };
  },
  
  // Sync all offline records
  async syncOfflineRecords(): Promise<{
    success: number;
    failed: number;
    remaining: number;
  }> {
    if (!isOnline()) {
      console.log('Cannot sync offline records: device is offline');
      return { success: 0, failed: 0, remaining: 0 };
    }
    
    console.log('Starting sync of offline attendance records...');
    
    const unsynced = await offlineAttendanceDB.getUnsyncedRecords();
    console.log(`Found ${unsynced.length} unsynced records`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const record of unsynced) {
      try {
        // Skip records with too many failed attempts to prevent endless retries
        if (record.syncAttempts >= 5) {
          console.warn(`Skipping record ${record.id} with ${record.syncAttempts} failed sync attempts`);
          failedCount++;
          continue;
        }
        
        await offlineAttendanceDB.markSyncAttempt(record.id);
        
        // Submit to server
        await originalAttendanceService.recordAttendance({
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          type: record.type,
          location: record.location || undefined, // Convert null to undefined
          notes: record.notes,
          ipAddress: record.ipAddress || undefined, // Convert null to undefined
          qrValue: record.qrValue
        });
        
        // Mark as synced
        await offlineAttendanceDB.markAsSynced(record.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync record ${record.id}:`, error);
        failedCount++;
      }
    }
    
    // Clean up old synced records
    await offlineAttendanceDB.cleanupOldRecords();
    
    // Get remaining unsynced count
    const remaining = (await offlineAttendanceDB.getStats()).unsynced;
    
    console.log(`Sync completed: ${successCount} successful, ${failedCount} failed, ${remaining} remaining`);
    
    return {
      success: successCount,
      failed: failedCount,
      remaining
    };
  },
  
  // Get offline stats
  async getOfflineStats(): Promise<{ total: number; unsynced: number; synced: number }> {
    return offlineAttendanceDB.getStats();
  },

  // Manually trigger background sync
  async triggerBackgroundSync(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const syncManager = (registration as ServiceWorkerRegistration & { sync?: SyncManager }).sync;
        if (syncManager) {
          await syncManager.register('attendance-sync');
          console.log('🔄 Manual background sync triggered');
          return true;
        } else {
          console.warn('🔄 Background sync not supported, using immediate sync');
          this.syncOfflineRecords();
          return false;
        }
      } catch (error) {
        console.error('🔄 Failed to trigger background sync:', error);
        // Fallback to immediate sync
        this.syncOfflineRecords();
        return false;
      }
    } else {
      console.warn('🔄 Background sync not supported, using immediate sync');
      this.syncOfflineRecords();
      return false;
    }
  },

  // Check if background sync is supported
  isBackgroundSyncSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'SyncManager' in window
    );
  },
  
  // Forward other methods to original service
  getAllAttendanceRecords: originalAttendanceService.getAllAttendanceRecords,
  getEmployeeAttendance: originalAttendanceService.getEmployeeAttendance,
  recordAttendanceWithFace: originalAttendanceService.recordAttendanceWithFace,
  getClientLocation: originalAttendanceService.getClientLocation,
  getAttendanceReport: originalAttendanceService.getAttendanceReport,
  getAttendanceByDateRange: originalAttendanceService.getAttendanceInRange
};

export default offlineAttendanceService;
