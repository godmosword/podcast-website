"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStory } from "@/data/stories";
import { loadContinue } from "@/lib/continue-playback";
import styles from "./ContinueBanner.module.css";

export default function ContinueBanner() {
  const [href, setHref] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const saved = loadContinue();
    if (!saved) return;
    const story = getStory(saved.slug);
    if (!story) return;
    setHref(`/story/${saved.slug}/play`);
    setLabel(`繼續聽：${story.title}`);
  }, []);

  if (!href) return null;

  return (
    <Link href={href} className={styles.banner}>
      {label}
    </Link>
  );
}
