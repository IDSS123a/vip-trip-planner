// IndexedDB wrapper for offline trip storage and sync queue

const DB_NAME = 'idss-trips-offline';
const DB_VERSION = 1;

interface SyncQueueItem {
  id: string;
  action: 'save' | 'update';
  tripId?: string;
  data: any;
  timestamp: number;
  retries: number;
}

interface CachedTrip {
  id: string;
  data: any;
  lastModified: number;
}

let db: IDBDatabase | null = null;

export const initOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store for pending sync operations
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id' });
      }

      // Store for cached trips (for offline viewing)
      if (!database.objectStoreNames.contains('cachedTrips')) {
        database.createObjectStore('cachedTrips', { keyPath: 'id' });
      }
    };
  });
};

// Sync Queue Operations
export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<string> => {
  const database = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const id = crypto.randomUUID();
    const queueItem: SyncQueueItem = {
      ...item,
      id,
      timestamp: Date.now(),
      retries: 0,
    };

    const request = store.add(queueItem);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const database = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const removeFromSyncQueue = async (id: string): Promise<void> => {
  const database = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateSyncQueueItem = async (id: string, updates: Partial<SyncQueueItem>): Promise<void> => {
  const database = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      if (getRequest.result) {
        const updated = { ...getRequest.result, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Cached Trips Operations
export const cacheTrip = async (tripId: string, data: any): Promise<void> => {
  const database = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cachedTrips'], 'readwrite');
    const store = transaction.objectStore('cachedTrips');
    
    const cachedTrip: CachedTrip = {
      id: tripId,
      data,
      lastModified: Date.now(),
    };

    const request = store.put(cachedTrip);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getCachedTrip = async (tripId: string): Promise<any | null> => {
  const database = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cachedTrips'], 'readonly');
    const store = transaction.objectStore('cachedTrips');
    const request = store.get(tripId);

    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllCachedTrips = async (): Promise<CachedTrip[]> => {
  const database = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cachedTrips'], 'readonly');
    const store = transaction.objectStore('cachedTrips');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearSyncQueue = async (): Promise<void> => {
  const database = await initOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
