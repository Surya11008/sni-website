// IndexedDB Storage Helper for Star Galaxy Large File Data
// Bypasses the 5MB localStorage limit and allows gigabytes of local storage!

const DB_NAME = 'StarGalaxyFilesDB';
const DB_VERSION = 1;
const STORE_NAME = 'files_content';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('IndexedDB open error:', request.error);
      resolve(null);
    };
  });
}

export async function saveLocalFileData(fileId, dataString) {
  if (!fileId || !dataString) return false;
  try {
    const db = await openDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id: fileId, data: dataString, updatedAt: Date.now() });

      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn('IndexedDB save error:', req.error);
        resolve(false);
      };
    });
  } catch (e) {
    console.warn('IndexedDB write exception:', e);
    return false;
  }
}

export async function getLocalFileData(fileId) {
  if (!fileId) return null;
  try {
    const db = await openDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(fileId);

      req.onsuccess = () => {
        resolve(req.result ? req.result.data : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function deleteLocalFileData(fileId) {
  if (!fileId) return false;
  try {
    const db = await openDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(fileId);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export async function saveLocalPostMedia(postId, mediaItems) {
  if (!postId || !mediaItems) return false;
  try {
    const db = await openDatabase();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id: `post_${postId}`, data: JSON.stringify(mediaItems), updatedAt: Date.now() });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export async function getLocalPostMedia(postId) {
  if (!postId) return null;
  try {
    const db = await openDatabase();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`post_${postId}`);
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          try {
            resolve(JSON.parse(req.result.data));
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function deleteLocalPostMedia(postId) {
  if (!postId) return false;
  return deleteLocalFileData(`post_${postId}`);
}

