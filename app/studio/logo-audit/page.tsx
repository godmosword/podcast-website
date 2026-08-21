import type { Metadata } from "next";
import Link from "next/link";
import LogoAuditBoard from "@/components/studio/LogoAuditBoard";
import { getCharacterLogos } from "@/data/character-logos";
import { samplePreviewRow } from "@/lib/studio/logo-color-audit";
import {
  collectLogoPreviews,
  listLogoPreviews,
} from "@/lib/studio/logo-preview";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "角色 Logo 驗收",
  description: "製作團隊用：32px 可辨識、撞型、家族色塊、staging 與取色比對。",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LogoAuditPage() {
  const logos = getCharacterLogos();
  const root = process.cwd();
  const preferredRaw = collectLogoPreviews(
    root,
    logos.map((logo) => logo.slug),
    32,
  );
  const preferred = Object.fromEntries(
    Object.entries(preferredRaw).map(([slug, item]) => [
      slug,
      item ? { src: item.src, kind: item.kind } : null,
    ]),
  );
  const staging = Object.fromEntries(
    logos.map((logo) => [
      logo.slug,
      listLogoPreviews(root, logo.slug).map((item) => ({
        src: item.src,
        file: item.file,
      })),
    ]),
  );
  const samples = [];
  for (const logo of logos) {
    const pick = preferredRaw[logo.slug];
    const staged = listLogoPreviews(root, logo.slug);
    const items = pick?.kind === "approved" ? [pick] : staged;
    for (const item of items) {
      samples.push(await samplePreviewRow(logo, item));
    }
  }

  return (
    <main className={styles.main}>
      <Link href="/studio" className={styles.back}>
        ← 回節目數據中心
      </Link>

      <h1 className={styles.title}>角色 Logo 驗收</h1>
      <p className={styles.subtitle}>
        35 張同一套系統，硬性標準是 32×32 可辨識。正式檔在{" "}
        <code>public/characters/logo/</code>
        ；尚未 approve 的候選吃 <code>public/.logo-staging/</code>
        （經 <code>/studio/logo-staging/</code> 載入）。單張拒絕規則與集合層測試寫在{" "}
        <code>docs/CHARACTER-LOGO-AUDIT.md</code>。
      </p>

      <LogoAuditBoard
        logos={logos}
        preferred={preferred}
        staging={staging}
        samples={samples}
      />
    </main>
  );
}
