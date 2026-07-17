import type { ReactNode } from "react";
import styles from "./StoryCoverMorph.module.css";

type StoryCoverMorphProps = {
  slug: string;
  children: ReactNode;
};

/**
 * 故事封面容器。
 * 保留穩定的 DOM 邊界，讓 CSS／瀏覽器原生導覽可漸進增強；不依賴 React Canary API。
 */
export default function StoryCoverMorph({
  slug,
  children,
}: StoryCoverMorphProps) {
  return (
    <div className={styles.root} data-story-cover={slug}>
      {children}
    </div>
  );
}
