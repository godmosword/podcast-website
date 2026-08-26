"use client";

import { useEffect } from "react";
import { recordReflectionShown } from "@/lib/engagement";
import type { ReflectionShownSource } from "@/lib/progress-store";
import styles from "./ReflectionPrompt.module.css";

type Props = {
  slug: string;
  source: ReflectionShownSource;
  child: string;
  parentFollowUp: string;
  accent?: string;
  compact?: boolean;
};

export default function ReflectionPrompt({
  slug,
  source,
  child,
  parentFollowUp,
  accent,
  compact = false,
}: Props) {
  useEffect(() => {
    recordReflectionShown(slug, source);
  }, [slug, source]);

  return (
    <section
      className={`${styles.wrap} ${compact ? styles.compact : ""}`}
      style={accent ? { ["--accent" as string]: accent } : undefined}
      aria-labelledby={`reflection-${slug}`}
    >
      <h2 id={`reflection-${slug}`} className={styles.heading}>
        一起想想看
      </h2>
      <p className={styles.child}>{child}</p>
      <p className={styles.parent}>
        <span className={styles.parentLabel}>給家長：</span>
        {parentFollowUp}
      </p>
    </section>
  );
}
