import type { PlaygroundType } from "@/data/playgrounds";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import styles from "./PlayMap.module.css";

type PlaygroundTypeMarkProps = {
  type: PlaygroundType;
};

function Glyph({ type }: { type: PlaygroundType }) {
  switch (type) {
    case "公園":
      return (
        <>
          <ellipse cx="12" cy="10" rx="6.2" ry="6.5" />
          <rect x="10.6" y="15" width="2.8" height="5.8" rx="0.8" />
        </>
      );
    case "室內樂園":
      return (
        <path d="M4.2 11.4 12 4.6l7.8 6.8V20H4.2v-8.6Zm4.2 8.6v-5h7.2v5H8.4Z" />
      );
    case "主題樂園":
      return (
        <path d="M12 3.4 13.8 9.2h6.1l-4.9 3.6 1.9 5.8L12 15.2 7.1 18.6l1.9-5.8-4.9-3.6h6.1L12 3.4Z" />
      );
    case "博物館":
      return (
        <path d="M3.8 8.8 12 3.8l8.2 5v1.6H3.8V8.8Zm2 3.4h2.4V19H5.8v-6.8Zm5.2 0h2.4V19h-2.4v-6.8Zm5.2 0h2.4V19h-2.4v-6.8ZM3.8 19.2h16.4V21H3.8v-1.8Z" />
      );
    case "動物園":
      return (
        <path d="M7.6 9.1c0-1.6 1.2-2.8 2.6-2.8.7 0 1.3.3 1.8.8.5-.5 1.1-.8 1.8-.8 1.4 0 2.6 1.2 2.6 2.8 0 2.6-2.7 4-4.4 5.7-1.7-1.7-4.4-3.1-4.4-5.7Zm-1 7.6c1.3-1.5 3.1-2.4 5.4-2.4s4.1.9 5.4 2.4c.3.4.1 1-.4 1.2-1.5.4-3.2.7-5 .7s-3.5-.3-5-.7c-.5-.2-.7-.8-.4-1.2Z" />
      );
    case "農場":
      return (
        <path d="M5.4 11.2 12 5.6l6.6 5.6V20H5.4v-8.8Zm9.2 0V20H5.4M8.6 13.6h2.6v3.2H8.6v-3.2Z" />
      );
    case "其他":
      return <circle cx="12" cy="12" r="3.4" />;
  }
}

/** 類型色塊＋簡圖，純裝飾。 */
export function PlaygroundTypeMark({ type }: PlaygroundTypeMarkProps) {
  return (
    <span
      className={styles.typeSwatch}
      data-type={playgroundTypeVisualKey(type)}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <Glyph type={type} />
      </svg>
    </span>
  );
}
