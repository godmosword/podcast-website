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

  test("下拉選單關閉後把焦點還給觸發器並關聯 listbox", async ({ page }) => {
    await page.goto("/stories");
    const trigger = page.getByRole("button", { name: "選擇車車" });
    await trigger.click();
    const listId = await trigger.getAttribute("aria-controls");
    expect(listId).toBeTruthy();
    await expect(page.locator(`#${listId}`)).toHaveRole("listbox");

    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.getByRole("option", { name: "救護車" }).click();
    await expect(trigger).toBeFocused();
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

  test("桌機可切換縮圖／完整，重整維持完整且不先閃縮圖", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/stories");
    const group = page.getByRole("group", { name: "故事列表顯示方式" });
    await expect(group).toBeVisible();
    const gridBtn = page.getByRole("button", { name: "縮圖" });
    const listBtn = page.getByRole("button", { name: "完整" });
    await expect(gridBtn).toHaveAttribute("aria-pressed", "true");

    const firstCatalog = page
      .locator('section[aria-label="找故事"] a[href^="/story/"]')
      .first();
    await expect(firstCatalog).toBeVisible();
    await expect(firstCatalog).toHaveCSS("flex-direction", "column");

    const items = page.locator('section[aria-label="找故事"] li');
    const first = await items.nth(0).boundingBox();
    const third = await items.nth(2).boundingBox();
    expect(first && third).toBeTruthy();
    expect(Math.abs((first?.y ?? 0) - (third?.y ?? 0))).toBeLessThan(8);

    await listBtn.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-stories-view",
      "list",
    );
    await expect(firstCatalog).toHaveCSS("flex-direction", "row");
    await expect(listBtn).toHaveAttribute("aria-pressed", "true");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute(
      "data-stories-view",
      "list",
    );
    await expect(
      page.locator('section[aria-label="找故事"] a[href^="/story/"]').first(),
    ).toHaveCSS("flex-direction", "row");
  });

  test("390 與 767 不顯示切換鈕，列表維持橫式", async ({ page }) => {
    for (const width of [390, 767] as const) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/stories");
      await expect(
        page.getByRole("group", { name: "故事列表顯示方式" }),
      ).toBeHidden();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-stories-view",
      );
      await expect(
        page.locator('section[aria-label="找故事"] a[href^="/story/"]').first(),
      ).toHaveCSS("flex-direction", "row");
    }
  });

  test("768 起兩欄縮圖，切換鈕可見", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 800 });
    await page.goto("/stories");
    await expect(
      page.getByRole("group", { name: "故事列表顯示方式" }),
    ).toBeVisible();
    const items = page.locator('section[aria-label="找故事"] li');
    const first = await items.nth(0).boundingBox();
    const second = await items.nth(1).boundingBox();
    const third = await items.nth(2).boundingBox();
    expect(first && second && third).toBeTruthy();
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(8);
    expect((third?.y ?? 0) - (first?.y ?? 0)).toBeGreaterThan(40);
  });

  test("找故事不顯示車車／主題欄位副標", async ({ page }) => {
    await page.goto("/stories");
    const bar = page.getByRole("region", { name: "找故事" });
    await expect(bar.getByRole("heading", { name: "找故事" })).toBeVisible();
    await expect(bar.getByRole("button", { name: "選擇車車" })).toBeVisible();
    await expect(bar.getByRole("button", { name: "選擇主題" })).toBeVisible();
    await expect(bar.getByText("車車", { exact: true })).toHaveCount(0);
    await expect(bar.getByText("主題", { exact: true })).toHaveCount(0);
  });
});
