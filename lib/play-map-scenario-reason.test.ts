import { describe, expect, it } from "vitest";
import { getPlayground } from "@/data/playgrounds";
import { scenarioReason } from "./play-map-scenario-reason";

function place(id: string) {
  const found = getPlayground(id);
  if (!found) throw new Error(`測試資料不存在：${id}`);
  return found;
}

describe("scenarioReason", () => {
  it("雨天只引用 indoor 欄位與「雨天備案」tag 原詞", () => {
    expect(scenarioReason(place("nto-xiangshan"), "rainy")).toBe("雨天：室內、雨天備案");
    // 蕭壠是戶外園區，只有 tag，不能被說成室內。
    expect(scenarioReason(place("tn-soulangh"), "rainy")).toBe("雨天：雨天備案");
  });

  it("雨天理由不出現推論字眼", () => {
    for (const id of ["nto-xiangshan", "tn-soulangh", "tp-ntsec"]) {
      expect(scenarioReason(place(id), "rainy")).not.toMatch(/整個|全室內|保證/);
    }
  });

  it("放電引用命中的設施與 tag，最多三個，不重複「放電」本身", () => {
    const reason = scenarioReason(place("hcx-hukou-sports"), "energy");
    expect(reason).toBe("放電：運動");
  });

  it("看展覽引用展覽類設施原詞；沒有就不顯示", () => {
    expect(scenarioReason(place("tp-ntsec"), "exhibit")).toBe("看展：互動展、3D 劇院");
    expect(scenarioReason(place("tn-chimei-museum"), "exhibit")).toBe("看展：常設展");
    expect(scenarioReason(place("hcx-hukou-sports"), "exhibit")).toBeNull();
  });

  it("免費只在有收費例外時補一句", () => {
    expect(scenarioReason(place("hcx-hukou-sports"), "free")).toBeNull();
    expect(scenarioReason(place("kh-children-art-museum"), "free")).toBe("部分項目另收費");
  });

  it("沒有命中時回傳 null，不硬湊", () => {
    expect(
      scenarioReason({ indoor: false, tags: [], facilities: ["停車場"], free: false }, "rainy"),
    ).toBeNull();
    expect(
      scenarioReason({ indoor: false, tags: [], facilities: ["停車場"], free: false }, "energy"),
    ).toBeNull();
  });
});
