import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import {
  clearColoringDraft,
  listColoringDraftRecords,
  loadColoringDraft,
  loadColoringDraftRecord,
  saveColoringDraft,
  draftRecordKey,
} from "./draft-storage";
import { coloringTransaction, readColoringValue } from "./storage-db";
import {
  saveColoringArtwork,
  listColoringArtworks,
  loadColoringArtwork,
} from "./artwork-storage";
import { coloringDraftStorageKey } from "./tools";
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("IDBKeyRange", IDBKeyRange);
  vi.stubGlobal("localStorage", { removeItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());
describe("coloring durable storage", () => {
  test("stores per-page versions and clears without falling back to old paint", async () => {
    await saveColoringDraft("p1", "data:paint");
    expect(await loadColoringDraft("p1")).toBe("data:paint");
    expect(await loadColoringDraftRecord("p1", 1)).toBeNull();
    await clearColoringDraft("p1");
    expect(await loadColoringDraft("p1")).toBeNull();
  });
  test("version-one Blob stays intact and is exposed for lazy migration", async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("coloring-drafts", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("drafts");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve) => {
      const t = db.transaction("drafts", "readwrite");
      t.objectStore("drafts").put("data:old", coloringDraftStorageKey("p2"));
      t.oncomplete = () => resolve();
    });
    db.close();
    expect((await loadColoringDraftRecord("p2"))?.paintBlob).toBe("data:old");
    expect(
      await readColoringValue("drafts", coloringDraftStorageKey("p2")),
    ).toBe("data:old");
  });
  test("request success followed by transaction abort rejects and rolls back", async () => {
    await expect(
      coloringTransaction<void>("draft-records", "readwrite", (tx) => {
        const r = tx
          .objectStore("draft-records")
          .put({ key: draftRecordKey("p3"), updatedAt: 1 });
        r.onsuccess = () => tx.abort();
      }),
    ).rejects.toThrow();
    expect(
      await readColoringValue("draft-records", draftRecordKey("p3")),
    ).toBeUndefined();
  });
  test("draft list is newest first and bounded", async () => {
    await saveColoringDraft("p1", "data:a");
    await saveColoringDraft("p2", "data:b");
    expect(await listColoringDraftRecords(1)).toHaveLength(1);
    expect((await listColoringDraftRecords()).map((r) => r.pageId)).toEqual([
      "p2",
      "p1",
    ]);
  });
  test("completed versions coexist and preview pagination excludes full bitmaps", async () => {
    const b = new Blob(["image"]);
    for (let i = 1; i <= 3; i++)
      await saveColoringArtwork({
        id: `a${i}`,
        pageId: "p1",
        title: "作品",
        lineArtRevision: 2,
        createdAt: i,
        compositeBlob: b,
        thumbnailBlob: b,
      });
    const newest = await listColoringArtworks(2);
    expect(newest.map((a) => a.id)).toEqual(["a3", "a2"]);
    expect(newest[0]).not.toHaveProperty("compositeBlob");
    expect(
      (await listColoringArtworks(2, newest.at(-1)!.createdAt)).map(
        (a) => a.id,
      ),
    ).toEqual(["a1"]);
    expect((await loadColoringArtwork("a1"))?.compositeBlob).toBeTruthy();
    await expect(
      saveColoringArtwork({
        id: "a1",
        pageId: "p1",
        title: "覆蓋",
        lineArtRevision: 2,
        createdAt: 4,
        compositeBlob: b,
        thumbnailBlob: b,
      }),
    ).rejects.toThrow();
    expect((await loadColoringArtwork("a1"))?.title).toBe("作品");
  });
  test("unavailable storage rejects writes and allows empty reads", async () => {
    vi.stubGlobal("indexedDB", undefined);
    expect(await loadColoringDraft("p1")).toBeNull();
    await expect(saveColoringDraft("p1", "data:x")).rejects.toThrow();
  });
});
