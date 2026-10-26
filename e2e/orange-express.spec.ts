import { expect, test } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-keys";

async function startLevel(page: import("@playwright/test").Page, name: "慢慢看" | "自己開" | "小站長") {
  await page.getByRole("radio", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "開始開車" }).click();
  await expect(page.getByTestId("orange-express-drive")).toBeVisible();
}

test.describe("小橘特快車", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("慢慢看：停好開門、兩位朋友、關上門就到家", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { progress: 0.6, speed: 0 };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "慢慢看");
    await page.getByRole("button", { name: "開門" }).click();
    await expect(page.getByText("馬米")).toBeVisible();
    await expect(page.getByText("Bonbon")).toBeVisible();
    await expect(page.getByRole("button", { name: "關門" })).toBeVisible();
    await page.getByRole("button", { name: "關門" }).click();
    await expect(page.getByRole("heading", { name: "到家了" })).toBeVisible();

    const saved = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, PROGRESS_STORAGE_KEY);
    expect(saved.gameProfile.stickers).toContain("played-orange-express");
    expect(saved.gameProfile.medals["orange-express"][0] & 1).toBe(1);
  });

  test("自己開：還在跑時開門沒反應，停好才進下一站，速度珠不超過旗", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = {};
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const door = page.getByRole("button", { name: "開門" });
    await door.click({ force: true });
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-station-index", "0");
    await expect(door).toHaveAttribute("aria-disabled", "true");

    await page.evaluate(() => {
      window.__orangeExpressJump?.({ progress: 0.6, speed: 0 });
    });
    await expect(door).not.toHaveAttribute("aria-disabled", "true");
    await door.click();
    await page.getByRole("button", { name: "關門" }).click();
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-station-index", "1");

    await page.evaluate(() => {
      window.__orangeExpressJump?.({ progress: 0.1, speed: 5 });
    });
    const meter = page.getByRole("meter", { name: "速度旗" });
    await expect(meter).toHaveAttribute("aria-valuetext", "到速度旗了");
    const now = Number(await meter.getAttribute("aria-valuenow"));
    expect(now).toBeLessThanOrEqual(100);
  });

  test("鍵盤：動力、煞車、開門、喇叭與暫停，方向鍵不捲頁", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = {};
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const before = await page.evaluate(() => window.scrollY);
    await page.keyboard.down("ArrowUp");
    await expect(page.getByRole("slider", { name: "動力" })).toHaveAttribute("aria-valuenow", "1");
    await page.keyboard.up("ArrowUp");
    await page.keyboard.down("ArrowLeft");
    await expect(page.getByRole("slider", { name: "煞車" })).toHaveAttribute("aria-valuenow", "1");
    await page.keyboard.up("ArrowLeft");
    const door = page.getByRole("button", { name: "開門" });
    await page.keyboard.down(" ");
    await expect(door).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.up(" ");
    await page.evaluate(() => {
      window.__orangeExpressJump?.({ progress: 0.6, speed: 0 });
    });
    await expect(door).not.toHaveAttribute("aria-disabled", "true");
    await page.keyboard.down(" ");
    await expect(page.getByRole("button", { name: "等人上車" })).toBeVisible();
    await page.keyboard.up(" ");
    await page.keyboard.down("x");
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-honked", "1");
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-station-index", "0");
    await page.keyboard.up("x");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "繼續遊戲" })).toBeVisible();
    await expect(page.getByText("暫停了")).toBeVisible();
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBe(before);
  });

  test("關掉音效仍可以到家", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { progress: 0.6, speed: 0 };
    });
    await page.goto("/games/orange-express");
    await page.getByRole("button", { name: "關閉音效" }).click();
    await startLevel(page, "慢慢看");
    await page.getByRole("button", { name: "開門" }).click();
    await page.getByRole("button", { name: "關門" }).click();
    await expect(page.getByRole("heading", { name: "到家了" })).toBeVisible();
  });

  test("動力桿可以點，也可以拖", async ({ page }) => {
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const lever = page.getByRole("slider", { name: "動力" });
    const box = await lever.boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    await page.mouse.click(x, box!.y + 12);
    await expect(lever).toHaveAttribute("aria-valuenow", "2");
    await page.mouse.move(x, box!.y + box!.height - 12);
    await page.mouse.down();
    await page.mouse.move(x, box!.y + 12, { steps: 6 });
    await page.mouse.up();
    await expect(lever).toHaveAttribute("aria-valuenow", "2");
    await page.mouse.click(x, box!.y + box!.height - 12);
    await expect(lever).toHaveAttribute("aria-valuenow", "0");
  });
});
