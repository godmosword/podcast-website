import type { Metadata } from "next";
import { getCharacters } from "@/data/characters";
import CharacterCatalogGrid from "@/components/characters/CharacterCatalogGrid";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import {
  breadcrumbListJsonLd,
  characterCreativeWorkJsonLd,
  faqPageJsonLd,
} from "@/lib/json-ld";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import styles from "./page.module.css";

const characterFaqs = [
  {
    question: "角色圖鑑裡的角色是誰？",
    answer:
      "有主持人 Bonbon、馬米，還有清潔車、救護車、挖土機等一台台有個性的車車朋友。",
  },
  {
    question: "這些角色會出現在哪些故事集數？",
    answer:
      "每張角色卡都會列出出場故事；也可以到主題或車種頁，依角色喜歡的主題找到更多集數。",
  },
  {
    question: "孩子要怎麼認識這些角色？",
    answer:
      "先聽故事認識角色的聲音與個性，再回到這頁看角色圖鑑，加深印象、對照車種。",
  },
];

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
      <JsonLd data={faqPageJsonLd(characterFaqs)} />
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: "角色圖鑑", url: "/characters" },
        ])}
      />

      <header className={styles.header}>
        <p className={styles.eyebrow}>車車遊樂園原創角色</p>
        <h1 id="characters-title" className={styles.title}>
          角色圖鑑
        </h1>
        <p className={styles.intro}>
          認識車車遊樂園的原創角色：車種、個性與出場故事。聽完故事就會認識新朋友！
        </p>
        <p className={styles.meta}>{characters.length} 位角色</p>
      </header>

      <CharacterCatalogGrid characters={characters} />

      <section className={styles.faqSection} aria-labelledby="characters-faq-title">
        <h2 id="characters-faq-title">
          <span className="marker">關於角色圖鑑，家長常問</span>
        </h2>
        {characterFaqs.map((faq) => (
          <div key={faq.question} className={styles.faqItem}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </section>

      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
