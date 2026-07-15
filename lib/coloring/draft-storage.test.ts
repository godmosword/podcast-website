import { afterEach, describe, expect, test, vi } from "vitest";
import {
  clearColoringDraft,
  loadColoringDraft,
  saveColoringDraft,
} from "@/lib/coloring/draft-storage";
import { coloringDraftKey } from "@/lib/coloring/tools";

/** 最小 fake IndexedDB：只實作本模組用到的 open/get/put/delete。 */
function makeFakeIndexedDb(store: Map<string, unknown>, opts?: { failPut?: boolean }) {
  const fireSuccess = (req: FakeRequest, result?: unknown) => {
    req.result = result;
    queueMicrotask(() => req.onsuccess?.());
  };
  const fireError = (req: FakeRequest, message: string) => {
    req.error = new Error(message);
    queueMicrotask(() => req.onerror?.());
  };

  type FakeRequest = {
    result?: unknown;
    error?: Error;
    onsuccess?: (() => void) | null;
    onerror?: (() => void) | null;
    onupgradeneeded?: (() => void) | null;
  };

  const objectStore = {
    get(key: string) {
      const req: FakeRequest = {};
      fireSuccess(req, store.get(key));
      return req;
    },
    put(value: unknown, key: string) {
      const req: FakeRequest = {};
      if (opts?.failPut) {
        fireError(req, "QuotaExceededError");
      } else {
        store.set(key, value);
        fireSuccess(req);
      }
      return req;
    },
    delete(key: string) {
      const req: FakeRequest = {};
      store.delete(key);
      fireSuccess(req);
      return req;
    },
  };

  return {
    open() {
      const req: FakeRequest = {};
      req.result = {
        objectStoreNames: { contains: () => true },
        transaction: () => ({ objectStore: () => objectStore }),
        close: () => {},
      };
      queueMicrotask(() => req.onsuccess?.());
      return req;
    },
  };
}

function stubLocalStorage(store: Map<string, string>) {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("coloring draft-storage", () => {
  test("IndexedDB 存取與清除草稿", async () => {
    const idbStore = new Map<string, unknown>();
    vi.stubGlobal("indexedDB", makeFakeIndexedDb(idbStore));
    stubLocalStorage(new Map());

    expect(await loadColoringDraft("p1")).toBeNull();
    await saveColoringDraft("p1", "data:image/png;base64,abc");
    expect(idbStore.get("p1")).toBe("data:image/png;base64,abc");
    expect(await loadColoringDraft("p1")).toBe("data:image/png;base64,abc");
    await clearColoringDraft("p1");
    expect(await loadColoringDraft("p1")).toBeNull();
  });

  test("舊 localStorage 草稿自動遷移進 IndexedDB 並刪除舊 key", async () => {
    const idbStore = new Map<string, unknown>();
    const legacy = new Map<string, string>([
      [coloringDraftKey("p2"), "data:image/png;base64,legacy"],
    ]);
    vi.stubGlobal("indexedDB", makeFakeIndexedDb(idbStore));
    stubLocalStorage(legacy);

    expect(await loadColoringDraft("p2")).toBe("data:image/png;base64,legacy");
    // 等待遷移完成後：IndexedDB 有、localStorage 舊 key 已刪
    await vi.waitFor(() => {
      expect(idbStore.get("p2")).toBe("data:image/png;base64,legacy");
    });
    expect(legacy.size).toBe(0);
  });

  test("儲存失敗會 throw（不再靜默吞掉）", async () => {
    vi.stubGlobal("indexedDB", makeFakeIndexedDb(new Map(), { failPut: true }));
    stubLocalStorage(new Map());

    await expect(saveColoringDraft("p3", "data:x")).rejects.toThrow();
  });

  test("無 IndexedDB 時 load 回退 localStorage、save 直接 throw", async () => {
    const legacy = new Map<string, string>([
      [coloringDraftKey("p4"), "data:image/png;base64,old"],
    ]);
    stubLocalStorage(legacy);

    expect(await loadColoringDraft("p4")).toBe("data:image/png;base64,old");
    await expect(saveColoringDraft("p4", "data:x")).rejects.toThrow();
  });
});
