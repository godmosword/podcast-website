"use client";

import { useState } from "react";
import ReflectionPrompt from "@/components/story/ReflectionPrompt";
import styles from "./StoryDetailReflection.module.css";

type StoryDetailReflectionProps = {
  slug: string;
  child: string;
  parentFollowUp: string;
  accent?: string;
};

/**
 * 詳情頁反思：比照 StoryEndScreen，預設收合，點「想聊一下」才展開（含家長句）。
 */
export default function StoryDetailReflection({
  slug,
  child,
  parentFollowUp,
  accent,
}: StoryDetailReflectionProps) {
  const [open, setOpen] = useState(false);
  const panelId = `detail-reflection-${slug}`;

  return (
    <section className={styles.wrap} aria-label="一起想想看">
      {!open ? (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded="false"
          aria-controls={panelId}
          onClick={() => setOpen(true)}
        >
          想聊一下
        </button>
      ) : null}

      {open ? (
        <div id={panelId}>
          <ReflectionPrompt
            slug={slug}
            child={child}
            parentFollowUp={parentFollowUp}
            accent={accent}
          />
        </div>
      ) : null}
    </section>
  );
}
