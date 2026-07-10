/**
 * 各集家長共讀指引（sidecar，以 slug 為 key）。
 * 較完整的睡前共讀說明；短鉤子仍由 family-activities.ts 負責。
 * 契約：docs/GEO-CONTENT-CONTRACT.md
 */
import type { ParentGuide } from "@/lib/geo-content-contract";

const PARENT_GUIDES: Record<string, ParentGuide> = {
  "ep-1": {
    summary:
      "這一集用慢慢充電、不跟別人比速度的說法，陪孩子聊耐心等待，也能延伸到 CARL 與嘟嘟之間的好友情境。",
    prompts: [
      "聽完可以問孩子：你覺得嘟嘟什麼時候最需要等一下？",
      "若孩子願意，一起畫一台會自己找充電站的車車，並說說它要去哪裡。",
    ],
  },
  "ep-5": {
    summary:
      "東東挖土機示範一步一步完成任務，適合聊「慢慢來」與工程車如何幫大家整理環境。",
    prompts: [
      "可以問孩子：故事裡誰最會慢慢把一件事做完？",
      "散步時找一台工程車或挖土機玩具，數數它有幾個輪子或鏟斗動了幾次。",
    ],
  },
};

export function getParentGuide(slug: string): ParentGuide | undefined {
  return PARENT_GUIDES[slug];
}

export function listParentGuideSlugs(): string[] {
  return Object.keys(PARENT_GUIDES);
}
