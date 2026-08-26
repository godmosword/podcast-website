import { existsSync } from "node:fs";
import { join } from "node:path";
import { getStory, getStories } from "@/data/content";
import queueFile from "@/data/illustration-queue.json";
import {
  listAwaitingIllustrations,
  parseIllustrationQueue,
  reconcileIllustrationQueue,
  type IllustrationQueueItem,
} from "@/data/illustration-queue";

export type StudioIllustrationQueueRow = IllustrationQueueItem & {
  title: string;
};

/** 路徑字面量須靜態，避免 Turbopack 把 existsSync 追蹤成整個專案。 */
function isSubtitleReadyOnDisk(slug: string): boolean {
  return existsSync(
    join(process.cwd(), "data", "subtitles", "_proofread", `${slug}.json`),
  );
}

export function pendingIllustrationsForStudio(): StudioIllustrationQueueRow[] {
  const overlay = parseIllustrationQueue(queueFile);
  const stories = getStories();
  const reconciled = reconcileIllustrationQueue({
    stories,
    overlay,
    isSubtitleReady: isSubtitleReadyOnDisk,
  });
  return listAwaitingIllustrations(reconciled).map((item) => ({
    ...item,
    title: getStory(item.slug)?.title ?? item.slug,
  }));
}
