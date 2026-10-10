// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { freshGame } from "@/lib/games/block-drop/engine";
import { BLOCK_STATIONS, buildBlockRound } from "@/lib/games/block-drop/stages";
import { BlockDropMap, type BlockStationPreview } from "./BlockDropMap";
import { BlockDropResult } from "./BlockDropResult";
import { BlockDropTaskBar } from "./BlockDropTaskBar";
import { BlockDropTitle } from "./BlockDropTitle";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
// next/image 在 jsdom 只要一張 img 就好
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- 測試替身
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

afterEach(cleanup);

const round = (mode: "easy" | "challenge", index = 0) => buildBlockRound(index, mode, { replay: false, rng: () => 0.5 });

describe("方塊轉轉標題頁", () => {
  it("只有一顆主按鈕「開始冒險」、小鈕「自由堆疊」與星星總數；沒有速度選項與「怎麼玩」", () => {
    const onStart = vi.fn();
    const onFree = vi.fn();
    render(<BlockDropTitle starsGot={4} starsTotal={30} onStart={onStart} onFree={onFree} />);

    expect(screen.getByRole("heading", { name: "準備疊方塊！" })).toBeTruthy();
    expect(screen.getByLabelText("已經拿到 4 顆星，全部 30 顆")).toBeTruthy();
    expect(within(screen.getByRole("list", { name: "玩法三步驟" })).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByText(/怎麼玩/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "開始冒險" }));
    fireEvent.click(screen.getByRole("button", { name: "自由堆疊" }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onFree).toHaveBeenCalledTimes(1);
  });
});

describe("方塊轉轉地圖", () => {
  const preview = (): BlockStationPreview => ({
    stones: ["X..XXXXX", "X..X..XX"],
    goals: [{ kind: "clear-rows", count: 3 }],
    summary: "消 3 排",
    pieceCap: 10,
    replay: false,
  });

  function renderMap(mode: "easy" | "challenge", overrides: Partial<React.ComponentProps<typeof BlockDropMap>> = {}) {
    const props = {
      stations: BLOCK_STATIONS,
      stars: BLOCK_STATIONS.map(() => 0),
      maxCleared: 0,
      mode,
      onModeChange: vi.fn(),
      previewFor: preview,
      onStart: vi.fn(),
      onFree: vi.fn(),
      ...overrides,
    };
    render(<BlockDropMap {...props} />);
    return props;
  }

  it("玩法只留圖示＋兩個字，完整說明在 aria-label", () => {
    renderMap("easy");
    const easy = screen.getByRole("radio", { name: /輕鬆冒險/ });
    expect(easy.textContent).toBe("輕鬆");
    expect(easy.getAttribute("aria-label")).toContain("慢慢落、不會輸");
    expect(screen.getByRole("radio", { name: /挑戰冒險/ }).textContent).toBe("挑戰");
  });

  it("下一站大卡：大圓開始鈕帶 data-next，任務整句給讀屏；挑戰模式寫出塊數", () => {
    const props = renderMap("challenge");
    const start = screen.getByRole("button", { name: "開始：第 1 站 積木小屋" });
    expect(start.getAttribute("data-next")).toBe("true");
    expect(start.textContent).toBe("");
    expect(screen.getByLabelText("消 3 排，10 塊內完成")).toBeTruthy();
    fireEvent.click(start);
    expect(props.onStart).toHaveBeenCalledWith(0);
  });

  it("點鎖住的站：說明要先完成哪一站；沒有說明句和「回標題」", () => {
    renderMap("easy");
    fireEvent.click(screen.getByRole("button", { name: /第 4 站.*未解鎖/ }));
    expect(screen.getByRole("status").textContent).toContain("先完成第 1 站");
    expect(screen.queryByText(/星星是每站累積的獎章/)).toBeNull();
    expect(screen.queryByRole("button", { name: "回標題" })).toBeNull();
    expect(screen.getByRole("button", { name: "自由堆疊" })).toBeTruthy();
  });
});

describe("方塊轉轉任務列", () => {
  it("挑戰模式：第 N 站＋大數字目標＋剩幾塊（圖示＋數字），不倒數第三顆星、不放概念小字", () => {
    const r = round("challenge");
    const g = { ...freshGame(r.stage.cols, r.stage.rows), pieces: 4 };
    render(<BlockDropTaskBar round={r} g={g} />);

    const bar = screen.getByRole("region", { name: "本站任務進度" });
    expect(bar.textContent).toContain("第 1 站");
    expect(screen.getByLabelText(`還能放 ${r.stage.pieceCap - 4} 塊`)).toBeTruthy();
    expect(screen.getByRole("listitem", { name: /^消 3 排，還差 3 排$/ })).toBeTruthy();
    expect(bar.textContent).not.toMatch(/再 \d+ 塊|慢慢來/);
    expect(bar.textContent).not.toContain(r.station.concept);
  });

  it("輕鬆模式沒有塊數", () => {
    const r = round("easy");
    render(<BlockDropTaskBar round={r} g={freshGame(r.stage.cols, r.stage.rows)} />);
    expect(screen.queryByLabelText(/還能放/)).toBeNull();
  });
});

describe("方塊轉轉冒險結算", () => {
  const handlers = { onNext: vi.fn(), onReplay: vi.fn(), onEasier: vi.fn(), onMap: vi.fn() };

  it("過關拿 2 顆：星星由左往右亮、只列沒達成的條件；回地圖／下一站／再挑戰同一排", () => {
    const r = round("challenge");
    render(
      <BlockDropResult
        round={r}
        outcome={{ kind: "won", stars: 2, flawless: false, efficient: true, pieces: 6 }}
        isLast={false}
        font="system-ui"
        reducedMotion
        {...handlers}
      />,
    );
    expect(screen.getByRole("img", { name: "拿到 2 顆星，共 3 顆" })).toBeTruthy();
    const hints = within(screen.getByRole("list", { name: "還能多拿星星" })).getAllByRole("listitem");
    expect(hints.map((li) => li.getAttribute("data-rule"))).toEqual(["flawless"]);
    expect(hints[0]!.textContent).toContain("不越黃線");
    expect(screen.queryByText(/這一站總共|這一局/)).toBeNull();

    const map = screen.getByRole("button", { name: "回地圖" });
    expect(map.textContent).toBe("");
    expect(map.parentElement).toBe(screen.getByRole("button", { name: "下一站" }).parentElement);
    expect(map.parentElement).toBe(screen.getByRole("button", { name: "再挑戰" }).parentElement);
  });

  it("拿滿 3 顆只有星星", () => {
    render(
      <BlockDropResult
        round={round("easy")}
        outcome={{ kind: "won", stars: 3, flawless: true, efficient: true, pieces: 4 }}
        isLast={false}
        font="system-ui"
        reducedMotion
        {...handlers}
      />,
    );
    expect(screen.queryByRole("list", { name: "還能多拿星星" })).toBeNull();
  });

  it("挑戰沒過：標題 8 字內，回地圖在同一排", () => {
    render(
      <BlockDropResult
        round={round("challenge")}
        outcome={{ kind: "retry", reason: "outOfPieces", lines: 1 }}
        isLast={false}
        font="system-ui"
        reducedMotion
        {...handlers}
      />,
    );
    expect(screen.getByRole("dialog", { name: "方塊用完了！" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "回地圖" }).parentElement).toBe(
      screen.getByRole("button", { name: "再挑戰" }).parentElement,
    );
  });
});
