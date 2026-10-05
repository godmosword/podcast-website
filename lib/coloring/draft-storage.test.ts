import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import {
  clearColoringDraft,
  listColoringDraftRecords,
  loadColoringDraft,
  loadColoringDraftRecord,
  saveColoringDraft,
  draftRecordKey,
  saveColoringDraftRecord,
  migrateColoringDraftRecord,
} from "./draft-storage";
import { coloringTransaction, readColoringValue, openColoringDb } from "./storage-db";
import {
  saveColoringArtwork,
  listColoringArtworks,
  loadColoringArtwork,
  deleteColoringArtwork,
} from "./artwork-storage";
import { coloringDraftStorageKey } from "./tools";
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("IDBKeyRange", IDBKeyRange);
  vi.stubGlobal("localStorage", { removeItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());
describe("coloring durable storage", () => {
  test("a blocked upgrade does not leak a connection when the other tab closes", async () => {
    const old = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open("coloring-drafts", 1);
      req.onsuccess = () => resolve(req.result);
    });
    await expect(openColoringDb()).rejects.toThrow("請關閉其他著色本分頁");
    old.close();
    const next = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("coloring-drafts", 3);
      req.onsuccess = () => resolve(req.result);
      req.onblocked = () => reject(new Error("leaked v2 connection"));
      req.onerror = () => reject(req.error);
    });
    next.close();
  });
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
  test("deleting one completed artwork leaves the draft and other completed versions intact", async () => {
    await saveColoringDraft("p1", "data:unfinished");
    for (const id of ["keep", "remove"])
      await saveColoringArtwork({
        id, pageId: "p1", title: id, lineArtRevision: 2, createdAt: 1,
        compositeBlob: new Blob([id]), thumbnailBlob: new Blob([id]),
      });
    await deleteColoringArtwork("remove");
    expect(await loadColoringArtwork("remove")).toBeUndefined();
    expect((await listColoringArtworks()).map((a) => a.id)).toEqual(["keep"]);
    expect(await loadColoringArtwork("keep")).toBeDefined();
    expect(await loadColoringDraft("p1")).toBe("data:unfinished");
  });
  test("equal artwork timestamps paginate without skipping or repeating previews", async () => {
    const b = new Blob(["preview"]);
    for (const id of ["a", "b", "c", "d", "e"])
      await saveColoringArtwork({
        id, pageId: "p1", title: id, lineArtRevision: 2,
        createdAt: id === "e" ? 2 : 1, compositeBlob: b, thumbnailBlob: b,
      });
    const first = await listColoringArtworks(2);
    const second = await listColoringArtworks(2, first.at(-1));
    const third = await listColoringArtworks(2, second.at(-1));
    expect([...first, ...second, ...third].map((a) => a.id)).toEqual([
      "e", "d", "c", "b", "a",
    ]);
    expect(await listColoringArtworks(2, third.at(-1))).toEqual([]);
    expect(await listColoringArtworks(0)).toEqual([]);
  });
  test("a slow legacy preview cannot overwrite a newer paint or cleared draft", async () => {
    const candidate = {
      key: draftRecordKey("p1"), pageId: "p1", lineArtRevision: 2,
      paintBlob: "data:legacy", thumbnailBlob: new Blob(["old preview"]),
      updatedAt: 0, hasPaint: true,
    };
    for (const hasPaint of [true, false]) {
      const current = {
        ...candidate, paintBlob: hasPaint ? "data:new paint" : "data:empty",
        thumbnailBlob: new Blob(["new preview"]), updatedAt: 10, hasPaint,
      };
      await saveColoringDraftRecord(current);
      expect(await migrateColoringDraftRecord(candidate)).toEqual(current);
      expect(await loadColoringDraftRecord("p1")).toEqual(current);
    }
  });
});
