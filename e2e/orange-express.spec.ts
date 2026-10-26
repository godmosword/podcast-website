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
      window.__orangeExpress = { driver: "big" };
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
      window.__orangeExpress = { freeze: true, driver: "big" };
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
      window.__orangeExpress = { driver: "big" };
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

  test("司機：預設小小司機；家長在遊戲設定切成大司機", async ({ page }) => {
    await page.goto("/games/orange-express");
    await page.getByRole("radio", { name: /自己開/ }).click();
    await expect(page.getByTestId("orange-express-driver-note")).toContainText("小小司機");
    await page.getByRole("button", { name: "遊戲設定" }).click();
    await page.getByRole("radio", { name: "大司機" }).click();
    await page.getByRole("button", { name: "完成" }).click();
    await expect(page.getByTestId("orange-express-driver-note")).toContainText("大司機");
    await page.getByRole("button", { name: "開始開車" }).click();
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-course", "big");
  });

  test("小小司機：沒有速限牌也沒有指差確認，桿子自動限速", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true, driver: "little" };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const drive = page.getByTestId("orange-express-drive");
    await expect(drive).toHaveAttribute("data-course", "little");
    await jump(page, { progress: 0.03, speed: 0.4 });
    await expect(page.getByTestId("orange-express-point")).toHaveCount(0);
    await expect(page.getByTestId("orange-express-notice")).toHaveCount(0);
    await jump(page, { progress: 0.1, speed: 5, freeze: false });
    await expect(page.getByRole("meter", { name: "速度表" })).toHaveAttribute("aria-valuetext", "到速度旗了");
    await expect(drive).toHaveAttribute("data-auto-brake-count", "0");
  });

  test("大司機：速限牌出現，超速時小橘輕輕煞車，不扣分", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true, driver: "big" };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    await jump(page, { progress: 0.045, speed: 0.4 });
    await expect(page.getByTestId("orange-express-notice")).toHaveAttribute("data-kind", "sign");
    await expect(page.getByTestId("orange-express-notice")).toContainText("速限牌");

    const drive = page.getByTestId("orange-express-drive");
    await jump(page, { progress: 0.065, speed: 0.75, power: 3, freeze: false });
    await expect(drive).toHaveAttribute("data-auto-brake-count", "1");
    await expect(drive).toHaveAttribute("data-auto-brake", "false", { timeout: 4000 });
    await expect(drive).toHaveAttribute("data-misses", "0");
  });

  test("隧道：前窗變暗、車內燈亮；鐵橋：喇叭提示，按了算打招呼", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true, driver: "big" };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const drive = page.getByTestId("orange-express-drive");
    await jump(page, { progress: 0.14, speed: 0.4 });
    await expect(drive).toHaveAttribute("data-tunnel", "true");
    await expect(page.getByTestId("orange-express-cab")).toHaveAttribute("data-tunnel", "true");

    await jump(page, { stationIndex: 1, progress: 0.14, speed: 0.4 });
    await expect(drive).toHaveAttribute("data-tunnel", "false");
    await expect(page.getByTestId("orange-express-notice")).toHaveAttribute("data-kind", "bridge");
    const horn = page.getByTestId("orange-express-horn");
    await expect(horn).toHaveAttribute("data-hint", "true");
    await horn.click();
    await expect(drive).toHaveAttribute("data-bridge-greets", "1");
    await expect(horn).toHaveAttribute("data-hint", "false");
    await expect(page.getByTestId("orange-express-notice")).toHaveAttribute("data-kind", "greeted");
  });

  test("對向列車擦身：前窗提示揮揮手", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true, driver: "big" };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    await jump(page, { stationIndex: 2, progress: 0.035, speed: 0.4, passing: 1.8 });
    await expect(page.getByTestId("orange-express-windshield")).toHaveAttribute("data-scene", "sea");
    await expect(page.getByTestId("orange-express-notice")).toHaveAttribute("data-kind", "passing");
  });

  test("指差確認：按一下記一次，按鈕收起來", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true, driver: "big" };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const point = page.getByTestId("orange-express-point");
    await expect(point).toHaveAttribute("data-kind", "signal");
    await point.click();
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-points", "1");
    await expect(point).toHaveCount(0);
  });

  test("手機煞車格每格至少 48px；底部提示是方向鍵與空白鍵", async ({ page }) => {
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const brake = page.getByRole("slider", { name: "煞車" });
    const box = (await brake.boundingBox())!;
    expect(box.height / 6).toBeGreaterThanOrEqual(48);
    const tops: number[] = [];
    for (let i = 0; i <= 5; i += 1) {
      const notch = (await brake.locator(`[data-notch="${i}"]`).boundingBox())!;
      tops.push(notch.y);
    }
    for (let i = 1; i < tops.length; i += 1) {
      expect(Math.abs(tops[i]! - tops[i - 1]!)).toBeGreaterThanOrEqual(48);
    }
    const hints = page.getByRole("list", { name: "操作提示" }).getByRole("listitem");
    await expect(hints.filter({ hasText: "左邊推，車會走" }).locator("svg")).toHaveCount(2);
    await expect(hints.filter({ hasText: "右邊拉，車會停" }).locator("svg")).toHaveCount(2);
    await expect(hints.filter({ hasText: "門亮了就按" }).locator("svg")).toHaveCount(1);
  });

  test("車內廣播：音效開著念「下一站」，關掉音效就不念", async ({ page }) => {
    await page.addInitScript(() => {
      const spoken: string[] = [];
      (window as unknown as { __spoken: string[] }).__spoken = spoken;
      class FakeUtterance {
        text: string;
        lang = "";
        rate = 1;
        pitch = 1;
        volume = 1;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }
      Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FakeUtterance, configurable: true });
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          speaking: false,
          pending: false,
          speak: (u: FakeUtterance) => spoken.push(u.text),
          cancel: () => undefined,
          getVoices: () => [],
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        },
        configurable: true,
      });
      window.__orangeExpress = { freeze: true, driver: "big" };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken))
      .toContain("下一站，遊樂園站");

    await page.goto("/games/orange-express");
    await page.getByRole("button", { name: "關閉音效" }).click();
    await startLevel(page, "自己開");
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).toEqual([]);
  });

  test("手機觸控：點動力格，車真的會走", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const power = page.getByRole("slider", { name: "動力" });
    await power.locator('[data-notch="3"]').tap();
    await expect(power).toHaveAttribute("aria-valuenow", "3");
    await expect
      .poll(async () => Number(await page.getByRole("meter", { name: "速度表" }).getAttribute("aria-valuenow")))
      .toBeGreaterThan(0);
    await context.close();
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

test.describe("小橘特快車：桌面從 P0 推動力，車真的會走", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  async function speed(page: Page): Promise<number> {
    return Number(await page.getByRole("meter", { name: "速度表" }).getAttribute("aria-valuenow"));
  }

  async function windshield(page: Page): Promise<Buffer> {
    return page.getByTestId("orange-express-windshield").screenshot({ animations: "allow" });
  }

  test("鍵盤：快速按一下 ↑ 也算，速度表起來、前窗在動", async ({ page }) => {
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const power = page.getByRole("slider", { name: "動力" });
    await expect(power).toHaveAttribute("aria-valuenow", "0");
    expect(await speed(page)).toBe(0);
    const still = await windshield(page);

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(power).toHaveAttribute("aria-valuenow", "2");
    await expect(page.getByTestId("orange-express-power-word")).not.toHaveText("停");
    await expect.poll(() => speed(page)).toBeGreaterThan(0);
    await expect.poll(async () => (await windshield(page)).equals(still)).toBe(false);
  });

  test("鍵盤：焦點在桿上時方向鍵只動那根桿", async ({ page }) => {
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const power = page.getByRole("slider", { name: "動力" });
    const brake = page.getByRole("slider", { name: "煞車" });
    await power.focus();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(power).toHaveAttribute("aria-valuenow", "2");
    await expect(brake).toHaveAttribute("aria-valuenow", "0");
    await expect.poll(() => speed(page)).toBeGreaterThan(0);

    await brake.focus();
    await page.keyboard.press("ArrowUp");
    await expect(brake).toHaveAttribute("aria-valuenow", "1");
    await expect(power).toHaveAttribute("aria-valuenow", "2");
    await page.keyboard.press("Home");
    await expect(brake).toHaveAttribute("aria-valuenow", "0");
  });

  test("滑鼠：點 P2 那一格、拖把手，速度表起來", async ({ page }) => {
    await page.goto("/games/orange-express");
    await startLevel(page, "自己開");
    const power = page.getByRole("slider", { name: "動力" });
    await power.locator('[data-notch="2"]').click();
    await expect(power).toHaveAttribute("aria-valuenow", "2");
    await expect.poll(() => speed(page)).toBeGreaterThan(0);

    await power.locator('[data-notch="0"]').click();
    await expect(power).toHaveAttribute("aria-valuenow", "0");
    const box = (await power.boundingBox())!;
    const x = box.x + box.width * 0.25;
    await page.mouse.move(x, box.y + box.height - 10);
    await page.mouse.down();
    await page.mouse.move(x, box.y + 10, { steps: 8 });
    await page.mouse.up();
    await expect(power).toHaveAttribute("aria-valuenow", "4");
  });
});
