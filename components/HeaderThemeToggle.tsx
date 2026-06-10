"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { FEATURES } from "@/lib/features";

/** 首頁標語列旁的夜晚模式切換（僅圖示）。 */
export default function HeaderThemeToggle() {
  if (!FEATURES.nightMode) return null;
  return <ThemeToggle iconOnly />;
}
