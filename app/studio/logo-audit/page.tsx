import type { Metadata } from "next";
import Link from "next/link";
import LogoAuditBoard from "@/components/studio/LogoAuditBoard";
import { getCharacterLogos } from "@/data/character-logos";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "角色 Logo 驗收",
  description: "製作團隊用：32px 可辨識、撞型、家族色塊與缺件檢查。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LogoAuditPage() {
  const logos = getCharacterLogos();

  return (
    <main className={styles.main}>
      <Link href="/studio" className={styles.back}>
        ← 回節目數據中心
      </Link>

      <h1 className={styles.title}>角色 Logo 驗收</h1>
      <p className={styles.subtitle}>
        35 張同一套系統，硬性標準是 32×32 可辨識。把 webp 放進{" "}
        <code>public/characters/logo/</code> 後重新整理即可看到圖；尚未進檔的角色顯示缺件佔位。單張拒絕規則與集合層測試寫在{" "}
        <code>docs/CHARACTER-LOGO-AUDIT.md</code>。
      </p>

      <LogoAuditBoard logos={logos} />
    </main>
  );
}
