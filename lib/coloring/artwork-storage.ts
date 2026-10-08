import {
  coloringTransaction,
  listColoringValues,
  readColoringValue,
} from "./storage-db";
export type ArtworkPreview = {
  id: string;
  pageId: string;
  title: string;
  lineArtRevision: number;
  createdAt: number;
  thumbnailBlob: Blob;
};
export type ColoringArtwork = ArtworkPreview & { compositeBlob: Blob };
export async function saveColoringArtwork(
  artwork: ColoringArtwork,
): Promise<void> {
  const preview: ArtworkPreview = {
    id: artwork.id,
    pageId: artwork.pageId,
    title: artwork.title,
    lineArtRevision: artwork.lineArtRevision,
    createdAt: artwork.createdAt,
    thumbnailBlob: artwork.thumbnailBlob,
  };
  await coloringTransaction<void>(
    ["artworks", "artwork-previews"],
    "readwrite",
    (tx) => {
      tx.objectStore("artworks").add(artwork);
      tx.objectStore("artwork-previews").add(preview);
    },
  );
}
export function listColoringArtworks(
  limit = 12,
  before?: number | Pick<ArtworkPreview, "createdAt" | "id">,
): Promise<ArtworkPreview[]> {
  if (typeof indexedDB === "undefined") return Promise.resolve([]);
  return listColoringValues(
    "artwork-previews",
    "createdAt",
    limit,
    typeof before === "number" || before === undefined
      ? before
      : { value: before.createdAt, key: before.id },
  );
}
/** 收藏過作品的頁面 id（選頁卡片貼「塗過」用）；沒有 IndexedDB 時回空集合。 */
export async function listColoredPageIds(): Promise<Set<string>> {
  if (typeof indexedDB === "undefined") return new Set();
  const previews = await coloringTransaction<ArtworkPreview[]>(
    "artwork-previews",
    "readonly",
    (tx, result) => {
      const req = tx.objectStore("artwork-previews").getAll();
      req.onsuccess = () => result(req.result as ArtworkPreview[]);
    },
  );
  return new Set(previews.map((p) => p.pageId));
}
export function loadColoringArtwork(
  id: string,
): Promise<ColoringArtwork | undefined> {
  return readColoringValue("artworks", id);
}
/** Remove the completed copy and its preview together. */
export function deleteColoringArtwork(id: string): Promise<void> {
  return coloringTransaction<void>(
    ["artworks", "artwork-previews"],
    "readwrite",
    (tx) => {
      tx.objectStore("artworks").delete(id);
      tx.objectStore("artwork-previews").delete(id);
    },
  );
}
