import { expect, test } from "@playwright/test";
import { NEWSLETTERS } from "../data/newsletters";

const issue = NEWSLETTERS[0];
if (!issue) throw new Error("缺少第一期電子報");

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
