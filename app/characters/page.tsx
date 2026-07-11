import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCharacters } from "@/data/characters";
import { getStory } from "@/data/content";
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
          認識車車遊樂園的原創角色：車種、個性與出場故事。
        </p>
      </section>

      <section className={styles.grid} aria-label="角色清單">
        {characters.map((character) => (
          <article
            key={character.id}
            id={character.id}
            className={styles.card}
          >
            {character.ref && (
              <div className={styles.portraitWrap}>
                <Image
                  src={`/${character.ref}`}
                  alt={`${character.name} 角色圖`}
                  fill
                  sizes="(max-width: 720px) 44vw, (max-width: 1100px) 28vw, 220px"
                  className={styles.portrait}
                />
              </div>
            )}
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{character.name}</h2>
              <p className={styles.vehicle}>{character.vehicle}</p>
              <p className={styles.personality}>{character.personality}</p>
              {character.appearsIn.length > 0 && (
                <div className={styles.storyLinks} aria-label="出場故事">
                  {character.appearsIn.map((slug) => {
                    const story = getStory(slug);
                    if (!story) return null;
                    return (
                      <Link
                        key={slug}
                        href={`/story/${story.slug}`}
                        className={styles.storyLink}
                      >
                        EP {story.ep}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
