// WorkBeat Service Worker for PWA, Notifications, and Offline Support
const CACHE_NAME = 'workbeat-v1';
const SW_VERSION = '1.1.0';
const RUNTIME_CACHE = 'workbeat-runtime-v1';
const API_CACHE = 'workbeat-api-v1';
const STATIC_CACHE = 'workbeat-static-v1';

console.log(`🔔 WorkBeat Service Worker ${SW_VERSION} loading...`);

// Define critical assets to cache on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  // Core PWA icons
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/icon-maskable-192x192.svg',
  '/icons/icon-maskable-512x512.svg',
  // Shortcut icons
  '/icons/shortcut-attendance.svg',
  '/icons/shortcut-dashboard.svg',
  '/icons/shortcut-reports.svg'
];

// Static assets that should be cached but are not critical for initial load
const STATIC_ASSETS = [
  // All PWA icons
  '/icons/icon-16x16.svg',
  '/icons/icon-32x32.svg',
  '/icons/icon-72x72.svg',
  '/icons/icon-96x96.svg',
  '/icons/icon-128x128.svg',
  '/icons/icon-144x144.svg',
  '/icons/icon-152x152.svg',
  '/icons/icon-384x384.svg',
  // Splash screens
  '/splash/iPhone_14_Pro_Max_portrait.svg',
  '/splash/iPhone_14_Pro_portrait.svg',
  '/splash/iPhone_13_mini_portrait.svg',
  '/splash/iPhone_11_portrait.svg',
  '/splash/iPad_Air_portrait.svg',
  '/splash/iPad_Pro_11_portrait.svg',
  // Browser config
  '/browserconfig.xml'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🔔 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets first
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching critical assets...');
        return cache.addAll(CRITICAL_ASSETS).catch((error) => {
          console.warn('⚠️ Some critical assets could not be cached:', error);
          // Try to cache them individually
          return Promise.all(
            CRITICAL_ASSETS.map(asset => 
              cache.add(asset).catch(err => console.warn(`Failed to cache ${asset}:`, err))
            )
          );
        });
      }),
      
      // Cache static assets in background
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('⚠️ Some static assets could not be cached:', error);
          return Promise.resolve();
        });
      })
    ]).then(() => {
      console.log('✅ Service Worker installation complete');
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔔 Service Worker activating...');
  
  const expectedCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE, STATIC_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!expectedCaches.includes(cacheName)) {
              console.log('🧹 Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Clean up API cache entries older than 24 hours
      cleanupApiCache(),
      
      // Clean up runtime cache if it gets too large
      cleanupRuntimeCache()
    ]).then(() => {
      console.log('✅ Service Worker activation complete');
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Clean up API cache entries older than 24 hours
async function cleanupApiCache() {
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        const cacheTime = dateHeader ? new Date(dateHeader).getTime() : 0;
        
        if (now - cacheTime > maxAge) {
          console.log('🧹 Removing old API cache entry:', request.url);
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning up API cache:', error);
  }
}

// Clean up runtime cache if it gets too large (keep max 50 entries)
async function cleanupRuntimeCache() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    
    if (requests.length > 50) {
      // Remove oldest entries first
      const entriesToRemove = requests.slice(0, requests.length - 50);
      for (const request of entriesToRemove) {
        console.log('🧹 Removing old runtime cache entry:', request.url);
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning up runtime cache:', error);
  }
}

// Handle push events (for server-sent push notifications)
self.addEventListener('push', (event) => {
  console.log('🔔 Push event received:', event);
  
  let notificationData;
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('🔔 Error parsing push data:', error);
    notificationData = {
      title: 'WorkBeat Notification',
      body: 'You have a new notification',
      data: {}
    };
  }
  
  const {
    title = 'WorkBeat',
    body = 'You have a new notification',
    icon = '/icons/icon-192x192.svg',
    badge = '/icons/icon-72x72.svg',
    tag = 'workbeat-notification',
    requireInteraction = false,
    data = {}
  } = notificationData;
  
  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    requireInteraction,
    data,
    timestamp: Date.now(),
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/icon-32x32.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-32x32.svg'
      }
    ],
    vibrate: [200, 100, 200] // Vibration pattern for mobile devices
  };
  
  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag, event.action);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const action = event.action;
  
  if (action === 'dismiss') {
    // Just close the notification
    return;
  }
  
  // Handle 'view' action or click on notification body
  if (action === 'view' || !action) {
    event.waitUntil(
      handleNotificationClick(notificationData)
    );
  }
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 Notification closed:', event.notification.tag);
  
  // Optional: Send analytics or tracking data
  const notificationData = event.notification.data || {};
  
  // You could send a message to the main thread here
  // self.clients.matchAll().then(clients => {
  //   clients.forEach(client => {
  //     client.postMessage({
  //       type: 'notification-closed',
  //       data: notificationData
  //     });
  //   });
  // });
});

