import { afterEach } from "vitest";

/**
 * 每個測試結束後讓出一次 macrotask，讓 worker 讀得到主程序的 RPC 回覆。
 *
 * vitest 測試之間只讓出 microtask；同一個檔案若連續吃 CPU 超過 60 秒
 * （CI 上 block-drop 解題器整檔約 60 秒），worker 一直沒進 poll 階段，
 * 回報進度的 RPC 就被判逾時：Timeout calling "onTaskUpdate"——測試全過、
 * 整輪仍失敗（#187）。拆小測試沒用，要真的讓出 event loop。
 *
 * 用載入當下的 setImmediate：有些測試會 vi.useFakeTimers()，換掉的版本不會觸發。
 */
const realSetImmediate: (callback: () => void) => unknown =
  globalThis.setImmediate ?? ((callback) => setTimeout(callback, 0));

afterEach(() => new Promise<void>((resolve) => realSetImmediate(resolve)));
