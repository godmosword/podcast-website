"use client";

import {
  reopenIntroGate,
  shouldReplayIntroOverlay,
} from "@/lib/intro-gate";

const HERO_DISABLED = process.env.NEXT_PUBLIC_HERO_3D === "0";

export const REPLAY_INTRO_LABEL = "看小紅開進遊樂園";
export const REPLAY_INTRO_HREF = "/intro";
export const REPLAY_INTRO_GLYPH = "🚗";

/**
 * Landing 首段重回 3D 開場的次要入口。
 *
 * 真 `<a href="/intro">`：無 JS、修飾鍵、部署關掉 3D 時走進獨立頁。
 * 一般點擊攔截後重開同頁覆蓋層，網址留在 `/`，頂欄仍在。
 * 畫面只放車車 emoji，避免跟主 CTA 搶同一句長文案；可及名稱仍是完整句子。
 */
export default function ReplayIntroLink({ className }: { className?: string }) {
  return (
    <a
      href={REPLAY_INTRO_HREF}
      className={className}
      aria-label={REPLAY_INTRO_LABEL}
      title={REPLAY_INTRO_LABEL}
      data-testid="replay-intro"
      onClick={(event) => {
        if (
          !shouldReplayIntroOverlay({
            heroDisabled: HERO_DISABLED,
            button: event.button,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
          })
        ) {
          return;
        }
        event.preventDefault();
        reopenIntroGate();
      }}
    >
      <span aria-hidden="true">{REPLAY_INTRO_GLYPH}</span>
    </a>
  );
}
