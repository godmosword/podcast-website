import { expect, type Locator, type Page } from "@playwright/test";

/**
 * 浮層幾何契約。
 *
 * 由來：2026-09-02 稽核發現 `/adventures` 首訪提示在 ≤480 被三層浮層蓋死，
 * 而三個既有 e2e **全綠**——`toBeVisible()` 只看 bounding box 與 CSS 可見性，
 * **不偵測遮蔽**。全站當時只有一支 spec 有 `elementFromPoint` 斷言。
 *
 * ## 兩種斷言，語意不同，不可混用
 *
 * - {@link expectHitTestable}：走 `elementFromPoint`，答的是「**使用者點得到嗎**」。
 *   `pointer-events: none` 的浮層對它是透明的——視覺上蓋住、但指標穿透，這裡會過。
 * - {@link expectNoOverlap}：純矩形相交，答的是「**視覺上疊到了嗎**」。
 *   抓得到 `pointer-events: none` 的視覺遮蔽，但抓不到 z 序（兩個不重疊的元素永遠過）。
 *
 * 要完整證明「沒被蓋住」，兩個都要用。只用前者會漏掉半透明覆蓋；
 * 只用後者會漏掉「重疊但我在上面」的正常情況被誤判。
 */

/** 地圖 chrome 的邊距慣例（MapControls 10px、其餘浮層 12px）。
 *  注意：DESIGN §206-209 是**觸控密度**條款，**沒有**螢幕邊距規定，勿再誤引。 */
export const OVERLAY_MIN_INSET = 12;

type Rect = { top: number; right: number; bottom: number; left: number };

/** 元素在這個尺寸／路由下是否**必須**存在。
 *  `optional` 是給真的會條件渲染的浮層（例如島選擇列只在 ≤480 出現）；
 *  其餘一律用 `present`，否則 selector 打錯或元件回歸都會靜默變綠。 */
export type Presence = "present" | "optional";

async function rectOf(
  locator: Locator,
  label: string,
  presence: Presence,
): Promise<Rect | null> {
  const count = await locator.count();
  if (count === 0) {
    // 「預期存在但不見了」與「本來就不該在」必須分開，不能都當通過
    expect(presence, `${label} 應存在但找不到`).toBe("optional");
    return null;
  }
  // 多重匹配時 boundingBox() 只取第一個，會量到錯的節點
  expect(count, `${label} 匹配到 ${count} 個元素，請收斂 selector 或加 .first()`).toBe(1);
  const box = await locator.boundingBox();
  if (!box || box.width <= 0 || box.height <= 0) return null;
  return {
    top: box.y,
    left: box.x,
    right: box.x + box.width,
    bottom: box.y + box.height,
  };
}

/**
 * 多點 hit-test：元素中心 ＋ 四個內縮角落，全部都必須命中自己（或自己的後代）。
 *
 * **這是低成本啟發式，不是完整遮蔽證明**：只覆蓋最外側 25%、細長邊條、或落在
 * 兩取樣點之間的遮蔽都抓不到。要更高鑑別力就加四邊中點或 3×3 取樣。
 * 失敗訊息刻意講「有取樣點被接住」而不是「全部可點」，別在呼叫端寫過強的敘述。
 *
 * **只取中心點是不夠的**——浮層常只蓋住目標的下緣或某一角（dock、島選擇列、
 * 底列都貼在視窗邊緣），中心點對「誰蓋住誰的邊」完全是盲的。
 *
 * 命中判定用 `contains` 而非 `===`：中心點多半落在 icon／文字／`<svg>` 之類的
 * 子節點上，嚴格相等會整批假紅。
 */
