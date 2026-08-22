"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import DuduMoment from "@/components/dudu/DuduMoment";
import { requestCelebration } from "@/lib/celebration";
import Sparkle from "./decor/Sparkle";
import decor from "./decor/decor.module.css";
import styles from "./StoryPlayer.module.css";

export type StoryEndReflectionPrompt = {
  child: string;
  parentFollowUp: string;
};

export type StoryEndReflectionComponentProps = {
  slug: string;
  child: string;
  parentFollowUp: string;
  accent?: string;
  compact?: boolean;
};

export type StoryEndScreenProps = {
  slug: string;
  title: string;
  color: string;
  backHref: string;
  nextStorySlug?: string;
  nextStoryTitle?: string;
  reflectionPrompt?: StoryEndReflectionPrompt;
  ReflectionComponent?: ComponentType<StoryEndReflectionComponentProps>;
  initialReflectionOpen?: boolean;
  onReplay: () => void;
};

export default function StoryEndScreen({
  slug,
  title,
  color,
  backHref,
  nextStorySlug,
  nextStoryTitle,
  reflectionPrompt,
  ReflectionComponent,
  initialReflectionOpen = false,
  onReplay,
}: StoryEndScreenProps) {
  const [reflectionOpen, setReflectionOpen] = useState(initialReflectionOpen);

  useEffect(() => {
    requestCelebration("story_end");
  }, []);

  const canOpenReflection = Boolean(reflectionPrompt && ReflectionComponent);
  const reflectionPanelId = `${slug}-quiet-reflection`;

  return (
    <div className={styles.endScreen}>
      <DuduMoment
        variant="badge"
        emotion="star"
        label="故事聽完了"
      />
      <Sparkle
        className={`${styles.endSparkle} ${styles.endSparkle1} ${decor.sparkleAnim}`}
        size={26}
      />
      <Sparkle
        className={`${styles.endSparkle} ${styles.endSparkle2} ${decor.sparkleAnim}`}
        size={18}
      />
      <p className={styles.endTitle}>故事聽完囉 🌙</p>
      <p className={styles.endSubtitle}>{title}</p>

      <div className={styles.endActions}>
        <button
          type="button"
          className={styles.endBtn}
          style={{ ["--play-bg" as string]: color }}
          onClick={onReplay}
        >
          再聽一次
        </button>
        <Link href={backHref} className={styles.endBtnSecondary}>
          回故事屋
        </Link>
        {nextStorySlug && nextStoryTitle && (
          <Link
            href={`/story/${nextStorySlug}/play`}
            className={styles.endBtnSecondary}
          >
            下一集：{nextStoryTitle}
          </Link>
        )}
      </div>

      {canOpenReflection ? (
        <div className={styles.endOptional}>
          {!reflectionOpen ? (
            <button
              type="button"
              className={styles.endPromptToggle}
              aria-expanded="false"
              aria-controls={reflectionPanelId}
              onClick={() => setReflectionOpen(true)}
            >
              想聊一下
            </button>
          ) : null}

          {reflectionOpen && reflectionPrompt && ReflectionComponent ? (
            <div id={reflectionPanelId} className={styles.endReflection}>
              <ReflectionComponent
                slug={slug}
                child={reflectionPrompt.child}
                parentFollowUp={reflectionPrompt.parentFollowUp}
                accent={color}
                compact
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
