import type { Page } from "@playwright/test";
import {
  PARENT_GATE_PASSED_VALUE,
  PARENT_GATE_STORAGE_KEY,
} from "../lib/parent-gate";

/** 在導航前寫入通過狀態。不要在 production 加 query／env 旁路。 */
export async function seedParentGatePassed(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // 測試環境若沒有 sessionStorage，後續 assertion 會失敗。
      }
    },
    { key: PARENT_GATE_STORAGE_KEY, value: PARENT_GATE_PASSED_VALUE },
  );
}
