/**
 * 著色草稿儲存：IndexedDB 存 PNG Blob（不受 localStorage ~5MB 配額限制）。
 * 舊版 localStorage data URL（coloring:v1:*）首次讀取時自動遷移。
 * save 失敗會 throw，由 UI 顯示提示（不再靜默吞掉）。
 */
import { coloringDraftKey } from "@/lib/coloring/tools";

const DB_NAME = "coloring-drafts";
const DB_VERSION = 1;
const STORE = "drafts";

/** 草稿內容：新版為 Blob，遷移自 localStorage 的舊草稿為 data URL 字串。 */
export type ColoringDraft = Blob | string;

function canUseIndexedDb(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB request failed"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await requestToPromise(run(db.transaction(STORE, mode).objectStore(STORE)));
  } finally {
    db.close();
  }
}

function readLegacyDraft(pageId: string): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(coloringDraftKey(pageId));
  } catch {
    return null;
  }
}

function removeLegacyDraft(pageId: string): void {
  try {
    window.localStorage.removeItem(coloringDraftKey(pageId));
  } catch {
    // ignore
  }
}

/** 讀取草稿；IndexedDB 沒有時回頭找舊 localStorage 並遷移（搬完刪舊 key）。 */
export async function loadColoringDraft(pageId: string): Promise<ColoringDraft | null> {
  if (!canUseIndexedDb()) return readLegacyDraft(pageId);
  try {
    const stored = await withStore<ColoringDraft | undefined>("readonly", (store) =>
      store.get(pageId),
    );
    if (stored != null) return stored;

    const legacy = readLegacyDraft(pageId);
    if (legacy != null) {
      try {
        await withStore("readwrite", (store) => store.put(legacy, pageId));
        removeLegacyDraft(pageId);
      } catch {
        // 遷移失敗不影響讀取，下次再試
      }
    }
    return legacy;
  } catch {
    return readLegacyDraft(pageId);
  }
}

/** 儲存草稿；失敗會 throw（配額、私密模式等），呼叫端負責提示。 */
export async function saveColoringDraft(
  pageId: string,
  draft: ColoringDraft,
): Promise<void> {
  if (!canUseIndexedDb()) {
    throw new Error("此瀏覽器無法儲存草稿（indexedDB 不可用）");
  }
  await withStore("readwrite", (store) => store.put(draft, pageId));
}

export async function clearColoringDraft(pageId: string): Promise<void> {
  removeLegacyDraft(pageId);
  if (!canUseIndexedDb()) return;
  try {
    await withStore("readwrite", (store) => store.delete(pageId));
  } catch {
    // 清除失敗無害，忽略
  }
}
