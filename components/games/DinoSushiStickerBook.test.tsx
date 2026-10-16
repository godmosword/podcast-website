// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DINO_SUSHI_STICKER_TOTAL } from "@/lib/games/dino-sushi/stickers";
import { DinoSushiStickerBook } from "./DinoSushiStickerBook";

afterEach(cleanup);

describe("貼紙書", () => {
  it("30 格；拿到的寫名字，沒拿到的是問號，點了會念", () => {
    const onSpeak = vi.fn();
    const onClose = vi.fn();
    render(
      <DinoSushiStickerBook
        unlocked={["topping-tamago", "customer-xiaohong"]}
        seen={[]}
        reducedMotion
        onClose={onClose}
        onSpeak={onSpeak}
      />,
    );
    expect(screen.getByRole("region", { name: "來過的朋友" })).toBeTruthy();
    const friend = screen.getByRole("button", { name: "小紅" });
    expect(friend.querySelector("img")?.getAttribute("src")).toBe("/characters/小紅賽車.jpg");
    expect(friend.querySelector("[data-kind='customer']")).toBeTruthy();
    const lockedFriend = screen.getByRole("button", { name: "還沒有。幫安安做對一盤" });
    expect(lockedFriend.textContent).toContain("？");
    expect(lockedFriend.querySelector("img")?.getAttribute("src")).toBe("/characters/安安救護車.jpg");
    expect(screen.getAllByRole("button").filter((button) => button.getAttribute("data-locked") === "true")).toHaveLength(
      DINO_SUSHI_STICKER_TOTAL - 2,
    );
    const got = screen.getByRole("button", { name: "玉子" });
    expect(got.getAttribute("data-new")).toBe("true");
    fireEvent.click(got, { detail: 0 });
    expect(onSpeak).toHaveBeenCalledWith("玉子");
    const locked = screen.getByRole("button", { name: "還沒有。把蝦放上壽司" });
    expect(locked.textContent).toContain("？");
    fireEvent.click(locked, { detail: 0 });
    expect(onSpeak).toHaveBeenLastCalledWith("還沒有。把蝦放上壽司");
    fireEvent.click(screen.getByRole("button", { name: "回去" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
