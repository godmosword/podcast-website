"use client";

import SegmentError from "@/components/errors/SegmentError";

export default function UniverseMapError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="adventures"
      message="地圖一時載不出來，再試一次就會回來。"
      backHref="/adventures"
      backLabel="回樂園地圖"
    />
  );
}
