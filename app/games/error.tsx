"use client";

import SegmentError from "@/components/errors/SegmentError";

export default function GamesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      scope="games"
      message="這個遊戲一時打不開，再試一次或換一個玩。"
      backHref="/games"
      backLabel="回遊樂園"
    />
  );
}
