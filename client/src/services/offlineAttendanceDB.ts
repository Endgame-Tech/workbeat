import { openDB, IDBPDatabase } from 'idb';

// Define the record type to use throughout the application
export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sign-in' | 'sign-out';
  timestamp: Date;
  notes?: string;
  location?: { latitude: number; longitude: number } | null;
  ipAddress?: string | null;
  qrValue?: string;
  organizationId?: string;
  synced: boolean;
  syncAttempts: number;
  deviceId: string;
};

// Device ID generation/retrieval
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('workbeat_device_id');
  
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('workbeat_device_id', deviceId);
  }
  
  return deviceId;
};

let db: IDBPDatabase | null = null;

export const offlineAttendanceDB = {
  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (db) return;
    
    db = await openDB('workbeat-offline', 1, {
      upgrade(database) {
        // Create the store if it doesn't exist
        if (!database.objectStoreNames.contains('offlineAttendance')) {
          const store = database.createObjectStore('offlineAttendance', { 
            keyPath: 'id' 
          });
          
          // Create indexes for querying
          store.createIndex('by-employee', 'employeeId');
          store.createIndex('by-sync-status', 'synced');
          store.createIndex('by-timestamp', 'timestamp');
        }
      }
    });
    
    console.log('Offline attendance database initialized');
  },

  /**
   * Store attendance record offline
   */
  async saveAttendanceRecord(record: {
    employeeId: string;
    employeeName: string;
    type: 'sign-in' | 'sign-out';
    notes?: string;
    location?: { latitude: number; longitude: number } | null;
    ipAddress?: string | null;
    qrValue?: string;
    organizationId?: string;
  }): Promise<string> {
    if (!db) await this.init();
    
    const id = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const storedRecord = {
      id,
      ...record,
      timestamp: new Date().toISOString(),
      synced: false,
      syncAttempts: 0,
      deviceId: getDeviceId()
    };
    
    await db!.add('offlineAttendance', storedRecord);
    
    console.log('Attendance record saved offline:', id);
    return id;
  },

  /**
   * Get all unsynced attendance records
   */
  async getUnsyncedRecords(): Promise<AttendanceRecord[]> {
    if (!db) await this.init();
    
    const allRecords = await db!.getAll('offlineAttendance');
    const unsyncedRecords = allRecords.filter(record => !record.synced);
    
    return unsyncedRecords.map(record => ({
      ...record,
      timestamp: new Date(record.timestamp)
    }));
  },

  /**
   * Mark a record as synced
   */
  async markAsSynced(id: string): Promise<void> {
    if (!db) await this.init();
    
    const record = await db!.get('offlineAttendance', id);
    if (record) {
      record.synced = true;
      await db!.put('offlineAttendance', record);
      console.log('Attendance record marked as synced:', id);
    }
  },

  /**
   * Mark a record as failed sync attempt
   */
  async markSyncAttempt(id: string): Promise<void> {
    if (!db) await this.init();
    
    const record = await db!.get('offlineAttendance', id);
    if (record) {
      record.syncAttempts += 1;
      await db!.put('offlineAttendance', record);
      console.log('Attendance record sync attempt incremented:', id, record.syncAttempts);
    }
  },

  /**
   * Delete synced records that are older than specified days
   */
  async cleanupOldRecords(olderThanDays: number = 30): Promise<number> {
    if (!db) await this.init();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const records = await db!.getAll('offlineAttendance');
    let deletedCount = 0;
    
    for (const record of records) {
      if (record.synced && new Date(record.timestamp) < cutoffDate) {
        await db!.delete('offlineAttendance', record.id);
        deletedCount++;
      }
    }
    
    console.log(`Cleaned up ${deletedCount} old synced records`);
    return deletedCount;
  },

  /**
   * Get stats about offline records
   */
  async getStats(): Promise<{ total: number; unsynced: number; synced: number }> {
    if (!db) await this.init();
    
    const all = await db!.getAll('offlineAttendance');
    const unsynced = all.filter(record => !record.synced);
    
    return {
      total: all.length,
      unsynced: unsynced.length,
      synced: all.length - unsynced.length
    };
  }
};

export default offlineAttendanceDB;
