import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/site-url";

type PageSocialMetadataInput = {
  title: string;
  description: string;
  url: string;
  type: "website" | "article";
  image?: string;
  imageAlt?: string;
  publishedTime?: string;
};

/** 子頁 openGraph 會覆蓋 layout 預設，故每頁一併明確提供 OG 與 Twitter 欄位。 */
export function pageSocialMetadata({
  title,
  description,
  url,
  type,
  image = DEFAULT_OG_IMAGE,
  imageAlt = "車車遊樂園吉祥物",
  publishedTime,
}: PageSocialMetadataInput): Pick<Metadata, "openGraph" | "twitter"> {
  const images = [{ url: image, alt: imageAlt }];
  const openGraph =
    type === "article"
      ? { title, description, url, type, publishedTime, images }
      : { title, description, url, type, images };

  return {
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
