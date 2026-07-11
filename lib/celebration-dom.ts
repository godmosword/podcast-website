/** DOM 慶祝 adapter：星星迸發粒子（重用 motion.css star-burst-particle）。 */

export type BurstParticle = {
  id: number;
  x: string;
  y: string;
  symbol?: string;
  color?: string;
  fontSize?: number;
};

export type RadialBurstOptions = {
  count?: number;
  radius?: number;
  seed?: number;
  symbols?: readonly string[];
  colors?: readonly string[];
};

const DEFAULT_SYMBOLS = ["✦", "✧", "✦", "✦", "✧", "✦"] as const;

/** 圓周均分粒子位移（FavoriteButton 等）。 */
export function createRadialBurstParticles(
  options: RadialBurstOptions = {},
): BurstParticle[] {
  const count = options.count ?? 6;
  const radius = options.radius ?? 22;
  const seed = options.seed ?? Date.now();
  const symbols = options.symbols ?? DEFAULT_SYMBOLS;
  const colors = options.colors;

  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return {
      id: seed + index,
      x: `${Math.cos(angle) * radius}px`,
      y: `${Math.sin(angle) * radius}px`,
      symbol: symbols[index % symbols.length],
      color: colors?.[index % colors.length],
      fontSize: radius > 30 ? 15 : undefined,
    };
  });
}

/** 點島慶祝色票（沿用 ZoneIsland 視覺）。 */
export const ISLAND_BURST_PRESET: RadialBurstOptions = {
  count: 6,
  radius: 56,
  symbols: ["✦", "✧", "✦", "✦", "✧", "✦"],
  colors: ["#ffb03a", "#ff8c2b", "#f7a8c4", "#8fcde8", "#ffd866", "#c5b3e6"],
};
