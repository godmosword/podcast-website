import type { Metadata } from "next";
import { ParentSectionArticleList } from "@/components/for-parents/ParentSectionArticleList";
import { ParentSectionPage } from "@/components/for-parents/ParentSectionPage";
import JsonLd from "@/components/JsonLd";
import { breadcrumbListJsonLd } from "@/lib/json-ld";
import { pageSocialMetadata } from "@/lib/page-social-metadata";
import {
  TRAVEL_ABROAD_LEDE,
  listTravelAbroadArticles,
  listTravelAbroadArticlesByRecency,
  travelAbroadArticlePath,
  travelAbroadIndexPath,
} from "@/lib/parent-travel-abroad";
import { parentSection } from "@/lib/parent-sections";

const section = parentSection("parent-travel-abroad");
const articles = listTravelAbroadArticles();
const description = articles.length > 0 ? TRAVEL_ABROAD_LEDE : section.description;
const latestArticle = listTravelAbroadArticlesByRecency()[0];

export const metadata: Metadata = {
  title: section.label,
  description,
  alternates: { canonical: section.href },
  ...(articles.length === 0
    ? { robots: { index: false, follow: false } }
    : {
        ...pageSocialMetadata({
          title: `${section.label} · 車車遊樂園`,
          description,
          url: section.href,
          type: "website",
          image: latestArticle?.coverImage,
          imageAlt: latestArticle?.coverAlt,
        }),
      }),
};

export default function ParentTravelAbroadPage() {
  const listed = listTravelAbroadArticlesByRecency();
  if (listed.length === 0) {
    return <ParentSectionPage title={section.label} />;
  }

  return (
    <ParentSectionPage title={section.label} lede={TRAVEL_ABROAD_LEDE}>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "車車遊樂園", url: "/" },
          { name: section.label, url: travelAbroadIndexPath() },
        ])}
      />
      <ParentSectionArticleList articles={listed} hrefFor={travelAbroadArticlePath} />
    </ParentSectionPage>
  );
}
