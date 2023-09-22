const logger = (text) => {
  console.log('::', text);
};

const openDB = (userId) => {
  logger('[2] openDB');
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(`media-storage-${userId}`, 1);

    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('media')) {
        db.createObjectStore('media');
      }
    };

    openRequest.onsuccess = (event) => {
      resolve(event.target.result);
    };

    openRequest.onerror = (event) => {
      reject('Error opening database');
    };
  });
};

const saveMedia = async (userId, file) => {
  logger('[1] saveMedia');
  const db = await openDB(userId);
  const transaction = db.transaction(['media'], 'readwrite');
  const store = transaction.objectStore('media');
  store.put(file, 'file');
};

const getMedia = async (userId) => {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['media'], 'readonly');
    const store = transaction.objectStore('media');
    const request = store.get('file');

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (e) => {
      reject('Error fetching media', e);
    };
  });
};

const deleteMedia = async (userId) => {
  const db = await openDB(userId);
  const transaction = db.transaction(['media'], 'readwrite');
  const store = transaction.objectStore('media');
  store.delete('file');
};

export { openDB, saveMedia, getMedia, deleteMedia, logger };
