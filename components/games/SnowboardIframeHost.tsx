"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { snowboardAdapter } from "@/lib/gamekit/games/snowboard/adapter";
import { GAMES } from "@/data/games";

const SNOWBOARD_META = GAMES.find((game) => game.slug === "snowboard");

type SnowboardIframeHostProps = {
  /** @deprecated The Snowboard route now owns the versioned iframe source. */
  src?: string;
  title?: string;
  className?: string;
};

/**
 * Backwards-compatible name for older imports.
 *
 * Snowboard is now hosted through GameHost/SnowboardView so settings,
 * progress and iframe message validation cannot drift between entry points.
 */
export function SnowboardIframeHost({
  src: _src,
  title = "阿蹦雪山衝刺",
  className,
}: SnowboardIframeHostProps) {
  void _src;
  return (
    <GameHost
      adapter={snowboardAdapter}
      title={title}
      tutorial={SNOWBOARD_META?.tutorial ?? []}
      className={className}
    />
  );
}
