"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { candyKartAdapter } from "@/lib/gamekit/games/candy-kart/adapter";
import { GAMES } from "@/data/games";

const CANDY_KART_META = GAMES.find((g) => g.slug === "candy-kart");

type CandyKartIframeHostProps = {
  /** @deprecated 由 adapter／debugFinish URL 決定；保留相容。 */
  src?: string;
  title?: string;
  className?: string;
};

/**
 * 薄包裝：GameHost + candyKartAdapter。
 * iframe／postMessage 實作見 `CandyKartView`；契約見 `candy-kart-bridge`。
 */
export function CandyKartIframeHost(_props: CandyKartIframeHostProps = {}) {
  void _props;
  return (
    <GameHost
      adapter={candyKartAdapter}
      title="繽紛卡丁車"
      tutorial={CANDY_KART_META?.tutorial ?? []}
    />
  );
}
