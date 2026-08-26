import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PHONE = { width: 390, height: 844 };
const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

test.describe("播放頁兒童 UX", () => {
  test.use({ viewport: PHONE });

  test("a11y 無 critical/serious；定時選項與進度條命中區 ≥44px", async ({
    page,
  }) => {
    await page.goto("/story/ep-3/play");
    await expect(
      page.getByRole("button", { name: /^(播放|暫停)$/ }),
    ).toBeVisible({ timeout: 10_000 });

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

    await page.getByRole("button", { name: "睡前定時" }).click();
    const option = page.getByRole("menuitemradio").first();
    await expect(option).toBeVisible();
    const optionBox = await option.boundingBox();
    expect(optionBox).not.toBeNull();
    expect(optionBox!.height).toBeGreaterThanOrEqual(44);

    const seek = page.getByRole("slider", { name: "播放進度" });
    await expect(seek).toBeVisible();
    const seekBox = await seek.boundingBox();
    expect(seekBox).not.toBeNull();
    expect(seekBox!.height).toBeGreaterThanOrEqual(44);
  });
});
