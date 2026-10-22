import type { Story } from "@/data/content";
import FamilyActivityCard from "@/components/story/FamilyActivityCard";
import ShowNotes from "@/components/story/ShowNotes";
import Icon from "@/components/ui/Icon";
import styles from "./StoryCoListen.module.css";

export const STORY_CO_LISTEN_ID = "co-listen";

type CoListenFields = Pick<Story, "familyActivity" | "parentGuide" | "reflectionPrompt">;

export function hasStoryCoListen(story: CoListenFields): boolean {
  return (
    Boolean(story.familyActivity) ||
    Boolean(story.parentGuide) ||
    Boolean(story.reflectionPrompt)
  );
}

type StoryCoListenProps = {
  story: Story;
  /** 外框沿用故事頁「故事大綱」的卡片與摘要樣式，兩個收合區長得一樣。 */
  className?: string;
  summaryClassName?: string;
  iconClassName?: string;
};

/**
 * 本集的「給爸媽：一起聊聊」：親子小活動、家長指引、聽完提問。
 * 預設展開，且這一頁只出現這一次。原本集中在 /for-parents#co-listen 的總表，
 * 2026-10-18 搬回各集頁。
 */
export default function StoryCoListen({
  story,
  className,
  summaryClassName,
  iconClassName,
}: StoryCoListenProps) {
  if (!hasStoryCoListen(story)) return null;

  return (
    <details id={STORY_CO_LISTEN_ID} className={className} open>
      <summary className={summaryClassName}>
        <Icon name="chevron-right" size={18} className={`icon-lead icon-disclosure ${iconClassName ?? ""}`} />
        給爸媽：一起聊聊
      </summary>
      <div className={styles.body}>
        {story.familyActivity ? (
          <FamilyActivityCard
            slug={story.slug}
            familyActivity={story.familyActivity}
          />
        ) : null}
        {story.parentGuide ? (
          <ShowNotes slug={story.slug} parentGuide={story.parentGuide} />
        ) : null}
        {story.reflectionPrompt ? (
          <div className={styles.reflection}>
            <p className={styles.reflectionChild}>{story.reflectionPrompt.child}</p>
            <p className={styles.reflectionParent}>
              給家長：{story.reflectionPrompt.parentFollowUp}
            </p>
          </div>
        ) : null}
      </div>
    </details>
  );
}
