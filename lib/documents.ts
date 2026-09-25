// =============================================================================
// MEEDOSys Document & File Management Utilities
// Client-side PDF handling, Blob URL conversion, and IndexedDB caching
// =============================================================================

// Cache for active Blob URLs to prevent memory leaks and unnecessary creations
const blobUrlCache = new Map<string, string>();

/**
 * Converts a base64 Data URL or raw base64 string into a browser-native Blob URL.
 * Blob URLs work seamlessly inside iframes and can be opened in new tabs without
 * browser security restrictions on data: navigation.
 */
export function base64ToBlobUrl(base64Data: string, mimeType = 'application/pdf'): string {
  if (!base64Data) return '';
  if (base64Data.startsWith('blob:')) return base64Data;
  if (blobUrlCache.has(base64Data)) {
    return blobUrlCache.get(base64Data)!;
  }

  try {
    const base64Index = base64Data.indexOf(';base64,');
    const raw = base64Index > -1 ? base64Data.substring(base64Index + 8) : base64Data;
    const byteCharacters = atob(raw);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    blobUrlCache.set(base64Data, url);
    return url;
  } catch (err) {
    console.warn('Failed to convert base64 to Blob URL, returning original:', err);
    return base64Data;
  }
}

/**
 * Formats byte size into human-readable representation (e.g. 450 KB, 1.2 MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Reads a File object into a base64 Data URL string asynchronously
 */
export function readFileAsDataUrl(file: File): Promise<{ dataUrl: string; name: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        name: file.name,
        size: file.size,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// -----------------------------------------------------------------------------
// Lightweight IndexedDB Store for Large Documents (PDFs & Full Images)
// -----------------------------------------------------------------------------
const DB_NAME = 'meedo_docs_db';
const STORE_NAME = 'documents';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeDocumentInDB(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn(`IndexedDB store warning for key ${key}:`, e);
  }
}

export async function getDocumentFromDB(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn(`IndexedDB retrieve warning for key ${key}:`, e);
    return null;
  }
}
