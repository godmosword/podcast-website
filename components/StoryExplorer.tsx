"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Story } from "@/data/stories";
import { ChipButton } from "./Chip";
import StoryWall from "./StoryWall";
import styles from "./StoryExplorer.module.css";

type StoryExplorerProps = {
  /** 已依車種等 Server 端篩選後的故事清單 */
  stories: Story[];
  /** 全站主題標籤（allTags） */
  tags: string[];
};

/**
 * 故事牆 + 主題標籤即時篩選（client state，不刷新整頁）。
 */
export default function StoryExplorer({ stories, tags }: StoryExplorerProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeTag === null) return stories;
    return stories.filter((s) => (s.tags ?? []).includes(activeTag));
  }, [stories, activeTag]);

  return (
    <div className={styles.wrap}>
      <div className={styles.topicBlock}>
        <p className={styles.groupLabel}>🏷️ 依主題找故事</p>
        <div className={styles.chips} role="group" aria-label="主題標籤篩選">
          <ChipButton
            active={activeTag === null}
            onClick={() => setActiveTag(null)}
            className={styles.topicChip}
          >
            全部
          </ChipButton>
          {tags.map((tag) => (
            <ChipButton
              key={tag}
              active={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={styles.topicChip}
            >
              {tag}
            </ChipButton>
          ))}
        </div>
        <p className={styles.topicHint}>
          點標籤立即篩選；也可
          <Link href="/topic" className={styles.topicIndexLink}>
            瀏覽主題分類頁
          </Link>
          分享給朋友。
        </p>
      </div>

      <p className={styles.count}>
        {filtered.length} 則故事
        {activeTag && (
          <button
            type="button"
            className={styles.clearTag}
            onClick={() => setActiveTag(null)}
          >
            清除主題篩選
          </button>
        )}
      </p>

      <StoryWall stories={filtered} />
    </div>
  );
}
