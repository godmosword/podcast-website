import { expect, test } from "@playwright/test";
import {
  SUBSCRIBE_PAGE_TITLE,
  SUBSCRIBE_PRIVACY_NOTE,
  SUBSCRIBE_SUBMIT_LABEL,
  SUBSCRIBE_SUCCESS,
  SUBSCRIBE_UNAVAILABLE_LINK,
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
  test("頁面誠實聲明只收名單；API 關閉時引導收聽平台", async ({ page }) => {
    await mockSubscribeAvailable(page, false);
    await page.goto("/subscribe");
    await expect(page.getByRole("heading", { name: SUBSCRIBE_PAGE_TITLE })).toBeVisible();
    await expect(page.getByText("只收名單", { exact: false })).toBeVisible();
    await expect(page.getByText("不寄新集上線信", { exact: false })).toBeVisible();
    await expect(
      page.getByRole("link", { name: SUBSCRIBE_UNAVAILABLE_LINK }),
    ).toBeVisible();
  });

  test("API 可用時勾選同意才能送出，成功文案不承諾新集上線信", async ({
    page,
  }) => {
    await mockSubscribeAvailable(page, true);
    await page.goto("/subscribe");
    await expect(page.getByText(SUBSCRIBE_PRIVACY_NOTE, { exact: false })).toBeVisible();
    const submit = page.getByRole("button", { name: SUBSCRIBE_SUBMIT_LABEL });
    await expect(submit).toBeDisabled();

    await page.getByLabel("Email").fill("parent@example.com");
    await page.getByRole("checkbox").check();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByRole("status")).toHaveText(SUBSCRIBE_SUCCESS);
  });
});
