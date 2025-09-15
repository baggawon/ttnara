import { useRef } from "react";

const useIndexedDB = () => {
  interface SaveRemember {
    remember: string;
    username: string;
  }
  const db = useRef<IDBDatabase | null>(null);

  const loadDb = () =>
    new Promise<IDBDatabase | null>((resolve) => {
      const dbRequest = indexedDB.open("saveRemember");
      dbRequest.onupgradeneeded = async (event: any) => {
        const currentDb = event.target.result;
        const objectStore = currentDb.createObjectStore("saveRemember", {
          keyPath: "id",
        });
        objectStore.createIndex("remember", "remember", { unique: false });
        objectStore.createIndex("username", "username", { unique: false });
      };

      dbRequest.onsuccess = () => {
        db.current = dbRequest.result;
        resolve(db.current);
      };
    });

  const getData = (): Promise<SaveRemember | undefined> =>
    new Promise((resolve) => {
      try {
        const objectStore = db.current
          ?.transaction("saveRemember")
          .objectStore("saveRemember");
        if (objectStore) {
          const objectStoreRequest = objectStore.get(1);
          objectStoreRequest.onsuccess = (event: any) => {
            const result = event.target.result;
            resolve(result);
          };

          objectStoreRequest.onerror = (event: any) => {
            resolve(undefined);
          };
        } else resolve(undefined);
      } catch (error) {
        console.log("error", error);
        resolve(undefined);
      }
    });

  const saveData = (data: SaveRemember): Promise<boolean> =>
    new Promise((resolve) => {
      try {
        const objectStore = db.current
          ?.transaction("saveRemember", "readwrite")
          .objectStore("saveRemember");
        if (objectStore) {
          const objectStoreRequest = objectStore.get(1);
          objectStoreRequest.onsuccess = (event: any) => {
            const result = event.target.result;

            const updateResult = result
              ? objectStore.put({ ...data, id: 1 })
              : objectStore.add({ ...data, id: 1 });
            updateResult.onsuccess = () => {
              resolve(true);
            };
          };
        } else resolve(false);
      } catch (error) {
        console.log("error", error);
        resolve(false);
      }
    });

  const clearData = (): Promise<boolean> =>
    new Promise((resolve) => {
      try {
        const objectStore = db.current
          ?.transaction("saveRemember", "readwrite")
          .objectStore("saveRemember");
        if (objectStore) {
          const objectStoreRequest = objectStore.clear();
          objectStoreRequest.onsuccess = (event: any) => {
            resolve(true);
          };
        } else resolve(false);
      } catch (error) {
        console.log("error", error);
        resolve(false);
      }
    });

  return {
    loadDb,
    getData,
    saveData,
    clearData,
  };
};

export default useIndexedDB;