// Handle notification click navigation
async function handleNotificationClick(notificationData) {
  const { type, attendanceType, employeeName, organizationName } = notificationData;
  
  // Try to focus existing WorkBeat tab
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });
  
  // Look for existing WorkBeat window
  for (const client of windowClients) {
    if (client.url.includes('localhost') || client.url.includes('workbeat')) {
      // Focus the existing tab and navigate if needed
      client.focus();
      
      // Send message to navigate to appropriate page
      client.postMessage({
        type: 'notification-navigate',
        data: notificationData
      });
      
      return;
    }
  }
  
  // No existing tab found, open a new one
  let url = '/';
  
  // Determine URL based on notification type
  if (type === 'attendance') {
    url = '/attendance'; // Or specific attendance page
  } else if (type === 'organization') {
    url = '/dashboard'; // Or organization dashboard
  } else if (type === 'system') {
    url = '/settings'; // Or system settings page
  }
  
  // Open new window
  await self.clients.openWindow(url);
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('🔔 Service Worker received message:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'skip-waiting':
      self.skipWaiting();
      break;
      
    case 'clear-notifications':
      clearNotificationsByTag(data.tag);
      break;
      
    case 'update-badge':
      // Update badge count (if supported)
      if ('setAppBadge' in navigator) {
        navigator.setAppBadge(data.count || 0);
      }
      break;
      
    default:
      console.log('🔔 Unknown message type:', type);
  }
});

// Clear notifications by tag
async function clearNotificationsByTag(tag) {
  try {
    const notifications = await self.registration.getNotifications({ tag });
    notifications.forEach(notification => notification.close());
    console.log(`🔔 Cleared ${notifications.length} notifications with tag: ${tag}`);
  } catch (error) {
    console.error('🔔 Error clearing notifications:', error);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'attendance-sync':
      event.waitUntil(syncOfflineAttendance());
      break;
    case 'analytics-sync':
      event.waitUntil(syncAnalyticsData());
      break;
    case 'cache-cleanup':
      event.waitUntil(performCacheCleanup());
      break;
    default:
      console.log('🔄 Unknown sync tag:', event.tag);
  }
});

// Register background sync when network comes back online
async function registerBackgroundSync(tag) {
  try {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('🔄 Background sync registered:', tag);
      return true;
    } else {
      console.warn('🔄 Background sync not supported');
      return false;
    }
  } catch (error) {
    console.error('🔄 Failed to register background sync:', error);
    return false;
  }
}

