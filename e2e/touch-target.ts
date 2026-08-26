import { expect, type Locator } from "@playwright/test";

/** DESIGN.md：兒童主路徑觸控區下限。 */
export const MIN_TOUCH_PX = 44;

export async function expectTouchTarget(
  locator: Locator,
  label: string,
): Promise<void> {
  await expect(locator, label).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} boundingBox`).not.toBeNull();
  expect(box!.width, `${label} 寬`).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
  expect(box!.height, `${label} 高`).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
}
