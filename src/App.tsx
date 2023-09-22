import React, { useState, ChangeEvent } from 'react';

type IDBDatabaseInstance = IDBDatabase;
type IDBFile = File | null;

function App() {
  const [userId, setUserId] = useState<string>('defaultUserId');
  const [mediaURL, setMediaURL] = useState<string | null>(null);

  const logger = (text: string | Error): void => {
    console.log('::', text);
  };

  const openDB = (): Promise<IDBDatabaseInstance> => {
    logger('[2] openDB');
    return new Promise((resolve, reject) => {
      const DBOpenReq = indexedDB.open(`media-storage`, 1);

      DBOpenReq.onupgradeneeded = (event) => {
        logger('onupgradeneeded');
        const db = event.target.result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media');
        }
      };

      DBOpenReq.onsuccess = (event) => {
        resolve(event.target.result);
      };

      DBOpenReq.onerror = (event) => {
        reject('Error opening database');
      };
    });
  };

  const saveMedia = async (userId: string, file: IDBFile): Promise<void> => {
    logger('[1] saveMedia');
    const db = await openDB();
    const transaction = makeTransaction(db, 'media', 'readwrite');
    transaction.oncomplete = () => {
      logger('transaction complete');
    };
    const store = transaction.objectStore('media');
    logger(`Saving media for user: ${userId}`);
    store.put(file, userId);
  };

  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    logger('[0] handleUpload');
    const file = e.target.files[0];
    if (file) {
      await saveMedia(userId, file);
      const objectURL = URL.createObjectURL(file);
      logger(objectURL);
      setMediaURL(objectURL);
    }
  };

  function makeTransaction(
    dataBase: IDBDatabaseInstance,
    storeName: string,
    mode: IDBTransactionMode
  ): IDBTransaction {
    logger('[3] transaction');
    let tx = dataBase.transaction(storeName, mode);
    tx.onerror = (err) => {
      logger(err);
    };
    return tx;
  }

  const deleteMedia = async (userId: string): Promise<void> => {
    const db = await openDB();
    const transaction = makeTransaction(db, 'media', 'readwrite');
    const store = transaction.objectStore('media');
    const request = store.delete(userId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Error deleting media'));
      };
    });
  };

  const handleDelete = async (): Promise<void> => {
    logger('[4] handleDelete');
    try {
      await deleteMedia(userId);
      logger('Media deleted successfully');
      setMediaURL(null); // reset media URL to ensure it doesn't play deleted media
    } catch (error) {
      logger('Error deleting media:', error);
    }
  };

  return (
    <div className="App">
      <input type="file" onChange={handleUpload} />
      {mediaURL && <audio controls src={mediaURL}></audio>}
      <button onClick={handleDelete}>Delete Media from IndexedDB</button>
    </div>
  );
}

export default App;
