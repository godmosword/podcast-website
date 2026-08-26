import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PARENT_GATE_SESSION_KEY } from "@/lib/parent-gate";

const PHONE = { width: 390, height: 844 };
const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

async function expectNoBlockingAxe(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact),
  );
  expect(
    blocking,
    blocking.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
}

function answerFromPrompt(text: string | null): string {
  const match = text?.match(/(\d+)\s*\+\s*(\d+)/);
  if (!match?.[1] || !match[2]) {
    throw new Error(`無法從題目解析加法：${text}`);
  }
  return String(Number(match[1]) + Number(match[2]));
}

test.describe("家長閘門 UX-P0-1", () => {
  test.use({ viewport: PHONE });

  test("未通過時不露出儀表板設定", async ({ page }) => {
    await page.goto("/for-parents/dashboard");
    await expect(
      page.getByRole("heading", { name: "先確認是家長" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "家長快速設定" }),
    ).toHaveCount(0);
    await expect(page.getByRole("switch", { name: "兒童模式" })).toHaveCount(0);
    await expectNoBlockingAxe(page);
  });

  test("答錯仍鎖定；答對後放行", async ({ page }) => {
    await page.goto("/for-parents/dashboard");
    await expect(page.getByText(/等於多少？/)).toBeVisible();

    await page.getByRole("textbox").fill("0");
    await page.getByRole("button", { name: "打開儀表板" }).click();
    await expect(page.getByText("答案不對，換一題再試。")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "家庭儀表板" }),
    ).toHaveCount(0);

    const nextPrompt = await page.getByText(/等於多少？/).textContent();
    await page.getByRole("textbox").fill(answerFromPrompt(nextPrompt));
    await page.getByRole("button", { name: "打開儀表板" }).click();

    await expect(
      page.getByRole("heading", { name: "家庭儀表板" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "小遊戲探索摘要" }),
    ).toBeVisible();
    await expect(page.getByRole("switch", { name: "兒童模式" })).toBeVisible();
  });

  test("同 session 重新進入不必重答", async ({ page }) => {
    await page.addInitScript((key: string) => {
      sessionStorage.setItem(key, "1");
    }, PARENT_GATE_SESSION_KEY);

    await page.goto("/for-parents/dashboard");
    await expect(
      page.getByRole("heading", { name: "家庭儀表板" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "先確認是家長" }),
    ).toHaveCount(0);
    await expectNoBlockingAxe(page);
  });
});
