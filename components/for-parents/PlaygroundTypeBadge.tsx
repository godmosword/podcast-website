import type { Playground } from "@/data/playgrounds";
import { playgroundTypeGlyphSvg } from "@/lib/playground-type-glyph";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import styles from "./PlaygroundTypeBadge.module.css";

/**
 * 類型黏土圓章：和地圖針同一組剪影與色相，名單、詳情、各地整理讀成同一套。
 * 旁邊一定有類型文字，所以圓章本身 aria-hidden。
 * 剪影字串是 lib/playground-type-glyph 的靜態常數，不含外部輸入。
 */
export function PlaygroundTypeBadge({ type }: { type: Playground["type"] }) {
  const key = playgroundTypeVisualKey(type);
  return (
    <span
      className={styles.badge}
      data-type={key}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: playgroundTypeGlyphSvg(key) }}
    />
  );
}
