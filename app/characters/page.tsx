import type { Metadata } from "next";
import { getCharacters } from "@/data/characters";
import CharacterCatalogGrid from "@/components/characters/CharacterCatalogGrid";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { characterCreativeWorkJsonLd } from "@/lib/json-ld";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "角色圖鑑",
  description:
    "車車遊樂園原創角色圖鑑：認識 Bonbon、馬米和每一台車車朋友，查看角色個性與出場故事。",
  alternates: { canonical: "/characters" },
  other: { dateModified: STATIC_PAGE_MODIFIED_DATES["/characters"] },
  openGraph: {
    title: "角色圖鑑 · 車車遊樂園",
    description:
      "認識車車遊樂園的原創角色、車種、個性與出場故事。",
    url: "/characters",
    type: "website",
  },
};

export default function CharactersPage() {
  const characters = getCharacters();

  return (
    <main className={styles.main}>
      <JsonLd data={characterCreativeWorkJsonLd(characters)} />
      <SiteHeader />

      <section className={styles.hero} aria-labelledby="characters-title">
        <p className={styles.eyebrow}>車車遊樂園原創角色</p>
        <h1 id="characters-title" className={styles.title}>
          角色圖鑑
        </h1>
        <p className={styles.intro}>
          認識車車遊樂園的原創角色：車種、個性與出場故事。聽完故事就會認識新朋友！
        </p>
      </section>

      <CharacterCatalogGrid characters={characters} />

      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
