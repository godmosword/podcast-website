/* eslint-disable @next/next/no-img-element -- 完成面作品快照是本機 Blob URL */
"use client";

import Link from "next/link";
import { useId, useState } from "react";
import StarBurst from "@/components/celebration/StarBurst";
import { GameEndStation } from "@/components/games/GameEndStation";
import Icon from "@/components/ui/Icon";
import type { ColoringPage } from "@/data/coloring-pages";
import { createRadialBurstParticles } from "@/lib/celebration-dom";
import { CrayonIcon } from "./ColoringToolbarIcons";
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

/**
 * 「塗好了！」完成面：孩子只看到作品、「換一張塗」（主）與「繼續塗」（次）。
 * 存圖、分享、列印、開新稿、看故事收進「給大人」一列，預設收起；
 * 收藏失敗時直接展開，因為狀態句會叫大人下載保存。
 */
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
  const [grownUpOpen, setGrownUpOpen] = useState(saveFailed);
  const grownUpId = useId();
  const showGrownUp = grownUpOpen || saveFailed;
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
          replayLabel="繼續塗這一張"
          replayIcon={<CrayonIcon className={styles.doneCrayon} />}
          mainAction={{ label: "換一張塗", icon: "page", onClick: onChangePage }}
          details={<p role="status">{collectionStatus}</p>}
          extraActions={
            <div className={styles.doneGrownUp}>
              {saveFailed ? (
                <div className={styles.doneActions}>
                  <button type="button" onClick={onRetrySave}>
                    重試收藏
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.doneGrownUpToggle}
                  aria-expanded={showGrownUp}
                  aria-controls={grownUpId}
                  onClick={() => setGrownUpOpen((value) => !value)}
                >
                  <Icon name="chevron-right" size={16} className={`icon-lead ${styles.doneGrownUpChevron}`} />
                  給大人：存圖・分享・列印
                </button>
              )}
              {showGrownUp ? (
                <div id={grownUpId} className={styles.doneActions}>
                  <button type="button" onClick={onDownload}>
                    存圖片
                  </button>
                  <button type="button" onClick={onShare}>
                    分享作品
                  </button>
                  <button type="button" onClick={onPrint}>
                    列印作品
                  </button>
                  {/* 開新稿會直接清掉畫布：作品還沒收好時不放，免得孩子一點就沒了 */}
                  {!saveFailed && !unsaved ? (
                    <button type="button" onClick={onStartNew}>
                      開新稿
                    </button>
                  ) : null}
                  {page.storySlug && !unsaved ? (
                    <Link href={`/story/${page.storySlug}`}>看這個故事</Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          }
        />
      </div>
    </div>
  );
}
