import {
  coloringDraftKey,
  coloringDraftStorageKey,
  COLORING_LINEART_REV,
} from "@/lib/coloring/tools";
import {
  coloringTransaction,
  listColoringValues,
  readColoringValue,
} from "./storage-db";

export type ColoringDraft = Blob | string;
export type ColoringDraftRecord = {
  key: string;
  pageId: string;
  lineArtRevision: number;
  paintBlob: ColoringDraft;
  thumbnailBlob?: Blob;
  updatedAt: number;
  hasPaint: boolean;
};
export function draftRecordKey(
  pageId: string,
  revision = COLORING_LINEART_REV,
) {
  return `${pageId}@r${revision}`;
}

/** Throws read failures so a blank canvas never silently overwrites an unreadable draft. */
export async function loadColoringDraftRecord(
  pageId: string,
  revision = COLORING_LINEART_REV,
): Promise<ColoringDraftRecord | null> {
  if (typeof indexedDB === "undefined") return null;
  const record = await readColoringValue<ColoringDraftRecord>(
    "draft-records",
    draftRecordKey(pageId, revision),
  );
  if (record) return record;
  if (revision !== COLORING_LINEART_REV) return null;
  const legacy = await readColoringValue<ColoringDraft>(
    "drafts",
    coloringDraftStorageKey(pageId),
  );
  return legacy
    ? {
        key: draftRecordKey(pageId, revision),
        pageId,
        lineArtRevision: revision,
        paintBlob: legacy,
        updatedAt: 0,
        hasPaint: true,
      }
    : null;
}
export async function loadColoringDraft(
  pageId: string,
): Promise<ColoringDraft | null> {
  return (await loadColoringDraftRecord(pageId))?.paintBlob ?? null;
}
export async function saveColoringDraftRecord(
  record: ColoringDraftRecord,
): Promise<void> {
  await coloringTransaction<void>("draft-records", "readwrite", (tx) => {
    tx.objectStore("draft-records").put(record);
  });
}
export async function saveColoringDraft(
  pageId: string,
  draft: ColoringDraft,
): Promise<void> {
  await saveColoringDraftRecord({
    key: draftRecordKey(pageId),
    pageId,
    lineArtRevision: COLORING_LINEART_REV,
    paintBlob: draft,
    updatedAt: Date.now(),
    hasPaint: true,
  });
}
export async function clearColoringDraft(
  pageId: string,
  revision = COLORING_LINEART_REV,
): Promise<void> {
  await coloringTransaction<void>(
    ["drafts", "draft-records"],
    "readwrite",
    (tx) => {
      tx.objectStore("draft-records").delete(draftRecordKey(pageId, revision));
      if (revision === COLORING_LINEART_REV)
        tx.objectStore("drafts").delete(coloringDraftStorageKey(pageId));
    },
  );
  try {
    localStorage.removeItem(coloringDraftKey(pageId));
  } catch {
    /* old localStorage is optional */
  }
}
export async function listColoringDraftRecords(
  limit = 20,
): Promise<ColoringDraftRecord[]> {
  if (typeof indexedDB === "undefined") return [];
  return listColoringValues("draft-records", "updatedAt", limit);
}
/** Compatibility API; old original-store values remain readable until migrated by the catalog. */
export async function listColoringDrafts(): Promise<
  { pageId: string; draft: ColoringDraft }[]
> {
  return (await listColoringDraftRecords())
    .filter((r) => r.hasPaint)
    .map((r) => ({ pageId: r.pageId, draft: r.paintBlob }));
}

/** Migration cannot overwrite a newer edit produced while the preview was being composed. */
export async function migrateColoringDraftRecord(
  candidate: ColoringDraftRecord,
): Promise<ColoringDraftRecord> {
  return coloringTransaction<ColoringDraftRecord>(
    "draft-records",
    "readwrite",
    (tx, result) => {
      const store = tx.objectStore("draft-records"),
        req = store.get(candidate.key);
      req.onsuccess = () => {
        const current = req.result as ColoringDraftRecord | undefined;
        if (
          current &&
          (current.updatedAt !== candidate.updatedAt || current.thumbnailBlob)
        ) {
          result(current);
          return;
        }
        store.put(candidate);
        result(candidate);
      };
    },
  );
}
