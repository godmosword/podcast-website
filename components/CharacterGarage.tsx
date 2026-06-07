"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MET_CHANGE_EVENT, getMetVehicles } from "@/lib/met-characters";
import styles from "./CharacterGarage.module.css";

export type GarageItem = {
  vehicle: string;
  name: string;
  personality: string;
  emoji: string;
  cover: string | null;
  count: number;
  latestSlug: string;
  color: string;
};

type CharacterGarageProps = {
  items: GarageItem[];
};

/**
 * 角色車庫：聽過的車車「認識了！」會點亮並蓋章；沒聽過的仍完整顯示（SEO/no-JS 友善），
 * 收集狀態為純客戶端增強。SSR 初值 met=[]，掛載後讀 localStorage，避免 hydration mismatch。
 */
export default function CharacterGarage({ items }: CharacterGarageProps) {
  const [met, setMet] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setMet(getMetVehicles());
    sync();
    window.addEventListener(MET_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MET_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const metCount = items.filter((i) => met.includes(i.vehicle)).length;
  const pct = items.length > 0 ? Math.round((metCount / items.length) * 100) : 0;

  return (
    <div>
      <div className={styles.progress}>
        <span className={styles.progressLabel}>
          已認識 <strong>{metCount}</strong> / {items.length} 台車車
        </span>
        <span className={styles.progressTrack} aria-hidden>
          <span className={styles.progressFill} style={{ width: `${pct}%` }} />
        </span>
      </div>

      <ul className={styles.grid}>
        {items.map((item) => {
          const isMet = met.includes(item.vehicle);
          return (
            <li key={item.vehicle}>
              <Link
                href={`/story/${item.latestSlug}`}
                className={`${styles.card} ${isMet ? styles.cardMet : ""}`}
                style={{ ["--accent" as string]: item.color }}
              >
                <span className={styles.avatarWrap}>
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover}
                      alt=""
                      className={styles.avatar}
                      width={84}
                      height={84}
                      aria-hidden
                    />
                  ) : (
                    <span className={styles.avatarEmoji} aria-hidden>
                      {item.emoji}
                    </span>
                  )}
                  {isMet && (
                    <span className={styles.stamp} aria-hidden>
                      ✓
                    </span>
                  )}
                </span>

                <span className={styles.name}>{item.name}</span>
                <span className={styles.vehicle}>{item.vehicle}</span>
                <span className={styles.personality}>{item.personality}</span>

                <span className={styles.foot}>
                  {isMet ? (
                    <span className={styles.metTag}>認識了！</span>
                  ) : (
                    <span className={styles.newTag}>還沒聽過</span>
                  )}
                  <span className={styles.count}>看 {item.count} 集 →</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
