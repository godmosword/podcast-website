/** Version 2 keeps the original drafts store intact for lazy, reversible migration. */
export const COLORING_DB = "coloring-drafts";
export const COLORING_DB_VERSION = 2;

export function openColoringDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("此瀏覽器無法儲存作品"));
      return;
    }
    const req = indexedDB.open(COLORING_DB, COLORING_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("drafts"))
        db.createObjectStore("drafts");
      if (!db.objectStoreNames.contains("draft-records")) {
        db.createObjectStore("draft-records", { keyPath: "key" }).createIndex(
          "updatedAt",
          "updatedAt",
        );
      }
      if (!db.objectStoreNames.contains("artworks"))
        db.createObjectStore("artworks", { keyPath: "id" });
      if (!db.objectStoreNames.contains("artwork-previews")) {
        db.createObjectStore("artwork-previews", { keyPath: "id" }).createIndex(
          "createdAt",
          "createdAt",
        );
      }
    };
    req.onerror = () => reject(req.error ?? new Error("無法開啟作品收藏"));
    req.onblocked = () => reject(new Error("請關閉其他著色本分頁後重試"));
    req.onsuccess = () => {
      req.result.onversionchange = () => req.result.close();
      resolve(req.result);
    };
  });
}

/** A successful request alone is not proof that a write committed. */
export async function coloringTransaction<T>(
  stores: string | string[],
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction, result: (value: T) => void) => void,
): Promise<T> {
  const db = await openColoringDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      let value: T;
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(tx.error ?? new Error("作品儲存被中止"));
      tx.onerror = () => reject(tx.error ?? new Error("作品無法儲存"));
      try {
        run(tx, (next) => {
          value = next;
        });
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  } finally {
    db.close();
  }
}

export function readColoringValue<T>(
  store: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  return coloringTransaction<T | undefined>(store, "readonly", (tx, result) => {
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => result(req.result as T | undefined);
  });
}

export async function listColoringValues<T>(
  store: string,
  index: string,
  limit: number,
  before?: number,
): Promise<T[]> {
  return coloringTransaction<T[]>(store, "readonly", (tx, result) => {
    const items: T[] = [];
    result(items);
    const req = tx
      .objectStore(store)
      .index(index)
      .openCursor(
        before === undefined ? null : IDBKeyRange.upperBound(before, true),
        "prev",
      );
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || items.length >= limit) return;
      items.push(cursor.value as T);
      if (items.length < limit) cursor.continue();
    };
  });
}
