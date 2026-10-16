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

  it("鎖住的格子用原圖當剪影遮罩；拿到的不帶遮罩", () => {
    render(
      <DinoSushiStickerBook unlocked={["topping-tamago"]} seen={[]} reducedMotion onClose={vi.fn()} onSpeak={vi.fn()} />,
    );
    const locked = screen.getByRole("button", { name: "還沒有。把蝦放上壽司" });
    const sil = (locked.querySelector("[data-kind]") as HTMLElement).style.getPropertyValue("--sil");
    expect(sil).toMatch(/^url\(".*shrimp\.webp"\)$/);
    const friend = screen.getByRole("button", { name: "還沒有。幫安安做對一盤" });
    expect((friend.querySelector("[data-kind]") as HTMLElement).style.getPropertyValue("--sil")).toBe(
      'url("/characters/安安救護車.jpg")',
    );
    const got = screen.getByRole("button", { name: "玉子" });
    expect((got.querySelector("[data-kind]") as HTMLElement).style.getPropertyValue("--sil")).toBe("");
  });

  it("區塊標題標出有幾張新的；看過就不標", () => {
    const { rerender } = render(
      <DinoSushiStickerBook
        unlocked={["topping-tamago", "topping-corn", "customer-xiaohong"]}
        seen={["topping-corn"]}
        reducedMotion
        onClose={vi.fn()}
        onSpeak={vi.fn()}
      />,
    );
    expect(screen.getByRole("region", { name: "吃過的料" }).querySelector("h3")?.textContent).toBe("吃過的料新 1");
    expect(screen.getByRole("region", { name: "來過的朋友" }).querySelector("h3")?.textContent).toBe("來過的朋友新 1");
    expect(screen.getByRole("region", { name: "送出的飯" }).querySelector("h3")?.textContent).toBe("送出的飯");
    rerender(
      <DinoSushiStickerBook
        unlocked={["topping-tamago", "topping-corn", "customer-xiaohong"]}
        seen={["topping-tamago", "topping-corn", "customer-xiaohong"]}
        reducedMotion
        onClose={vi.fn()}
        onSpeak={vi.fn()}
      />,
    );
    expect(screen.getByRole("region", { name: "吃過的料" }).querySelector("h3")?.textContent).toBe("吃過的料");
  });

  it("開書時新貼紙閃一次（最多 6 張）；減少動態不閃", () => {
    const many = ["topping-tamago", "topping-corn", "topping-crab", "topping-shrimp", "base-nigiri", "base-gunkan", "base-temaki"];
    const { unmount } = render(
      <DinoSushiStickerBook unlocked={many} seen={[]} reducedMotion={false} onClose={vi.fn()} onSpeak={vi.fn()} />,
    );
    const flashing = screen.getAllByRole("button").filter((b) => b.getAttribute("data-flash") === "true");
    expect(flashing).toHaveLength(6);
    expect(flashing[1]!.style.getPropertyValue("--flash-i")).toBe("1");
    unmount();
    render(<DinoSushiStickerBook unlocked={many} seen={[]} reducedMotion onClose={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.getAllByRole("button").filter((b) => b.getAttribute("data-flash") === "true")).toHaveLength(0);
  });
});
