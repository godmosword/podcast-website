import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { lowerQuality, type Quality } from "./config";

/** 只在連續繪製時採樣，排除休眠／首次 shader 編譯；降級不振盪升級。 */
export default function QualityManager({ active, quality, onQuality }: { active: boolean; quality: Quality; onQuality: (q: Quality) => void }) {
  const gl = useThree(s => s.gl);
  const captureMode = useRef(typeof window !== "undefined" && new URLSearchParams(window.location.search).has("heroQa"));
  const sample = useRef({ frames: 0, time: 0, warmup: 45 });
  useEffect(() => { sample.current = { frames: 0, time: 0, warmup: 45 }; }, [active, quality]);
  useFrame((_, delta) => {
    if (captureMode.current || !active || delta > .2 || delta <= 0) return;
    const s = sample.current;
    if (s.warmup-- > 0) return;
    s.frames++; s.time += delta;
    if (s.time >= 2) {
      const fps = s.frames / s.time;
      // 僅供本地 QA 讀取，不改既有 analytics 事件。
      gl.domElement.dataset.worldMetrics = JSON.stringify({ fps: Math.round(fps), calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, quality, dpr: gl.getPixelRatio() });
      if (fps < 38 && quality !== "low") onQuality(lowerQuality(quality));
      s.frames = 0; s.time = 0;
    }
  });
  return null;
}
