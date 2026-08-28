import { expect, test } from "@playwright/test";
import { PARENT_GATE_COPY } from "../lib/parent-gate";
import { expectTouchTarget } from "./touch-target";

test.describe("UX-P0-1 家長閘門", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });

  test("未注入通過狀態時閘門可見、儀表板內容不在 DOM", async ({ page }) => {
    await page.goto("/for-parents/dashboard");

    await expect(
      page.getByRole("heading", { level: 1, name: "家庭儀表板" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: PARENT_GATE_COPY.title }),
    ).toBeVisible();
    await expect(page.getByText(PARENT_GATE_COPY.hint)).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "小遊戲探索摘要" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "家長快速設定" }),
    ).toHaveCount(0);
    await expect(page.getByLabel("兒童模式")).toHaveCount(0);

    const answer = page.getByLabel(new RegExp(`^${PARENT_GATE_COPY.questionPrefix}`));
    await expectTouchTarget(answer, "閘門答案輸入框");
    await expectTouchTarget(
      page.getByRole("button", { name: PARENT_GATE_COPY.submit }),
      "閘門送出鈕",
    );
  });
});
