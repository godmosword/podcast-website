"use client";

import type { CSSProperties } from "react";
import type { ZoneArtSrcSet } from "@/lib/universe/zone-art-src";

type Props = {
  artSrc: ZoneArtSrcSet;
  className?: string;
  style?: CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  draggable?: boolean;
  decoding?: "async" | "auto" | "sync";
};

/** 島 tile / 遮罩：WebP 優先，PNG fallback。 */
export default function ArtSrcPicture({
  artSrc,
  className,
  style,
  onLoad,
  onError,
  draggable = false,
  decoding = "async",
}: Props) {
  return (
    <picture>
      <source type="image/webp" srcSet={artSrc.webpSrcSet} sizes={artSrc.sizes} />
      <img
        src={artSrc.src}
        srcSet={artSrc.srcSet}
        sizes={artSrc.sizes}
        alt=""
        aria-hidden="true"
        className={className}
        style={style}
        draggable={draggable}
        decoding={decoding}
        onLoad={onLoad}
        onError={onError}
      />
    </picture>
  );
}
