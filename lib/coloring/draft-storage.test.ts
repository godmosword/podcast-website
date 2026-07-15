import { afterEach, describe, expect, test, vi } from "vitest";
import {
  clearColoringDraft,
  loadColoringDraft,
  saveColoringDraft,
} from "@/lib/coloring/draft-storage";
import { coloringDraftKey, coloringDraftStorageKey } from "@/lib/coloring/tools";

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
  test("IndexedDB 以線稿世代 key 存取與清除草稿", async () => {
    const idbStore = new Map<string, unknown>();
    vi.stubGlobal("indexedDB", makeFakeIndexedDb(idbStore));
    stubLocalStorage(new Map());

    expect(await loadColoringDraft("p1")).toBeNull();
    await saveColoringDraft("p1", "data:image/png;base64,abc");
    expect(idbStore.get(coloringDraftStorageKey("p1"))).toBe("data:image/png;base64,abc");
    expect(await loadColoringDraft("p1")).toBe("data:image/png;base64,abc");
    await clearColoringDraft("p1");
    expect(await loadColoringDraft("p1")).toBeNull();
  });

  test("舊世代草稿不再讀取（線稿已重生，舊塗鴉對不上）", async () => {
    const idbStore = new Map<string, unknown>([["p2", "data:image/png;base64,oldrev"]]);
    const legacy = new Map<string, string>([
      [coloringDraftKey("p2"), "data:image/png;base64,legacy"],
    ]);
    vi.stubGlobal("indexedDB", makeFakeIndexedDb(idbStore));
    stubLocalStorage(legacy);

    // 舊 IDB key（無世代後綴）與舊 localStorage 皆視為不存在
    expect(await loadColoringDraft("p2")).toBeNull();
  });

  test("清除草稿順手移除舊 localStorage key", async () => {
    const idbStore = new Map<string, unknown>();
    const legacy = new Map<string, string>([
      [coloringDraftKey("p5"), "data:image/png;base64,legacy"],
    ]);
    vi.stubGlobal("indexedDB", makeFakeIndexedDb(idbStore));
    stubLocalStorage(legacy);

    await clearColoringDraft("p5");
    expect(legacy.size).toBe(0);
  });

  test("儲存失敗會 throw（不再靜默吞掉）", async () => {
    vi.stubGlobal("indexedDB", makeFakeIndexedDb(new Map(), { failPut: true }));
    stubLocalStorage(new Map());

    await expect(saveColoringDraft("p3", "data:x")).rejects.toThrow();
  });

  test("無 IndexedDB 時 load 回 null、save 直接 throw", async () => {
    stubLocalStorage(new Map());

    expect(await loadColoringDraft("p4")).toBeNull();
    await expect(saveColoringDraft("p4", "data:x")).rejects.toThrow();
  });
});
