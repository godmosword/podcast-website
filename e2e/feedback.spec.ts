import { expect, test } from "@playwright/test";
import {
  FEEDBACK_DEMO_MESSAGE,
  FEEDBACK_DEMO_NICKNAME,
  FEEDBACK_EMPTY_CTA,
  FEEDBACK_INVITE_LINES,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_NICKNAME_LABEL,
  FEEDBACK_PAGE_TITLE,
  FEEDBACK_SUBMIT_DISABLED_HINT,
  FEEDBACK_SUBMIT_LABEL,
  FEEDBACK_SUCCESS,
} from "../lib/feedback-copy";
import { feedbackMailtoHref } from "../lib/contact";

const FIXTURE_EMAIL = "secret-parent@example.com";

async function mockFeedbackApi(
  page: import("@playwright/test").Page,
  options: {
    available: boolean;
    messages?: Array<{
      id: number;
      nickname: string;
      message: string;
      createdAt: string;
      email?: string;
    }>;
    postStatus?: number;
  },
): Promise<void> {
  await page.route("**/api/feedback", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Cache-Control": "no-store" },
        body: JSON.stringify({
          available: options.available,
          messages: options.messages ?? [],
        }),
      });
      return;
    }
    if (method === "POST") {
      await route.fulfill({
        status: options.postStatus ?? 201,
        contentType: "application/json",
        headers: { "Cache-Control": "no-store" },
        body: JSON.stringify(
          options.postStatus === 201 || options.postStatus == null
            ? { ok: true }
            : { ok: false, reason: "db_unavailable" },
        ),
      });
      return;
    }
    await route.fallback();
  });
}

test.describe("站內留言牆 /feedback", () => {
  test("無 DB 時頁面仍 200，表單改 mailto，示範卡不進 list", async ({
    page,
  }) => {
    await mockFeedbackApi(page, { available: false });
    await page.goto("/feedback");

    await expect(page).toHaveURL(/\/feedback$/);
    await expect(
      page.getByRole("heading", { name: FEEDBACK_PAGE_TITLE, level: 1 }),
    ).toBeVisible();
    for (const line of FEEDBACK_INVITE_LINES) {
      await expect(page.getByText(line, { exact: true })).toBeVisible();
    }

    const mailto = page.getByRole("link", { name: FEEDBACK_MAILTO_LINK });
    await expect(mailto).toBeVisible();
    await expect(mailto).toHaveAttribute("href", feedbackMailtoHref());

    await expect(page.getByLabel("示範留言")).toContainText(FEEDBACK_DEMO_MESSAGE);
    await expect(page.getByLabel("示範留言")).toContainText(FEEDBACK_DEMO_NICKNAME);
    await expect(page.getByRole("list")).toHaveCount(0);
    await expect(page.getByText(FEEDBACK_EMPTY_CTA)).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(FIXTURE_EMAIL);
  });

  test("可用時未勾兩項同意不能送；成功後先審後發", async ({ page }) => {
    const posts: string[] = [];
    await page.route("**/api/feedback", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ available: true, messages: [] }),
        });
        return;
      }
      if (method === "POST") {
        posts.push(route.request().postData() ?? "");
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto("/feedback");
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

    await submit.click();
    await expect(page.getByRole("status")).toHaveText(FEEDBACK_SUCCESS);
    expect(posts).toHaveLength(1);
    const body = JSON.parse(posts[0]) as {
      parentConsent: boolean;
      publishConsent: boolean;
      email: string;
    };
    expect(body.parentConsent).toBe(true);
    expect(body.publishConsent).toBe(true);
    expect(body.email).toBe("parent@example.com");
  });

  test("已核准列出現暱稱與正文，夾帶的 email 不進畫面", async ({ page }) => {
    await mockFeedbackApi(page, {
      available: true,
      messages: [
        {
          id: 7,
          nickname: "Bonbon",
          message: "很喜歡垃圾車那集",
          createdAt: "2026-09-05T02:00:00.000Z",
          email: FIXTURE_EMAIL,
        },
      ],
    });
    await page.goto("/feedback");

    const list = page.getByRole("list");
    await expect(list).toBeVisible();
    await expect(list.getByText("Bonbon")).toBeVisible();
    await expect(list.getByText("很喜歡垃圾車那集")).toBeVisible();
    await expect(list.getByLabel("示範留言")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(FIXTURE_EMAIL);
  });

  test("頂欄留言連 /feedback 且目前頁；抽屜沒有留言列", async ({ page }) => {
    await mockFeedbackApi(page, { available: false });
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
