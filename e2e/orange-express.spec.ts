import { expect, test, type Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-keys";

async function startLevel(page: Page, name: "慢慢看" | "自己開" | "小站長") {
  await page.getByRole("radio", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "開始開車" }).click();
  await expect(page.getByTestId("orange-express-drive")).toBeVisible();
}

async function tap(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(60);
  await page.keyboard.up(key);
  await page.waitForTimeout(60);
}

async function jump(page: Page, patch: Record<string, number | boolean>) {
  await page.evaluate((p) => {
    window.__orangeExpressJump?.(p);
  }, patch);
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
    await expect(page.getByText("停在綠區，三顆星")).toBeAttached();

    const saved = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, PROGRESS_STORAGE_KEY);
    expect(saved.gameProfile.stickers).toContain("played-orange-express");
    expect(saved.gameProfile.medals["orange-express"][0] & 1).toBe(1);
  });

  test("自己開：還在跑時開門沒反應，停好才進下一站，速度表不超過旗", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = {};
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const door = page.getByRole("button", { name: "開門" });
    await door.click({ force: true });
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-station-index", "0");
    await expect(door).toHaveAttribute("aria-disabled", "true");

    await jump(page, { progress: 0.65, speed: 0 });
    await expect(door).not.toHaveAttribute("aria-disabled", "true");
    await door.click();
    await page.getByRole("button", { name: "關門" }).click();
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-station-index", "1");

    await jump(page, { progress: 0.1, speed: 5 });
    const meter = page.getByRole("meter", { name: "速度表" });
    await expect(meter).toHaveAttribute("aria-valuetext", "到速度旗了");
    const now = Number(await meter.getAttribute("aria-valuenow"));
    expect(now).toBeLessThanOrEqual(100);
  });

  test("桿子一格一格亮燈：P3 亮、煞車拉到緊急", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const power = page.getByRole("slider", { name: "動力" });
    const box = (await power.boundingBox())!;
    const row = box.height / 5;
    await page.mouse.click(box.x + box.width / 2, box.y + row * 1.5);
    await expect(power).toHaveAttribute("aria-valuenow", "3");
    await expect(power).toHaveAttribute("aria-valuetext", "動力 P3，快");
    await expect(power.locator('[data-notch="3"]')).toHaveAttribute("data-on", "true");
    await expect(power.locator('[data-notch="2"]')).toHaveAttribute("data-on", "false");
    await expect(page.getByTestId("orange-express-power-word")).toHaveText("快");

    const brake = page.getByRole("slider", { name: "煞車" });
    for (let i = 0; i < 6; i += 1) await tap(page, "ArrowLeft");
    await expect(brake).toHaveAttribute("aria-valuenow", "5");
    await expect(brake).toHaveAttribute("aria-valuetext", "煞車，緊急");
    await expect(brake.locator('[data-notch="5"]')).toHaveAttribute("data-on", "true");
    await tap(page, "ArrowRight");
    await expect(brake).toHaveAttribute("aria-valuenow", "4");
  });

  test("進站：停車目標條出現，停在綠區三顆星、黃區兩顆星", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    await expect(page.getByTestId("orange-express-stopbar")).toHaveCount(0);
    await jump(page, { progress: 0.5, speed: 0.3, brake: 2 });
    const bar = page.getByTestId("orange-express-stopbar");
    await expect(bar).toBeVisible();
    await expect(page.getByTestId("orange-express-stop-words")).toContainText("快到了");

    await jump(page, { progress: 0.65, speed: 0, brake: 4, freeze: false });
    await expect(bar).toHaveAttribute("data-grade", "green");
    await expect(page.getByTestId("orange-express-stop-words")).toContainText("停在綠區，三顆星");

    await page.getByRole("button", { name: "開門" }).click();
    await page.getByRole("button", { name: "關門" }).click();
    await jump(page, { progress: 0.53, speed: 0 });
    await expect(bar).toHaveAttribute("data-grade", "yellow");
    await expect(page.getByTestId("orange-express-stop-words")).toContainText("停在黃區，兩顆星");
  });

  test("開過頭：小橘慢慢倒回去再試，不會失敗", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = {};
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    await jump(page, { progress: 0.79, speed: 0.8 });
    const drive = page.getByTestId("orange-express-drive");
    await expect(drive).toHaveAttribute("data-phase", "reversing");
    await expect(page.getByTestId("orange-express-stop-words")).toContainText("小橘慢慢倒回去");
    await expect(drive).toHaveAttribute("data-phase", "running", { timeout: 6000 });
    await expect(drive).toHaveAttribute("data-station-index", "0");
    await expect(page.getByRole("button", { name: "開門" })).toHaveAttribute("aria-disabled", "true");
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
    await jump(page, { progress: 0.65, speed: 0 });
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
    const box = (await lever.boundingBox())!;
    const x = box.x + box.width / 2;
    await page.mouse.click(x, box.y + 12);
    await expect(lever).toHaveAttribute("aria-valuenow", "4");
    await page.mouse.click(x, box.y + box.height - 12);
    await expect(lever).toHaveAttribute("aria-valuenow", "0");
    await page.mouse.move(x, box.y + box.height - 12);
    await page.mouse.down();
    await page.mouse.move(x, box.y + box.height * 0.3, { steps: 6 });
    await expect(lever).toHaveAttribute("aria-valuenow", "3");
    await page.mouse.move(x, box.y + 8, { steps: 4 });
    await page.mouse.up();
    await expect(lever).toHaveAttribute("aria-valuenow", "4");
  });

  test("速度表預設沒有數字；家長在遊戲設定打開後才有刻度", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { progress: 0.1, speed: 0.4, freeze: true };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const gauge = page.getByTestId("orange-express-gauge");
    await expect(gauge).toHaveAttribute("data-numbers", "false");
    await expect(gauge.getByText("km/h")).toHaveCount(0);
    await expect(page.getByRole("meter", { name: "速度表" })).toHaveAttribute("aria-valuetext", "還可以再快");

    await page.getByRole("button", { name: "遊戲設定" }).click();
    await page.getByRole("checkbox", { name: /速度表數字/ }).check();
    await page.getByRole("button", { name: "完成" }).click();
    await expect(gauge).toHaveAttribute("data-numbers", "true");
    await expect(gauge.getByText("km/h")).toBeVisible();
    await expect(page.getByRole("meter", { name: "速度表" })).toHaveAttribute(
      "aria-valuetext",
      "還可以再快，每小時 120 公里",
    );
  });

  test("畫面晃動：設定可以關，減少動態時一律不晃", async ({ page }) => {
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const drive = page.getByTestId("orange-express-drive");
    await expect(drive).toHaveAttribute("data-sway", "true");
    await page.getByRole("button", { name: "遊戲設定" }).click();
    await page.getByRole("checkbox", { name: /畫面晃動/ }).uncheck();
    await page.getByRole("button", { name: "完成" }).click();
    await expect(drive).toHaveAttribute("data-sway", "false");
  });

  test("系統減少動態時不晃", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const drive = page.getByTestId("orange-express-drive");
    await expect(drive).toHaveAttribute("data-reduced", "true");
    await expect(drive).toHaveAttribute("data-sway", "false");
  });
});
