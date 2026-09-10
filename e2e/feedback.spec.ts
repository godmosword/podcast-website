import { expect, test } from "@playwright/test";
import {
  FEEDBACK_INVITE_CHILD,
  FEEDBACK_ERROR,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_MESSAGE_LABEL,
  FEEDBACK_NICKNAME_LABEL,
  FEEDBACK_EMAIL_LABEL,
  FEEDBACK_PAGE_TITLE,
  FEEDBACK_SUBMIT_LABEL,
  FEEDBACK_WALL_HEADING,
} from "../lib/feedback-copy";

const FIXTURE_EMAIL = "secret-parent@example.com";

const REMOVED_COPY = [
  "這個當做蒐集資料，不會顯示在畫面上。",
  "你最想說的話",
  "先選一句試試看",
  "也歡迎寫下想聽的故事。",
  "給家長",
  "可以讓孩子說、爸媽幫忙打字。",
  "家長同意、馬米看過之後，才會貼上牆。",
  "請先勾選兩項同意，才能送出。",
  "馬米暫時用 email 收信。",
  "想聽挖土機",
  "最喜歡小紅賽車",
  "謝謝馬米說故事",
];

test.describe("站內留言牆 /feedback", () => {
  test("初始 HTML 就有表單，已刪文案不出現", async ({ page }) => {
    const response = await page.goto("/feedback");
    expect(response?.ok()).toBeTruthy();

    const html = await response!.text();
    expect(html).toContain('name="nickname"');
    expect(html).toContain('name="website"');
    expect(html).toContain('name="startedAt"');

    await expect(page).toHaveURL(/\/feedback$/);
    await expect(
      page.getByRole("heading", { name: FEEDBACK_PAGE_TITLE, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "寫給馬米", level: 2 })).toHaveCount(0);
    await expect(page.getByText("寫下想聽的故事再送出。")).toHaveCount(0);
    await expect(page.getByText(FEEDBACK_INVITE_CHILD)).toBeVisible();
    await expect(page.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeVisible();
    await expect(page.getByRole("textbox", { name: FEEDBACK_EMAIL_LABEL })).toBeVisible();
    await expect(page.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL })).toBeVisible();
    await expect(page.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL })).toBeVisible();
    await expect(page.getByText("還沒有公開留言")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(FIXTURE_EMAIL);
    const form = page.locator("form");
    for (const copy of REMOVED_COPY) {
      await expect(form).not.toContainText(copy);
    }
  });

  test("空牆沒有範例卡；有核准則列牆", async ({ page }) => {
    await page.goto("/feedback");

    const wall = page.getByLabel("公開留言牆");
    await expect(wall.getByLabel("示範留言")).toHaveCount(0);
    await expect(wall).not.toContainText("範例");

    const list = wall.getByRole("list");
    if (await list.count()) {
      await expect(list).toBeVisible();
    } else {
      await expect(
        wall.getByRole("heading", { name: FEEDBACK_WALL_HEADING, level: 2 }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "當第一個留言" })).toHaveCount(0);
    }
    await expect(page.getByText("還沒有公開留言")).toHaveCount(0);
  });

  test("填暱稱與留言就能送；信箱可不填", async ({ page }) => {
    await page.goto("/feedback");

    const submit = page.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL });
    await expect(submit).toBeEnabled();
    await expect(page.getByRole("checkbox")).toHaveCount(0);

    await page.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL }).fill("小車");
    await page.getByRole("textbox", { name: FEEDBACK_MESSAGE_LABEL }).fill("謝謝馬米");
    await expect(submit).toBeEnabled();

    const mailto = page.getByRole("link", { name: FEEDBACK_MAILTO_LINK });
    if (await mailto.count()) {
      // startedAt 在 hydration 寫入；最短填寫 3 秒，避免誤觸 FEEDBACK_TOO_FAST
      await page.waitForTimeout(3200);
      await submit.click();
      await expect(page.locator("form").getByRole("alert")).toContainText(FEEDBACK_ERROR);
      await expect(page.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL })).toBeVisible();
      await expect(mailto).toBeVisible();
    }
  });

  test("無 JS 時表單仍在 HTML 裡可填", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto("/feedback");
    expect(response?.ok()).toBeTruthy();

    const nickname = page.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL });
    await expect(nickname).toBeVisible();
    await nickname.fill("小車");
    await expect(nickname).toHaveValue("小車");
    await expect(page.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL })).toBeVisible();
    await context.close();
  });

  test("頂欄留言連 /feedback 且目前頁；抽屜沒有留言列", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/feedback");

    const topFeedback = page.getByRole("link", { name: "留言", exact: true });
    await expect(topFeedback).toBeVisible();
    await expect(topFeedback).toHaveAttribute("href", "/feedback");
    await expect(topFeedback).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "開啟選單" }).click();
    const drawer = page.getByRole("navigation", { name: "網站選單" });
    await expect(drawer.getByRole("link", { name: "留言", exact: true })).toHaveCount(0);
  });

  test("/studio/feedback 不進索引", async ({ page }) => {
    const response = await page.goto("/studio/feedback");
    expect(response?.ok()).toBeTruthy();
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });
});
