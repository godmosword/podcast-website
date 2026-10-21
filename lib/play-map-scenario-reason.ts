/**
 * 名單卡片的「為什麼適合這個情境」。
 *
 * **只引用資料裡命中的原詞**（indoor 欄位、tag、facility），不寫推論或保證：
 * 不說「整個場館在室內」（日月潭向山遊客中心是館內躲雨、戶外看湖），
 * 不說「玩科學」（博物館包含美術館、文化園區）。沒有命中就回傳 null，不硬湊。
 */
import type { Playground } from "@/data/playgrounds";
import { HIGH_ENERGY_FACILITIES, HIGH_ENERGY_TAGS } from "@/lib/playground-context";
import type { PlayMapScenarioId } from "@/lib/play-map-scenarios";

type ReasonFields = Pick<Playground, "indoor" | "tags" | "facilities" | "free" | "feeNote">;

const MAX_TERMS = 3;

/**
 * 「看展覽」可以引用的展覽類設施。資料用詞很分散（常設展、互動展、天文展示館、
 * 陶藝體驗、球幕劇場、定時導覽…），所以用字根判斷，引用的仍是原詞。
 */
const EXHIBIT_FACILITY_PATTERN = /展|體驗|劇[院場]|導覽|館$|IMAX|星象/;

function unique(terms: readonly string[]): string[] {
  return [...new Set(terms)];
}

function joinTerms(prefix: string, terms: readonly string[]): string | null {
  const picked = unique(terms).slice(0, MAX_TERMS);
  return picked.length > 0 ? `${prefix}：${picked.join("、")}` : null;
}

export function scenarioReason(place: ReasonFields, scenario: PlayMapScenarioId): string | null {
  switch (scenario) {
    case "rainy":
      return joinTerms("雨天", [
        ...(place.indoor ? ["室內"] : []),
        ...(place.tags.includes("雨天備案") ? ["雨天備案"] : []),
      ]);
    case "energy":
      return joinTerms("放電", [
        ...place.facilities.filter((item) => HIGH_ENERGY_FACILITIES.has(item)),
        ...place.tags.filter((item) => HIGH_ENERGY_TAGS.has(item) && item !== "放電"),
      ]);
    case "exhibit":
      return joinTerms(
        "看展",
        place.facilities.filter((item) => EXHIBIT_FACILITY_PATTERN.test(item)),
      );
    case "free":
      // 結果列已經寫「免費」，這裡只補例外。
      return place.free && place.feeNote ? "部分項目另收費" : null;
  }
}