export async function expectHitTestable(
  page: Page,
  locator: Locator,
  label: string,
): Promise<void> {
  await expect(locator, `${label} 應存在`).toHaveCount(1);
  const box = await locator.boundingBox();
  expect(box, `${label} 沒有可量測的矩形`).not.toBeNull();
  // 零尺寸元素的 elementFromPoint 結果沒有意義，helper 直接拒絕而非給假綠
  expect(box!.width, `${label} 寬度為 0`).toBeGreaterThan(0);
  expect(box!.height, `${label} 高度為 0`).toBeGreaterThan(0);
  const handle = await locator.elementHandle();
  expect(handle, `${label} 取不到 element handle`).not.toBeNull();

  const blocked = await page.evaluate((el) => {
    const r = (el as Element).getBoundingClientRect();
    // 內縮 25% 取角，避免落在邊框、圓角或 outline 上造成偽陽性
    const insetX = r.width * 0.25;
    const insetY = r.height * 0.25;
    const points: [string, number, number][] = [
      ["中心", r.left + r.width / 2, r.top + r.height / 2],
      ["左上", r.left + insetX, r.top + insetY],
      ["右上", r.right - insetX, r.top + insetY],
      ["左下", r.left + insetX, r.bottom - insetY],
      ["右下", r.right - insetX, r.bottom - insetY],
    ];
    const hits: { at: string; by: string }[] = [];
    for (const [name, x, y] of points) {
      const top = document.elementFromPoint(x, y);
      if (top && (el as Element).contains(top)) continue;
      const by = top
        ? `${top.tagName.toLowerCase()}${
            typeof top.className === "string" && top.className
              ? "." + top.className.trim().split(/\s+/)[0]
              : ""
          }`
        : "(null)";
      hits.push({ at: name, by });
    }
    return hits;
  }, handle);

  expect(
    blocked,
    `${label} 有取樣點被其他元素接住（＝使用者點不到）：${JSON.stringify(blocked)}`,
  ).toEqual([]);
}

/** 兩個浮層的矩形不得相交。抓得到 `pointer-events: none` 的視覺遮蔽。 */
export async function expectNoOverlap(
  a: Locator,
  b: Locator,
  label: string,
  presence: { a?: Presence; b?: Presence } = {},
): Promise<void> {
  const [ra, rb] = await Promise.all([
    rectOf(a, `${label}（前者）`, presence.a ?? "present"),
    rectOf(b, `${label}（後者）`, presence.b ?? "present"),
  ]);
  // 走到這裡代表缺席方已被宣告為 optional（條件渲染），無從重疊
  if (!ra || !rb) return;
  const overlaps =
    ra.bottom > rb.top &&
    rb.bottom > ra.top &&
    ra.right > rb.left &&
    rb.right > ra.left;
  expect(
    overlaps,
    `${label}：矩形重疊 a=${JSON.stringify(ra)} b=${JSON.stringify(rb)}`,
  ).toBe(false);
}

/** 完整落在視窗內並保有邊距；同時確認沒有把自己的內容擠出去。 */
export async function expectWithinViewport(
  page: Page,
  locator: Locator,
  label: string,
  inset: number = OVERLAY_MIN_INSET,
): Promise<void> {
  const rect = await rectOf(locator, label, "present");
  expect(rect, `${label} 沒有可量測的矩形`).not.toBeNull();
  const { innerWidth, innerHeight, scrollWidth } = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(rect!.top, `${label} 上緣`).toBeGreaterThanOrEqual(0);
  expect(rect!.left, `${label} 左緣`).toBeGreaterThanOrEqual(inset);
  expect(rect!.right, `${label} 右緣`).toBeLessThanOrEqual(innerWidth - inset);
  expect(rect!.bottom, `${label} 下緣`).toBeLessThanOrEqual(innerHeight);
  // 靜默裁切不會撐大 scrollWidth，所以這條是輔助而非主要斷言
  expect(scrollWidth, `${label} 所在頁面不得橫向溢出`).toBeLessThanOrEqual(
    innerWidth,
  );

  // 夾制不得把自己的內容擠出去（例如關閉鍵被裁掉就點不到了）
  const squeezed = await locator.evaluate((el) => ({
    scrollW: el.scrollWidth,
    clientW: el.clientWidth,
  }));
  expect(
    squeezed.scrollW,
    `${label} 內容被自己的 max-width 擠出去`,
  ).toBeLessThanOrEqual(squeezed.clientW + 1);
}
