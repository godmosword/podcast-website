"use client";

import SegmentError from "@/components/errors/SegmentError";

export default function PlayMapError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="for-parents/play-map"
      message="景點地圖一時載不出來，再試一次就會回來。"
      backHref="/for-parents"
      backLabel="回親子指南"
    />
  );
}
