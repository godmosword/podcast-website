"use client";

import { useEffect, useRef, useState } from "react";
import { JuiceController } from "@/lib/gamekit/runtime/juice";

/** DOM 棋盤遊戲用：螢幕震動（CSS transform），無 canvas 粒子。 */
export function useDomJuice(reduced: boolean) {
  const juice = useRef(new JuiceController());
  const [transform, setTransform] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (reduced) {
      setTransform(undefined);
      return;
    }
    let raf = 0;
    const loop = () => {
      const { shakeX, shakeY } = juice.current.update(1 / 60);
      if (shakeX !== 0 || shakeY !== 0) {
        setTransform(`translate(${shakeX}px, ${shakeY}px)`);
      } else {
        setTransform(undefined);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return {
    juice: juice.current,
    boardTransform: transform,
  };
}
