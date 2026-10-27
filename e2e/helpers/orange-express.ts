import { expect, type Page } from "@playwright/test";
import type { OrangeExpressHook } from "../../lib/games/orange-express/types";

export type OrangeExpressLevelName = "慢慢看" | "自己開" | "小站長";

/** 標題選好檔、按開始，等駕駛台出來。 */
export async function startOrangeExpress(page: Page, name: OrangeExpressLevelName) {
  await page.getByRole("radio", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "開始開車" }).click();
  await expect(page.getByTestId("orange-express-drive")).toBeVisible();
}

/** 開車中改狀態（只有頁面載入前寫了 window.__orangeExpress 才有這個掛勾）。 */
export async function jumpOrangeExpress(page: Page, patch: OrangeExpressHook) {
  await page.evaluate((p) => {
    window.__orangeExpressJump?.(p);
  }, patch);
}

/**
 * 截圖用：關掉前窗輕晃，並把家長的「速度表數字」設成指定值。
 * 晃動跟著時間走，定格時也還在晃，截出來每次不同。
 */
export async function pinOrangeExpressDisplay(page: Page, gaugeNumbers = false) {
  await page.addInitScript((numbers) => {
    const key = "cheche:progress";
    let raw: { preferences?: { gameKit?: Record<string, unknown> } } = {};
    try {
      raw = JSON.parse(localStorage.getItem(key) ?? "{}") as typeof raw;
    } catch {
      raw = {};
    }
    const preferences = raw.preferences ?? {};
    const next = {
      ...raw,
      preferences: {
        ...preferences,
        gameKit: { ...preferences.gameKit, orangeExpressSway: false, orangeExpressGaugeNumbers: numbers },
      },
    };
    localStorage.setItem(key, JSON.stringify(next));
  }, gaugeNumbers);
}