// Sync offline attendance records with improved error handling and retry logic
async function syncOfflineAttendance() {
  console.log('🔄 Starting offline attendance sync...');
  
  try {
    // Get all pending offline attendance records from IndexedDB
    const offlineData = await getOfflineAttendanceData();
    
    if (!offlineData || offlineData.length === 0) {
      console.log('🔄 No offline attendance records to sync');
      return;
    }
    
    console.log(`🔄 Found ${offlineData.length} offline attendance records to sync`);
    
    let syncSuccess = 0;
    let syncFailed = 0;
    
    // Sync each record individually to handle partial failures
    for (const record of offlineData) {
      try {
        const result = await syncSingleAttendanceRecord(record);
        if (result.success) {
          syncSuccess++;
          // Mark record as synced in IndexedDB
          await markRecordAsSynced(record.id);
        } else {
          syncFailed++;
          // Update retry count
          await updateRetryCount(record.id);
        }
      } catch (error) {
        console.error('🔄 Failed to sync attendance record:', record.id, error);
        syncFailed++;
        await updateRetryCount(record.id);
      }
    }
    
    // Show sync result notification
    if (syncSuccess > 0 || syncFailed > 0) {
      let notificationBody;
      if (syncFailed === 0) {
        notificationBody = `Successfully synced ${syncSuccess} attendance records`;
      } else if (syncSuccess === 0) {
        notificationBody = `Failed to sync ${syncFailed} attendance records. Will retry later.`;
      } else {
        notificationBody = `Synced ${syncSuccess} records successfully, ${syncFailed} failed`;
      }
      
      await self.registration.showNotification('WorkBeat Sync', {
        body: notificationBody,
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        tag: 'sync-complete',
        requireInteraction: false,
        data: { syncSuccess, syncFailed }
      });
    }
    
    // Send message to main thread about sync completion
    await notifyMainThread('attendance-sync-complete', { 
      success: syncSuccess, 
      failed: syncFailed 
    });
    
  } catch (error) {
    console.error('🔄 Error during offline attendance sync:', error);
    
    // Show error notification
    await self.registration.showNotification('WorkBeat Sync Error', {
      body: 'Failed to sync offline attendance records. Will retry later.',
      icon: '/icons/icon-192x192.svg',
      tag: 'sync-error',
      requireInteraction: false
    });
  }
}

// Get offline attendance data from IndexedDB
async function getOfflineAttendanceData() {
  try {
    // We'll communicate with the main thread to get IndexedDB data
    // since IndexedDB operations in SW context can be complex
    const response = await sendMessageToClient('get-offline-attendance');
    return response || [];
  } catch (error) {
    console.error('🔄 Failed to get offline attendance data:', error);
    return [];
  }
}

