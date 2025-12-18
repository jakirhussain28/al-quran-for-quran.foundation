// DB CONFIG
const DB_NAME = 'QuranAppDB';
const DB_VERSION = 1;
const STORES = {
  CHAPTERS: 'chapters',
  VERSES: 'verses' 
};

// OPEN DATABASE
const openDB = () => {
  return new Promise((resolve, reject) => {
    // open request
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(`IndexedDB error: ${event.target.error}`);

    // CREATE SCHEMA
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // create chapters store
      if (!db.objectStoreNames.contains(STORES.CHAPTERS)) {
        db.createObjectStore(STORES.CHAPTERS, { keyPath: 'key' });
      }
      
      // create verses store
      if (!db.objectStoreNames.contains(STORES.VERSES)) {
        db.createObjectStore(STORES.VERSES, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// GET DATA
export const getFromDB = async (storeName, key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      // read transaction
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("DB Get Error:", err);
    return null;
  }
};

// SAVE DATA
export const saveToDB = async (storeName, key, data) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      // write transaction
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // prepare payload
      const payload = { key, data };
      const request = store.put(payload);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("DB Save Error:", err);
    return false;
  }
};

// FETCH WITH CACHE
export const fetchWithCache = async (storeName, key, networkFetcher) => {
    // 1. CHECK LOCAL DB
    try {
        const cached = await getFromDB(storeName, key);
        if (cached && cached.data) {
            console.log(`[Cache Hit] ${storeName} : ${key}`);
            return cached.data; // return cache
        }
    } catch (e) {
        console.warn("Cache check failed, falling back to network", e);
    }

    // 2. FETCH FROM NETWORK
    console.log(`Fetching from API: ${key}`);
    const data = await networkFetcher();

    // 3. SAVE TO CACHE
    if (data) {
        // save in background
        saveToDB(storeName, key, data).catch(e => console.error("Failed to cache data", e));
    }

    return data;
};

export const DB_STORES = STORES;