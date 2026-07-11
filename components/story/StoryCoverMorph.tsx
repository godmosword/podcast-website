import { unstable_ViewTransition as ViewTransition } from "react";
import type { ReactNode } from "react";
import { storyCoverTransitionName } from "@/lib/story-cover-transition";
import styles from "./StoryCoverMorph.module.css";

type StoryCoverMorphProps = {
  slug: string;
  children: ReactNode;
};

/**
 * 故事封面共享元素轉場（D4 spike）。
 * 需 next.config `experimental.viewTransition: true`；不支援瀏覽器時無動畫退化。
 */
export default function StoryCoverMorph({
  slug,
  children,
}: StoryCoverMorphProps) {
  return (
    <ViewTransition
      name={storyCoverTransitionName(slug)}
      share="story-cover-morph"
      default="none"
    >
      <div className={styles.root}>{children}</div>
    </ViewTransition>
  );
}