// Sync a single attendance record
async function syncSingleAttendanceRecord(record) {
  try {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${record.authToken}` // Include stored auth token
      },
      body: JSON.stringify({
        employeeId: record.employeeId,
        organizationId: record.organizationId,
        type: record.type,
        timestamp: record.timestamp,
        biometricData: record.biometricData,
        locationData: record.locationData,
        deviceId: record.deviceId,
        offline: false // Mark as synced from offline
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('🔄 Successfully synced attendance record:', record.id);
      return { success: true, data: result };
    } else {
      console.warn('🔄 Failed to sync attendance record - HTTP', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('🔄 Network error syncing attendance record:', error);
    return { success: false, error: error.message };
  }
}

// Mark record as synced in IndexedDB
async function markRecordAsSynced(recordId) {
  try {
    await sendMessageToClient('mark-record-synced', { recordId });
  } catch (error) {
    console.error('🔄 Failed to mark record as synced:', error);
  }
}

// Update retry count for failed sync
async function updateRetryCount(recordId) {
  try {
    await sendMessageToClient('update-retry-count', { recordId });
  } catch (error) {
    console.error('🔄 Failed to update retry count:', error);
  }
}

// Sync analytics data (placeholder for future implementation)
async function syncAnalyticsData() {
  console.log('🔄 Syncing analytics data...');
  // Future implementation for syncing cached analytics data
}

// Perform cache cleanup during background sync
async function performCacheCleanup() {
  console.log('🔄 Performing background cache cleanup...');
  try {
    await cleanupApiCache();
    await cleanupRuntimeCache();
    console.log('🔄 Background cache cleanup completed');
  } catch (error) {
    console.error('🔄 Error during background cache cleanup:', error);
  }
}

// Send message to client (main thread)
async function sendMessageToClient(type, data = {}) {
  const clients = await self.clients.matchAll();
  
  if (clients.length === 0) {
    console.warn('🔄 No clients available to send message');
    return null;
  }
  
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.result);
      }
    };
    
    clients[0].postMessage({
      type,
      data,
      messageId: Date.now().toString()
    }, [messageChannel.port2]);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Message timeout'));
    }, 10000);
  });
}

// Notify main thread about sync events
async function notifyMainThread(eventType, data) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'sync-event',
        eventType,
        data,
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('🔄 Failed to notify main thread:', error);
  }
}

// Comprehensive network request handling with different caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests to avoid caching POST/PUT/DELETE
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Apply different caching strategies based on request type
  if (isStaticAsset(url)) {
    // Cache First strategy for static assets (icons, images, fonts)
    event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE));
  } else if (isApiRequest(url)) {
    // Network First with cache fallback for API requests
    event.respondWith(networkFirstStrategy(event.request, API_CACHE));
  } else if (isAppShell(url)) {
    // Stale While Revalidate for app shell (HTML, CSS, JS)
    event.respondWith(staleWhileRevalidateStrategy(event.request, RUNTIME_CACHE));
  } else {
    // Network First for everything else
    event.respondWith(networkFirstStrategy(event.request, RUNTIME_CACHE));
  }
});

// Check if request is for static assets
function isStaticAsset(url) {
  return url.pathname.includes('/icons/') ||
         url.pathname.includes('/splash/') ||
         url.pathname.includes('/screenshots/') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.gif') ||
         url.pathname.endsWith('.webp') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.includes('fonts');
}

// Check if request is for API endpoints
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname !== self.location.hostname ||
         url.pathname.includes('server/');
}

// Check if request is for app shell resources
function isAppShell(url) {
  return url.pathname.endsWith('.html') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.tsx') ||
         url.pathname.endsWith('.ts') ||
         url.pathname === '/' ||
         url.pathname.startsWith('/static/');
}

// Cache First Strategy - for static assets that rarely change
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Cache hit for:', request.url);
      return cachedResponse;
    }
    
    console.log('🌐 Cache miss, fetching:', request.url);
    const response = await fetch(request);
    
    if (response.status === 200) {
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      console.log('💾 Cached:', request.url);
    }
    
    return response;
  } catch (error) {
    console.warn('⚠️ Cache first strategy failed for:', request.url, error);
    
    // Try to return cached version as fallback
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If all fails, return a basic error response
    return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network First Strategy - for API requests and dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    console.log('🌐 Network first for:', request.url);
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.status === 200) {
      const responseClone = response.clone();
      const cache = await caches.open(cacheName);
      await cache.put(request, responseClone);
      console.log('💾 Cached API response:', request.url);
    }
    
    return response;
  } catch (error) {
    console.warn('⚠️ Network failed, trying cache for:', request.url, error);
    
    // Fallback to cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Cache fallback for:', request.url);
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/') || 
                             await caches.match('/index.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Offline - No cached version available', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Stale While Revalidate Strategy - for app shell resources
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch in the background
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
      console.log('♻️ Revalidated:', request.url);
    }
    return response;
  }).catch(error => {
    console.warn('⚠️ Revalidation failed for:', request.url, error);
    return null;
  });
  
  if (cachedResponse) {
    console.log('📦 Stale cache hit for:', request.url);
    return cachedResponse;
  }
  
  // If no cached version, wait for network
  console.log('🌐 No cache, waiting for network:', request.url);
  return fetchPromise || new Response('Network error', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

console.log(`🔔 WorkBeat Service Worker ${SW_VERSION} loaded successfully`);