/**
 * 著色草稿儲存：IndexedDB 存 PNG Blob（不受 localStorage ~5MB 配額限制）。
 * key 綁線稿世代（COLORING_LINEART_REV）：線稿重生後舊草稿自動失效，
 * 避免舊塗鴉對不上新線稿。舊 localStorage 草稿（coloring:v1:*）屬舊線稿，
 * 不再遷移，僅於清除時順手移除。
 * save 失敗會 throw，由 UI 顯示提示（不再靜默吞掉）。
 */
import { coloringDraftKey, coloringDraftStorageKey, parseColoringDraftPageId } from "@/lib/coloring/tools";

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

function removeLegacyDraft(pageId: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(coloringDraftKey(pageId));
  } catch {
    // ignore
  }
}

/** 讀取草稿（僅當前線稿世代；舊世代草稿視為不存在）。 */
export async function loadColoringDraft(pageId: string): Promise<ColoringDraft | null> {
  if (!canUseIndexedDb()) return null;
  try {
    const stored = await withStore<ColoringDraft | undefined>("readonly", (store) =>
      store.get(coloringDraftStorageKey(pageId)),
    );
    return stored ?? null;
  } catch {
    return null;
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
  await withStore("readwrite", (store) => store.put(draft, coloringDraftStorageKey(pageId)));
}

export async function clearColoringDraft(pageId: string): Promise<void> {
  removeLegacyDraft(pageId);
  if (!canUseIndexedDb()) return;
  try {
    await withStore("readwrite", (store) => store.delete(coloringDraftStorageKey(pageId)));
  } catch {
    // 清除失敗無害，忽略
  }
}

/** 列出當前世代草稿（本機作品牆用；不上傳）。 */
export async function listColoringDrafts(): Promise<
  { pageId: string; draft: ColoringDraft }[]
> {
  if (!canUseIndexedDb()) return [];
  try {
    const db = await openDb();
    try {
      const store = db.transaction(STORE, "readonly").objectStore(STORE);
      const keys = await requestToPromise(
        store.getAllKeys() as IDBRequest<IDBValidKey[]>,
      );
      const values = await requestToPromise(
        store.getAll() as IDBRequest<ColoringDraft[]>,
      );
      const out: { pageId: string; draft: ColoringDraft }[] = [];
      for (let i = 0; i < keys.length; i++) {
        const pageId = parseColoringDraftPageId(String(keys[i]));
        const draft = values[i];
        if (pageId && draft) out.push({ pageId, draft });
      }
      return out;
    } finally {
      db.close();
    }
  } catch {
    return [];
  }
}
