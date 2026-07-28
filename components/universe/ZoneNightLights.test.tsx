// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZONE_IDS } from "@/data/universe-zones";
import { ZONE_LIGHTS } from "@/data/universe-zone-lights";
import ZoneNightLights from "./ZoneNightLights";

afterEach(() => vi.restoreAllMocks());

const lightsIn = (c: HTMLElement) => c.querySelectorAll("span[style]").length;

describe("ZoneNightLights", () => {
  it("日間完全不渲染（日間訪客零成本）", () => {
    const { container } = render(
      <ZoneNightLights zoneId="car-park" night={false} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("夜間依資料渲染每顆燈", () => {
    const { container } = render(<ZoneNightLights zoneId="car-park" night />);
    expect(lightsIn(container)).toBe(ZONE_LIGHTS["car-park"].length);
  });

  it("每島都有燈可點，夜間沒有島是全黑的", () => {
    for (const id of ZONE_IDS) {
      const { container } = render(<ZoneNightLights zoneId={id} night />);
      expect(lightsIn(container)).toBeGreaterThan(0);
    }
  });

  /**
   * D4 逐島落地時的自動退場開關：夜圖已把燈烘進去，再疊 CSS 燈會過曝。
   * 這條壞掉代表翻 hasNightArt 後該島會有兩層燈。
   */
  it("該島已有夜間美術時完全退場，避免與烘進圖裡的燈疊加", async () => {
    const mod = await import("@/lib/universe/zone-art-tile");
    vi.spyOn(mod, "getZoneArtTile").mockReturnValue({
      src: "/adventures/zones/dino.png",
      mode: "island",
      anchor: "sand-bottom-center",
      stageSize: { w: 264, h: 260 },
      anchorUV: [0.5, 0.84],
      hasNightArt: true,
    });
    const { container } = render(<ZoneNightLights zoneId="dino" night />);
    expect(container.innerHTML).toBe("");
  });

  it("reduced-motion 時燈仍然亮著，只是不呼吸", () => {
    const { container } = render(
      <ZoneNightLights zoneId="dino" night reduced />,
    );
    expect(lightsIn(container)).toBe(ZONE_LIGHTS.dino.length);
    // 不掛呼吸 class ⇒ 無 animationDelay
    for (const el of container.querySelectorAll<HTMLElement>("span[style]")) {
      expect(el.style.animationDelay).toBe("");
    }
  });

  it("paused 時標記在層上，供 CSS 暫停動畫", () => {
    const { container } = render(
      <ZoneNightLights zoneId="dino" night paused />,
    );
    expect(container.querySelector("[data-paused]")).not.toBeNull();
  });
});

describe("ZONE_LIGHTS 資料契約", () => {
  it("UV 與尺寸都落在 tile 範圍內，燈不會飄到島外", () => {
    for (const id of ZONE_IDS) {
      for (const light of ZONE_LIGHTS[id]) {
        expect(light.u).toBeGreaterThan(0);
        expect(light.u).toBeLessThan(1);
        expect(light.v).toBeGreaterThan(0);
        expect(light.v).toBeLessThan(1);
        expect(light.size).toBeGreaterThan(0);
        expect(light.size).toBeLessThan(0.3);
      }
    }
  });

  it("同島各燈相位錯開，避免整島同步閃爍像故障", () => {
    for (const id of ZONE_IDS) {
      const delays = ZONE_LIGHTS[id].map((l) => l.delayMs);
      expect(new Set(delays).size).toBe(delays.length);
    }
  });

  it("克制：每島 ≤3 顆，這是「有人在家」不是聖誕燈", () => {
    for (const id of ZONE_IDS) {
      expect(ZONE_LIGHTS[id].length).toBeLessThanOrEqual(3);
    }
  });
});
