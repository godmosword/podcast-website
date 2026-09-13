"use client";

import SegmentError from "@/components/errors/SegmentError";

export default function StudioError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="studio"
      message="後台資料一時取不到，稍後再試。"
      backHref="/studio"
      backLabel="回後台首頁"
    />
  );
}
