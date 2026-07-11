import type { DuduEmotion } from "@/data/dudu-emotions";
import { DUDU_EMOTION_LABEL, emotionSrc } from "@/data/dudu-emotions";
import styles from "./DuduSprite.module.css";

type DuduSpriteProps = {
  emotion: DuduEmotion;
  className?: string;
  /** 裝飾用時 alt 留空。 */
  decorative?: boolean;
};

/** 嘟嘟表情 primitive（單張 sprite + 換圖 pop）。 */
export default function DuduSprite({
  emotion,
  className,
  decorative = true,
}: DuduSpriteProps) {
  const classes = [styles.sprite, className].filter(Boolean).join(" ");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={emotion}
      src={emotionSrc(emotion)}
      alt={decorative ? "" : `嘟嘟小紅車：${DUDU_EMOTION_LABEL[emotion]}`}
      decoding="async"
      className={classes}
      aria-hidden={decorative || undefined}
    />
  );
}
