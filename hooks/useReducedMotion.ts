import { useEffect, useState } from "react";

/**
 * 回報使用者是否偏好減少動態（prefers-reduced-motion: reduce）。
 * SSR/首次渲染固定回 false（與 server 一致，避免 hydration mismatch），
 * 掛載後才讀 matchMedia 並訂閱變更。
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
