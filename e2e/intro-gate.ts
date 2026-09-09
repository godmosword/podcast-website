import type { BrowserContext, Page } from "@playwright/test";

/**
 * ADR-0004 之後，首次進 `/` 會被 3D 開場覆蓋層蓋住。任何要測 Landing 本身的
 * 規格都得先表明「這個分頁已經看過開場」，否則量到的是覆蓋層。
 *
 * 用 `addInitScript` 而不是先進站再寫 storage：閘門的判斷發生在首次繪製前，
 * 事後才寫已經來不及。
 */
export const INTRO_GATE_STORAGE_KEY = "cheche:intro-seen-v1";

export async function skipIntroOverlay(target: Page | BrowserContext): Promise<void> {
  await target.addInitScript((key) => {
    try {
      sessionStorage.setItem(key as string, "1");
    } catch {
      // storage 被封鎖時閘門本來就不會打開，這裡無事可做。
    }
  }, INTRO_GATE_STORAGE_KEY);
}
