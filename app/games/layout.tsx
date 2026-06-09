import type { ReactNode } from "react";

/** 遊樂園區塊共用語意結構（Phase 8 a11y）。 */
export default function GamesLayout({ children }: { children: ReactNode }) {
  return <section aria-label="車車遊樂園">{children}</section>;
}
