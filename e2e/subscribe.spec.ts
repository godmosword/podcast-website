import { expect, test } from "@playwright/test";
import {
  SUBSCRIBE_CLOSED_PAGE_LEDE,
  SUBSCRIBE_CLOSED_PAGE_TITLE,
  SUBSCRIBE_EMAIL_LABEL,
  SUBSCRIBE_PAGE_TITLE,
  SUBSCRIBE_PRIVACY_NOTE,
  SUBSCRIBE_SUBMIT_LABEL,
  SUBSCRIBE_SUCCESS,
} from "../lib/subscribe-copy";

async function mockSubscribeAvailable(
  page: import("@playwright/test").Page,
  available: boolean,
): Promise<void> {
  await page.route("**/api/subscribe", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ available }),
      });
      return;
    }
    if (method === "POST") {
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, requiresConfirmation: true }),
      });
      return;
    }
    await route.fallback();
  });
}

test.describe("SubscribeForm LIST-2", () => {
  test("API 關閉時：標題改成直接訂閱平台，不請人留 Email，並引導收聽平台", async ({ page }) => {
    await mockSubscribeAvailable(page, false);
    await page.goto("/subscribe");
    await expect(page.getByRole("heading", { name: SUBSCRIBE_CLOSED_PAGE_TITLE })).toBeVisible();
    await expect(page.getByText(SUBSCRIBE_CLOSED_PAGE_LEDE)).toBeVisible();
    // 關閉時不收 Email，頁面不該一邊說「先留下家長 Email」一邊說登記關閉。
    await expect(page.getByText("先留下家長 Email", { exact: false })).toHaveCount(0);
    // M8：關閉時四個平台按鈕就在首屏（不只頁尾）
    await expect(
      page
        .getByRole("region", { name: "新集通知" })
        .getByRole("link", { name: "在 Spotify 收聽" }),
    ).toBeVisible();
  });

  test("API 可用時：頁面誠實聲明只收名單、不寄新集上線信", async ({ page }) => {
    await mockSubscribeAvailable(page, true);
    await page.goto("/subscribe");
    await expect(page.getByRole("heading", { name: SUBSCRIBE_PAGE_TITLE })).toBeVisible();
    const intro = page.locator("main header");
    await expect(intro.getByText("只收名單", { exact: false })).toBeVisible();
    await expect(intro.getByText("不寄新集上線信", { exact: false })).toBeVisible();
  });

  test("API 可用時勾選同意才能送出，成功文案不承諾新集上線信", async ({
    page,
  }) => {
    await mockSubscribeAvailable(page, true);
    await page.goto("/subscribe");
    await expect(page.getByText(SUBSCRIBE_PRIVACY_NOTE, { exact: false })).toBeVisible();
    const submit = page.getByRole("button", { name: SUBSCRIBE_SUBMIT_LABEL });
    await expect(submit).toBeDisabled();

    await page.getByRole("textbox", { name: SUBSCRIBE_EMAIL_LABEL }).fill(
      "parent@example.com",
    );
    await page.getByRole("checkbox").check();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByRole("status")).toHaveText(SUBSCRIBE_SUCCESS);
  });
});
