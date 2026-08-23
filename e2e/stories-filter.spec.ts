import { expect, test } from "@playwright/test";

test.describe("/stories 可分享篩選", () => {
  test("無 query 時 canonical 指向 /stories", async ({ page }) => {
    await page.goto("/stories");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /\/stories$/);
    await expect(page.getByRole("heading", { name: "全部故事" })).toBeVisible();
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).not.toHaveCount(0);
  });

  test("vehicle deep link 篩選結果與 URL 一致，reload 後仍在", async ({
    page,
  }) => {
    await page.goto("/stories?vehicle=%E6%95%91%E8%AD%B7%E8%BB%8A");
    await expect(page).toHaveURL(/vehicle=/);
    await expect(page.getByRole("button", { name: "選擇車車" })).toContainText(
      "救護車",
    );
    const cards = page.locator('main a[href^="/story/"]');
    await expect(cards.first()).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/vehicle=/);
    await expect(page.getByRole("button", { name: "選擇車車" })).toContainText(
      "救護車",
    );
  });

  test("tag deep link 與 q 搜尋可分享", async ({ page }) => {
    await page.goto("/stories?tag=%E5%90%88%E4%BD%9C");
    await expect(page.getByRole("button", { name: "選擇主題" })).toContainText(
      "合作",
    );

    await page.goto("/stories?q=%E8%B3%BD%E8%BB%8A");
    await expect(page.getByText(/搜尋「賽車」/)).toBeVisible();
  });

  test("history back／forward 還原 deep link 篩選", async ({ page }) => {
    await page.goto("/stories");
    await expect(page.getByRole("button", { name: "選擇車車" })).toContainText(
      "全部車車",
    );
    await page.goto("/stories?vehicle=%E6%95%91%E8%AD%B7%E8%BB%8A");
    await expect(page.getByRole("button", { name: "選擇車車" })).toContainText(
      "救護車",
    );
    await page.goBack();
    await expect(page).toHaveURL(/\/stories$/);
    await expect(page.getByRole("button", { name: "選擇車車" })).toContainText(
      "全部車車",
    );
    await page.goForward();
    await expect(page).toHaveURL(/vehicle=/);
    await expect(page.getByRole("button", { name: "選擇車車" })).toContainText(
      "救護車",
    );
  });

  test("選車後寫入 URL，清除後回到無 query", async ({ page }) => {
    await page.goto("/stories");
    await page.getByRole("button", { name: "選擇車車" }).click();
    await page.getByRole("option", { name: "救護車" }).click();
    await expect(page).toHaveURL(/vehicle=/);
    await page.getByRole("button", { name: "清除篩選" }).click();
    await expect(page).toHaveURL(/\/stories$/);
    await expect(page.getByRole("button", { name: "選擇車車" })).toContainText(
      "全部車車",
    );
  });

  test("篩選 URL 的 canonical 仍是 /stories（不複製內容）", async ({
    page,
  }) => {
    await page.goto("/stories?vehicle=%E6%95%91%E8%AD%B7%E8%BB%8A");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /\/stories$/);
    const href = await canonical.getAttribute("href");
    expect(href).not.toContain("vehicle=");
  });
});
