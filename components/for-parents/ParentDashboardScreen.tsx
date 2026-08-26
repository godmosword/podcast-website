"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParentDashboard } from "@/components/for-parents/ParentDashboard";
import ParentGate from "@/components/for-parents/ParentGate";
import { readParentGatePassed } from "@/lib/parent-gate";
import styles from "./parent-dashboard.module.css";

/**
 * 家庭儀表板 client 殼：未通過家長閘門前不渲染進度與設定。
 */
export function ParentDashboardScreen() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(readParentGatePassed());
  }, []);

  if (!unlocked) {
    return <ParentGate onPass={() => setUnlocked(true)} />;
  }

  return (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>STEM-P3 家長端</p>
        <h1 className={styles.title}>家庭儀表板</h1>
        <p className={styles.lede}>
          在這台裝置上，看看孩子最近聽了什麼、玩了哪些小遊戲。不做成績排名，只幫家長掌握共讀與探索節奏。
        </p>
        <Link href="/for-parents" className={styles.guideLink}>
          ← 回到親子指南
        </Link>
      </header>
      <ParentDashboard />
    </>
  );
}
