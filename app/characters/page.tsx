import type { Metadata } from "next";
import Link from "next/link";
import {
  allVehicles,
  getStoriesByVehicle,
  getVehicleCoverPath,
  getVehicleEmoji,
} from "@/data/stories";
import { getCharacter } from "@/data/characters";
import CharacterGarage, { type GarageItem } from "@/components/CharacterGarage";
import SiteFooter from "@/components/SiteFooter";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "車車角色圖鑑",
  description:
    "認識車車遊樂園的車車朋友：安安救護車、東東挖土機、鈴鈴清潔車、小紅賽車…聽過的車車會點亮你的收集車庫。",
};

export default function CharactersPage() {
  const items: GarageItem[] = allVehicles().map((vehicle) => {
    const stories = getStoriesByVehicle(vehicle);
    const character = getCharacter(vehicle);
    const latest = stories[0];
    return {
      vehicle,
      name: character?.name ?? vehicle,
      personality:
        character?.personality ?? `我是${vehicle}，快來聽我的故事吧！`,
      emoji: getVehicleEmoji(vehicle),
      cover: getVehicleCoverPath(vehicle),
      count: stories.length,
      latestSlug: latest?.slug ?? "",
      color: latest?.color ?? "#7048e8",
    };
  });

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>車車角色圖鑑</h1>
      <p className={styles.subtitle}>
        認識每一台車車朋友，聽過的車車會點亮你的收集車庫！
      </p>

      <CharacterGarage items={items} />

      <SiteFooter />
    </main>
  );
}
