"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { FEATURES } from "@/lib/features";

/** 首頁 hero 右上角的主題切換（日／夜／系統 文字段控）。 */
export default function HeaderThemeToggle() {
  if (!FEATURES.nightMode) return null;
  return <ThemeToggle textOnly />;
}
