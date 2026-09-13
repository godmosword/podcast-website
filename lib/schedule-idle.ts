/**
 * 在瀏覽器空閒時跑裝飾工作。部分行動 WebView／舊 Safari 沒有
 * `requestIdleCallback`，直接呼叫會讓 root layout 掉進 global-error。
 */
export function scheduleWhenIdle(
  job: () => void,
  timeoutMs: number,
): () => void {
  if (typeof window === "undefined") return () => {};

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(job, { timeout: timeoutMs });
    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(id);
      }
    };
  }

  const tid = window.setTimeout(job, 0);
  return () => window.clearTimeout(tid);
}
