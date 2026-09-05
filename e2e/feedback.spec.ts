import { expect, test } from "@playwright/test";
import {
  FEEDBACK_DEMO_MESSAGE,
  FEEDBACK_DEMO_NICKNAME,
  FEEDBACK_INVITE_CHILD,
  FEEDBACK_INVITE_PARENT,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_NICKNAME_LABEL,
  FEEDBACK_PAGE_TITLE,
  FEEDBACK_REVIEW_LEAD,
  FEEDBACK_SUBMIT_DISABLED_HINT,
  FEEDBACK_SUBMIT_LABEL,
} from "../lib/feedback-copy";
import { feedbackMailtoHref } from "../lib/contact";

const FIXTURE_EMAIL = "secret-parent@example.com";

test.describe("站內留言牆 /feedback", () => {
  test("初始 HTML 就有表單或 mailto，邀請與審核句可見", async ({ page }) => {
    const response = await page.goto("/feedback");
    expect(response?.ok()).toBeTruthy();

    const html = await response!.text();
    const hasForm = html.includes('name="nickname"');
    const hasMailto = html.includes("mailto:");
    expect(hasForm || hasMailto).toBe(true);
    if (hasForm) {
      expect(html).toContain('name="website"');
      expect(html).toContain('name="startedAt"');
    }

    await expect(page).toHaveURL(/\/feedback$/);
    await expect(
      page.getByRole("heading", { name: FEEDBACK_PAGE_TITLE, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(FEEDBACK_INVITE_CHILD)).toBeVisible();
    await expect(page.getByText(FEEDBACK_INVITE_PARENT)).toBeVisible();
    await expect(page.getByText(FEEDBACK_REVIEW_LEAD)).toBeVisible();
    await expect(page.getByText("還沒有公開留言")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(FIXTURE_EMAIL);
  });

  test("核准未滿三則時只示範、不列牆", async ({ page }) => {
    await page.goto("/feedback");

    const list = page.getByRole("list");
    const demo = page.getByLabel("示範留言");
    if (await list.count()) {
      await expect(list).toBeVisible();
      await expect(demo).toHaveCount(0);
    } else {
      await expect(demo).toContainText(FEEDBACK_DEMO_MESSAGE);
      await expect(demo).toContainText(FEEDBACK_DEMO_NICKNAME);
    }
    await expect(page.getByText("還沒有公開留言")).toHaveCount(0);
  });

  test("有表單時未勾兩項同意不能送", async ({ page }) => {
    await page.goto("/feedback");
    const mailto = page.getByRole("link", { name: FEEDBACK_MAILTO_LINK });
    if (await mailto.isVisible()) {
      await expect(mailto).toHaveAttribute("href", feedbackMailtoHref());
      return;
    }

    const submit = page.getByRole("button", { name: FEEDBACK_SUBMIT_LABEL });
    await expect(submit).toBeDisabled();
    await expect(page.getByText(FEEDBACK_SUBMIT_DISABLED_HINT)).toBeVisible();

    await page.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL }).fill("小車");
    await page.getByRole("textbox", { name: "信箱" }).fill("parent@example.com");
    await page.getByRole("textbox", { name: "你最想說的話" }).fill("想聽挖土機");

    const checkboxes = page.getByRole("checkbox");
    await expect(checkboxes).toHaveCount(2);
    await checkboxes.nth(0).check();
    await expect(submit).toBeDisabled();
    await checkboxes.nth(1).check();
    await expect(submit).toBeEnabled();
  });

  test("無 JS 時表單仍在 HTML 裡可填", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto("/feedback");
    expect(response?.ok()).toBeTruthy();

    const nickname = page.getByRole("textbox", { name: FEEDBACK_NICKNAME_LABEL });
    if ((await nickname.count()) === 0) {
      await expect(page.getByRole("link", { name: FEEDBACK_MAILTO_LINK })).toBeVisible();
      await context.close();
      return;
    }

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
