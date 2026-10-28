import { expect, test } from "@playwright/test";
import { NEWSLETTERS } from "../data/newsletters";

const issue = NEWSLETTERS.find((entry) => entry.slug === "2026-10-28");
if (!issue) throw new Error("缺少 2026-10-28 電子報");

const OLDER_HREFS = [
  "/newsletter/2026-10-23",
  "/newsletter/2026-10-20",
  "/newsletter/2026-10-16",
  "/newsletter/2026-10-13",
  "/newsletter/2026-10-09",
] as const;

const SOURCE_LINKS = [
  ["大阪大學新聞稿：機器人的聲音能提高幼兒的堅持", "https://resou.osaka-u.ac.jp/ja/research/2026/20260715_1"],
  ["Child Development", "https://doi.org/10.1093/chidev/aacag125"],
  ["MIT 新聞：寶寶看大人努力後，自己也會更努力", "https://news.mit.edu/2017/babies-try-harder-seeing-adults-0921"],
  ["Science 2017", "https://www.science.org/doi/10.1126/science.aan2317"],
] as const;

test("選單有電子報入口，連到列表並看到這一期", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  await page.getByRole("button", { name: "選單", exact: true }).click();
  const item = page.getByRole("navigation", { name: "網站選單" }).getByRole("link", { name: "電子報" });
  await expect(item).toBeVisible();
  await expect(item).toHaveAttribute("href", "/newsletter");
  await item.click();
  await expect(page).toHaveURL(/\/newsletter$/);
  await expect(page.getByRole("heading", { level: 1, name: "電子報" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: issue.title })).toBeVisible();
  await expect(page.getByText(issue.description)).toBeVisible();
  const older = page.getByRole("region", { name: "更多文章" }).getByRole("link");
  await expect(older).toHaveCount(OLDER_HREFS.length);
  const hrefs = await older.evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  expect(hrefs).toEqual([...OLDER_HREFS]);
});

test("單篇標題與來源連結正確", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/newsletter/${issue.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: issue.title })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "來源" })).toBeVisible();
  for (const [name, href] of SOURCE_LINKS) {
    const link = page.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }
});

test("10/09 單篇保留粗體、步驟與來源連結", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/newsletter/2026-10-09");
  await expect(
    page.getByRole("heading", { level: 1, name: "🌙 睡前螢幕下班：睡前一小時讓螢幕先去睡" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "今晚就能試" })).toBeVisible();
  const steps = page.getByRole("article").getByRole("list").first();
  await expect(steps.locator("li")).toHaveCount(3);
  await expect(page.getByText("螢幕下班儀式")).toBeVisible();
  const source = page.getByRole("link", { name: "大阪大學研究新聞稿", exact: true });
  await expect(source).toHaveAttribute(
    "href",
    "https://resou.osaka-u.ac.jp/ja/research/2026/20260619_2",
  );
  await expect(source).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /下一期/ })).toHaveAttribute(
    "href",
    "/newsletter/2026-10-13",
  );
});
