"use client";

import { useCallback, useState } from "react";
import {
  createRadialBurstParticles,
  type RadialBurstOptions,
  type BurstParticle,
} from "@/lib/celebration-dom";

const DEFAULT_DURATION_MS = 480;

/** 管理 DOM 星星迸發生命週期。 */
export function useCelebrationBurst(durationMs = DEFAULT_DURATION_MS) {
  const [particles, setParticles] = useState<readonly BurstParticle[]>([]);

  const fire = useCallback(
    (options?: RadialBurstOptions) => {
      const burst = createRadialBurstParticles(options);
      setParticles(burst);
      window.setTimeout(() => setParticles([]), durationMs);
    },
    [durationMs],
  );

  const clear = useCallback(() => setParticles([]), []);

  return { particles, fire, clear };
}
