import { expect, type Page } from "@playwright/test";

/** 關前任務介紹還在就按「開始！」。已經開始過的局不會再等。 */
export async function dismissCandyIntro(page: Page) {
  const intro = page.getByTestId("candy-match-intro");
  if ((await intro.count()) === 0) return;
  await intro.getByRole("button", { name: "開始！" }).click();
  await expect(intro).toHaveCount(0);
}
