/* eslint-disable @next/next/no-img-element -- 完成面作品快照是本機 Blob URL */
"use client";

import Link from "next/link";
import StarBurst from "@/components/celebration/StarBurst";
import { GameEndStation } from "@/components/games/GameEndStation";
import type { ColoringPage } from "@/data/coloring-pages";
import { createRadialBurstParticles } from "@/lib/celebration-dom";
import styles from "./ColoringCanvas.module.css";

const DONE_BURST = createRadialBurstParticles({
  count: 8,
  radius: 72,
  seed: 3,
  colors: ["#f2c94c", "#e85d4c", "#56ccf2", "#6fcf97", "#f781c6"],
});

type ColoringDoneSheetProps = {
  page: ColoringPage;
  snapshotUrl: string | null;
  collectionStatus: string;
  saveFailed: boolean;
  /** 還沒收好時不放「看這個故事」：那個連結不經過離開提醒。 */
  unsaved: boolean;
  onReplay: () => void;
  onChangePage: () => void;
  onRetrySave: () => void;
  onDownload: () => void;
  onShare: () => void;
  onPrint: () => void;
  onStartNew: () => void;
};

/** 「塗好了！」完成面：作品快照＋再塗／換一張＋存圖、分享、列印。 */
export function ColoringDoneSheet({
  page,
  snapshotUrl,
  collectionStatus,
  saveFailed,
  unsaved,
  onReplay,
  onChangePage,
  onRetrySave,
  onDownload,
  onShare,
  onPrint,
  onStartNew,
}: ColoringDoneSheetProps) {
  return (
    <div className={styles.doneOverlay} role="presentation">
      <div className={styles.doneSheet}>
        <div className={styles.doneBurst}>
          {snapshotUrl ? (
            <img
              className={styles.doneSnapshot}
              src={snapshotUrl}
              alt=""
              aria-hidden="true"
              data-testid="coloring-done-snapshot"
            />
          ) : null}
          <StarBurst particles={DONE_BURST} />
        </div>
        <GameEndStation
          mood="win"
          title="塗好了！"
          gameSlug="coloring-book"
          onReplay={onReplay}
          replayLabel="再塗這一張"
          mainAction={{ label: "換一張塗", icon: "page", onClick: onChangePage }}
          details={<p role="status">{collectionStatus}</p>}
          extraActions={
            <div className={styles.doneActions}>
              {saveFailed ? (
                <button type="button" onClick={onRetrySave}>
                  重試收藏
                </button>
              ) : null}
              <button type="button" onClick={onDownload}>
                存圖片
              </button>
              <button type="button" onClick={onShare}>
                分享作品
              </button>
              <button type="button" onClick={onPrint}>
                列印作品
              </button>
              <button type="button" onClick={onStartNew}>
                開新稿
              </button>
              {page.storySlug && !unsaved ? (
                <Link href={`/story/${page.storySlug}`}>看這個故事</Link>
              ) : null}
            </div>
          }
        />
      </div>
    </div>
  );
}
