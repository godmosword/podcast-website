import type { ColoringPage } from "@/data/coloring-pages";
import {
  canvasBlob,
  composeColoring,
  decodeColoringImage,
  thumbnailCanvas,
} from "./bitmap";
import {
  loadColoringDraftRecord,
  listColoringDraftRecords,
  migrateColoringDraftRecord,
  type ColoringDraftRecord,
} from "./draft-storage";
/** Only original catalog entries are eligible for migration; the v1 store is never removed. */
export async function catalogColoringDrafts(
  pages: readonly ColoringPage[],
): Promise<ColoringDraftRecord[]> {
  const records = await listColoringDraftRecords();
  for (const page of pages) {
    const key = `${page.id}@r${page.lineArtRevision}`;
    let record = records.find((r) => r.key === key);
    if (!record)
      record =
        (await loadColoringDraftRecord(page.id, page.lineArtRevision)) ??
        undefined;
    if (!record || !record.hasPaint) continue;
    if (!record.thumbnailBlob) {
      const [paint, line] = await Promise.all([
        decodeColoringImage(record.paintBlob),
        decodeColoringImage(page.lineArtSrc),
      ]);
      const thumbnailBlob = await canvasBlob(
        thumbnailCanvas(
          composeColoring(paint, line, line.naturalWidth, line.naturalHeight),
        ),
      );
      record = { ...record, thumbnailBlob };
      record = await migrateColoringDraftRecord(record);
    }
    if (!records.some((r) => r.key === key)) records.push(record);
    else
      records.splice(
        records.findIndex((r) => r.key === key),
        1,
        record,
      );
  }
  return records
    .filter((r) => r.hasPaint)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
