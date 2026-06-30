"use client";

import { roamerPngToWebp } from "@/lib/universe/roamer-art-src";

type Props = {
  pngSrc: string;
  className: string;
  /** front 預設 auto；rear 建議 low */
  fetchPriority?: "high" | "low" | "auto";
};

export default function RoamerSpritePicture({
  pngSrc,
  className,
  fetchPriority = "auto",
}: Props) {
  const webpSrc = roamerPngToWebp(pngSrc);

  return (
    <picture>
      <source type="image/webp" srcSet={webpSrc} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pngSrc}
        alt=""
        className={className}
        draggable={false}
        decoding="async"
        fetchPriority={fetchPriority === "auto" ? undefined : fetchPriority}
      />
    </picture>
  );
}
