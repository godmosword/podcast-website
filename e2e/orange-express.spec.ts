import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-keys";
import { jumpOrangeExpress as jump, startOrangeExpress as startLevel } from "./helpers/orange-express";
import { pinTheme } from "./visual-helpers";

async function tap(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(60);
  await page.keyboard.up(key);
  await page.waitForTimeout(60);
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
    // 上車的朋友原位留一個勾（頭像滑走，勾冒出來）。
    await expect(
      page.getByRole("list", { name: "月台上的朋友" }).locator('li[data-boarded="true"] svg'),
    ).toHaveCount(4);
    await page.getByRole("button", { name: "關門" }).click();
    await expect(page.getByRole("heading", { name: "到家了" })).toBeVisible();
    // 星星只算整趟；每站是色塊加「剛剛好／停到了」，結算不再出現 ★。
    const result = page.getByTestId("orange-express-result");
    await expect(result.locator("li[data-grade='green']")).toContainText("剛剛好");
    await expect(result).not.toContainText("★");
    // 到家的小橘（貼紙生好前是向量小橘臉）。
    await expect(result.getByTestId("orange-express-result-xiaoju").locator("svg, img")).toHaveCount(1);

    const saved = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, PROGRESS_STORAGE_KEY);
    expect(saved.gameProfile.stickers).toContain("played-orange-express");
    expect(saved.gameProfile.medals["orange-express"][0] & 1).toBe(1);
  });

  test("慢慢看：門還沒亮就按，當下說門亮了再按，到家還是三顆星", async ({ page }) => {
    await page.goto("/games/orange-express");
    await startLevel(page, "慢慢看");
    const door = page.getByRole("button", { name: "開門" });
    await door.click({ force: true });
    const notice = page.getByTestId("orange-express-notice");
    await expect(notice).toHaveAttribute("data-kind", "door");
    await expect(notice).toContainText("門亮了再按");

    await jump(page, { progress: 0.6, speed: 0 });
    await door.click();
    await page.getByRole("button", { name: "關門" }).click();
    await expect(page.getByRole("heading", { name: "到家了" })).toBeVisible();
    const result = page.getByTestId("orange-express-result");
    await expect(result.getByRole("img", { name: "拿到 3 顆星，共 3 顆" })).toBeVisible();
    await expect(result.locator('[data-rule="early-door"]')).toHaveCount(0);
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
    // 按太早當下就說，不等到結算才知道。
    const notice = page.getByTestId("orange-express-notice");
    await expect(notice).toHaveAttribute("data-kind", "door");
    await expect(notice).toContainText("門亮了再按");

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

  test("進站：停車目標條出現，停在綠區說剛剛好、黃區說停到了", async ({ page }) => {
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
    // 進站時按太早：停車目標條說，不在前窗右上再多一塊。
    await page.getByRole("button", { name: "開門" }).click({ force: true });
    await expect(page.getByTestId("orange-express-stop-words")).toContainText("門亮了再按");
    await expect(page.getByTestId("orange-express-notice")).toHaveCount(0);

    await jump(page, { progress: 0.65, speed: 0, brake: 4, freeze: false });
    await expect(bar).toHaveAttribute("data-grade", "green");
    await expect(page.getByTestId("orange-express-stop-words")).toHaveText("剛剛好，停在綠區");

    await page.getByRole("button", { name: "開門" }).click();
    await page.getByRole("button", { name: "關門" }).click();
    await jump(page, { progress: 0.53, speed: 0 });
    await expect(bar).toHaveAttribute("data-grade", "yellow");
    await expect(page.getByTestId("orange-express-stop-words")).toHaveText("停到了，在黃區");
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

  test("標題：最上面一張有框的主視覺看得到小橘，手機第一屏仍按得到開始開車", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/orange-express");
    const hero = page.getByTestId("orange-express-title-hero");
    await expect(hero).toBeVisible();
    // 封面還是暫代 SVG 時用向量小橘頂著；換成生成的封面後是一張圖。
    await expect(hero.locator("svg, img")).toHaveCount(1);
    const start = (await page.getByRole("button", { name: "開始開車" }).boundingBox())!;
    expect(start.y + start.height).toBeLessThanOrEqual(844);
    // 很矮的手機：主視覺壓成一條，開始鈕仍在第一屏。
    for (const [width, height] of [
      [375, 553],
      [320, 568],
    ] as const) {
      await page.setViewportSize({ width, height });
      const low = (await page.getByRole("button", { name: "開始開車" }).boundingBox())!;
      expect(low.y + low.height, `${width}×${height}`).toBeLessThanOrEqual(height);
    }
  });

  test("標題：三張難度卡都有圖示，小點一到三個表示多難", async ({ page }) => {
    await page.goto("/games/orange-express");
    for (const [name, dots] of [
      ["慢慢看", 1],
      ["自己開", 2],
      ["小站長", 3],
    ] as const) {
      const card = page.getByRole("radio", { name: new RegExp(name) });
      await expect(card.locator("svg")).toHaveCount(1);
      await expect(card.locator('i[data-on="true"]')).toHaveCount(dots);
    }
  });

  for (const theme of ["light", "night"] as const) {
    test(`標題：選中的黃卡上，副標與司機說明的小字對比夠（${theme}）`, async ({ page }) => {
      // 遊戲頁的 a11y 掃描排除標題屏；司機說明收進「自己開」卡片後，小字就落在黃底上。
      await page.emulateMedia({ reducedMotion: "reduce" });
      await pinTheme(page, theme);
      await page.goto("/games/orange-express");
      await page.getByRole("radio", { name: /自己開/ }).click();
      await expect(page.getByTestId("orange-express-driver-note")).toContainText("家長在遊戲設定切換");
      const results = await new AxeBuilder({ page })
        .include('[role="radio"][aria-checked="true"]')
        .withRules(["color-contrast"])
        .analyze();
      expect(results.violations.flatMap((v) => v.nodes.map((n) => n.failureSummary))).toEqual([]);
    });
  }

  test("司機：預設小小司機；家長在遊戲設定切成大司機", async ({ page }) => {
    await page.goto("/games/orange-express");
    await page.getByRole("radio", { name: /自己開/ }).click();
    // 司機說明在「自己開」卡片裡，不是另外一張看起來能選的卡。
    await expect(
      page.getByRole("radio", { name: /自己開/ }).getByTestId("orange-express-driver-note"),
    ).toContainText("小小司機");
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
    // 不識字也看得懂：每種提示前面都有圖示。
    await expect(page.getByTestId("orange-express-notice").locator("svg")).toHaveCount(1);

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

  test("手機煞車格每格至少 48px；底部提示在標題面，開車時收起讓給前窗", async ({ page }) => {
    await page.goto("/games/orange-express");
    const hints = page.getByRole("list", { name: "操作提示" }).getByRole("listitem");
    await expect(hints.filter({ hasText: "左邊推，車會走" }).locator("svg")).toHaveCount(2);
    await expect(hints.filter({ hasText: "右邊拉，車會停" }).locator("svg")).toHaveCount(2);
    await expect(hints.filter({ hasText: "門亮了就按" }).locator("svg")).toHaveCount(1);

    await startLevel(page, "自己開");
    await expect(page.getByRole("list", { name: "操作提示" })).toBeHidden();
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
    // 前窗至少佔視窗三成五，車門在視窗內，不用捲。
    const viewHeight = page.viewportSize()!.height;
    const glass = (await page.getByTestId("orange-express-windshield").boundingBox())!;
    expect(glass.height).toBeGreaterThanOrEqual(viewHeight * 0.35);
    const door = (await page.getByRole("button", { name: "開門" }).boundingBox())!;
    expect(door.y + door.height).toBeLessThanOrEqual(viewHeight);
  });

  test("慢慢看的動力桿只排摸得到的三格", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "慢慢看");
    const power = page.getByRole("slider", { name: "動力" });
    await expect(power).toHaveAttribute("aria-valuemax", "2");
    await expect(power.locator("[data-notch]")).toHaveCount(3);
    const box = (await power.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + 12);
    await expect(power).toHaveAttribute("aria-valuenow", "2");
    await expect(page.getByRole("button", { name: "開門" })).toHaveAttribute("data-shake", "false");
  });

  test("慢慢看的煞車桿只有鬆、停、緊急三格，←→ 照順序走", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { freeze: true };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "慢慢看");
    const brake = page.getByRole("slider", { name: "煞車" });
    await expect(brake).toHaveAttribute("aria-valuemax", "2");
    const notches = brake.locator("[data-notch]");
    await expect(notches).toHaveCount(3);
    await expect(notches).toHaveText(["緊急", "停", "鬆"]);
    for (const n of ["0", "3", "5"]) {
      const box = (await brake.locator(`[data-notch="${n}"]`).boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
    await tap(page, "ArrowLeft");
    await expect(brake).toHaveAttribute("aria-valuetext", "煞車，停");
    await expect(brake.locator('[data-notch="3"]')).toHaveAttribute("data-on", "true");
    await tap(page, "ArrowLeft");
    await expect(brake).toHaveAttribute("aria-valuetext", "煞車，緊急");
    await tap(page, "ArrowRight");
    await tap(page, "ArrowRight");
    await expect(brake).toHaveAttribute("aria-valuenow", "0");
    await expect(brake).toHaveAttribute("aria-valuetext", "煞車，鬆");
  });

  test("結算：每站都停綠區但開過頭，提示說不要開過頭", async ({ page }) => {
    await page.addInitScript(() => {
      window.__orangeExpress = { progress: 0.62, speed: 0, misses: 1 };
    });
    await page.goto("/games/orange-express");
    await startLevel(page, "慢慢看");
    await expect(page.getByTestId("orange-express-drive")).toHaveAttribute("data-phase", "stopped");
    await page.getByRole("button", { name: "開門" }).click();
    await page.getByRole("button", { name: "關門" }).click();
    await expect(page.getByRole("heading", { name: "到家了" })).toBeVisible();
    const hints = page.getByRole("list", { name: "還能多拿星星" });
    await expect(hints).toContainText("不要開過頭");
    await expect(hints).not.toContainText("停在綠色區");
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
    // 「下一站」念完才輪到前窗：出發的指差確認念要喊的那句，只念一次。
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken), { timeout: 8000 })
      .toEqual(["下一站，遊樂園站", "號誌，綠燈！"]);

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

test.describe("小橘特快車：版面", () => {
  type Box = { x: number; y: number; width: number; height: number };
  const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

  for (const { width, height } of [
    { width: 844, height: 390 },
    { width: 667, height: 375 },
  ]) {
    test.describe(`橫拿手機 ${width}×${height}`, () => {
      test.use({ viewport: { width, height }, hasTouch: true });

      test("兩根桿、前窗、車門都在一屏內，前窗下面那條不互相蓋住", async ({ page }) => {
        await page.addInitScript(() => {
          window.__orangeExpress = { freeze: true, driver: "big" };
        });
        await page.goto("/games/orange-express");
        await startLevel(page, "自己開");
        const box = async (locator: Locator) => {
          const found = await locator.boundingBox();
          expect(found).not.toBeNull();
          expect(found!.y).toBeGreaterThanOrEqual(0);
          expect(found!.y + found!.height).toBeLessThanOrEqual(height);
          return found!;
        };
        await box(page.getByRole("slider", { name: "動力" }));
        await box(page.getByRole("slider", { name: "煞車" }));
        const glass = await box(page.getByTestId("orange-express-windshield"));
        expect(glass.height).toBeGreaterThanOrEqual(160);

        const cab = page.getByTestId("orange-express-cab");
        const strip = [
          await box(page.getByTestId("orange-express-horn")),
          await box(cab.getByText("遊樂園", { exact: true })),
          await box(page.getByTestId("orange-express-gauge")),
          await box(page.getByRole("button", { name: "開門" })),
        ];
        for (let i = 0; i < strip.length; i += 1) {
          for (let j = i + 1; j < strip.length; j += 1) {
            expect(overlaps(strip[i]!, strip[j]!), `第 ${i} 與第 ${j} 個疊在一起`).toBe(false);
          }
        }
        const scroll = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scroll).toBeLessThanOrEqual(height);
      });
    });
  }

  test.describe("直拿手機 390×844：前窗疊層", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("開車與進站時前窗中間那條空著；提示、指差確認鈕、乘客卡、停車目標條不互相蓋住", async ({ page }) => {
      // 指差確認鈕出現時會跳一下；量框要量停下來的大小。
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(() => {
        window.__orangeExpress = { freeze: true, driver: "big" };
      });
      await page.goto("/games/orange-express");
      await startLevel(page, "小站長");
      const glass = (await page.getByTestId("orange-express-windshield").boundingBox())!;
      const layers = async () => {
        const out: { name: string; box: Box }[] = [];
        for (const [name, locator] of [
          ["停車目標條", page.getByTestId("orange-express-stopbar")],
          ["提示", page.getByTestId("orange-express-notice")],
          ["指差確認", page.getByTestId("orange-express-point")],
          ["乘客卡", page.getByRole("list", { name: "月台上的朋友" })],
        ] as const) {
          if ((await locator.count()) === 0) continue;
          const box = await locator.boundingBox();
          if (box) out.push({ name, box });
        }
        return out;
      };
      const states = [
        { label: "出發", patch: { progress: 0, speed: 0.2 }, running: true },
        { label: "速限牌", patch: { progress: 0.05, speed: 0.4 }, running: true },
        { label: "鐵橋", patch: { stationIndex: 1, progress: 0.15, speed: 0.4 }, running: true },
        { label: "進站", patch: { stationIndex: 1, progress: 0.55, speed: 0.3, brake: 2 }, running: true },
        { label: "停好", patch: { stationIndex: 1, progress: 0.65, speed: 0 }, running: false },
      ];
      for (const { label, patch, running } of states) {
        await jump(page, patch);
        await page.waitForTimeout(100);
        const found = await layers();
        for (let i = 0; i < found.length; i += 1) {
          for (let j = i + 1; j < found.length; j += 1) {
            expect(overlaps(found[i]!.box, found[j]!.box), `${label}：${found[i]!.name}和${found[j]!.name}疊在一起`).toBe(
              false,
            );
          }
        }
        if (!running) continue;
        const top = Math.max(
          glass.y,
          ...found.filter((f) => f.name === "停車目標條" || f.name === "提示").map((f) => f.box.y + f.box.height),
        );
        const strip = { x: glass.x + glass.width * 0.3, y: top, width: glass.width * 0.4, height: glass.y + glass.height - top };
        for (const f of found) {
          if (f.name === "停車目標條" || f.name === "提示") continue;
          expect(overlaps(f.box, strip), `${label}：${f.name}蓋到前窗中間`).toBe(false);
        }
      }
      await expect(page.getByText("色塊")).toHaveCount(0);
    });
  });

  for (const { width, height } of [
    { width: 375, height: 553 },
    { width: 320, height: 568 },
  ]) {
    test.describe(`很矮的直式手機 ${width}×${height}`, () => {
      test.use({ viewport: { width, height }, hasTouch: true });

      test("不捲就看得到整顆車門，煞車每格至少 40px，前窗疊層不互相蓋住", async ({ page }) => {
        // 指差確認鈕出現時會跳一下；量框要量停下來的大小。
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.addInitScript(() => {
          window.__orangeExpress = { freeze: true, driver: "big" };
        });
        await page.goto("/games/orange-express");
        await startLevel(page, "自己開");
        const door = (await page.getByRole("button", { name: "開門" }).boundingBox())!;
        expect(door.y + door.height).toBeLessThanOrEqual(height);
        const scroll = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scroll).toBeLessThanOrEqual(height);
        const brake = page.getByRole("slider", { name: "煞車" });
        const tops: number[] = [];
        for (let i = 0; i <= 5; i += 1) tops.push((await brake.locator(`[data-notch="${i}"]`).boundingBox())!.y);
        for (let i = 1; i < tops.length; i += 1) expect(Math.abs(tops[i]! - tops[i - 1]!)).toBeGreaterThanOrEqual(40);
        const glass = (await page.getByTestId("orange-express-windshield").boundingBox())!;
        expect(glass.height).toBeGreaterThanOrEqual(110);

        // 出發（號誌題＋速限牌提示）、速限牌、進站（月台題）、停好：提示、停車目標條、指差確認鈕、乘客卡彼此不重疊。
        for (const patch of [
          { progress: 0, speed: 0.2 },
          { progress: 0.05, speed: 0.4 },
          { progress: 0.55, speed: 0.3, brake: 2 },
          { progress: 0.65, speed: 0 },
        ]) {
          await jump(page, patch);
          await page.waitForTimeout(100);
          const boxes: Box[] = [];
          for (const locator of [
            page.getByTestId("orange-express-notice"),
            page.getByTestId("orange-express-stopbar"),
            page.getByTestId("orange-express-point"),
            page.getByRole("list", { name: "月台上的朋友" }),
          ]) {
            if ((await locator.count()) === 0) continue;
            const box = await locator.boundingBox();
            if (box) boxes.push(box);
          }
          expect(boxes.length).toBeGreaterThanOrEqual(2);
          for (let i = 0; i < boxes.length; i += 1) {
            for (let j = i + 1; j < boxes.length; j += 1) expect(overlaps(boxes[i]!, boxes[j]!)).toBe(false);
          }
        }
      });
    });
  }

  test.describe("最窄的手機", () => {
    test.use({ viewport: { width: 320, height: 568 }, hasTouch: true });

    test("駕駛台不橫向撐破，緊急格不換行", async ({ page }) => {
      await page.goto("/games/orange-express");
      await startLevel(page, "自己開");
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(320);
      const cab = (await page.getByTestId("orange-express-cab").boundingBox())!;
      expect(cab.x + cab.width).toBeLessThanOrEqual(320);
      // 「緊急」兩個字排在同一行，也沒有被格子切掉。
      const fit = await page
        .getByRole("slider", { name: "煞車" })
        .locator('[data-notch="5"]')
        .evaluate((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return { lines: range.getClientRects().length, overflow: el.scrollWidth - el.clientWidth };
        });
      expect(fit.lines).toBe(1);
      expect(fit.overflow).toBeLessThanOrEqual(1);
    });
  });
});
