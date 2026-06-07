/**
 * 車車角色設定：每個車種一個角色，給「角色圖鑑」頁用。
 * 名字取自各集標題的角色（安安救護車、東東挖土機…），個性為草稿文案，可再潤。
 * 沒有設定的新車種（如未來同步上架）由頁面回退為車種名 + 通用台詞。
 */

export type Character = {
  vehicle: string;
  name: string;
  /** 第一人稱自我介紹，給孩子建立角色情感（草稿，待 Bonbon & 馬米 潤）。 */
  personality: string;
};

export const characters: Character[] = [
  {
    vehicle: "救護車",
    name: "安安",
    personality: "嗚咿嗚咿～我是安安救護車！有人需要幫忙嗎？我最勇敢了！",
  },
  {
    vehicle: "挖土機",
    name: "東東",
    personality: "轟隆轟隆！我是東東挖土機，再難挖的任務我都不放棄！",
  },
  {
    vehicle: "清潔車",
    name: "鈴鈴",
    personality: "叮鈴叮鈴～我是鈴鈴清潔車，答應的事我一定做到！",
  },
  {
    vehicle: "賽車",
    name: "小紅",
    personality: "咻──！我是小紅賽車，跑第一很棒，跑最後也沒關係喔！",
  },
  {
    vehicle: "無人機",
    name: "小飛",
    personality: "嗡嗡嗡～我是小飛無人機，飛到高高的天空幫大家看清楚！",
  },
  {
    vehicle: "電動車",
    name: "阿電",
    personality: "滋滋～我是阿電電動車，安安靜靜帶你開去未來！",
  },
];

const byVehicle = new Map(characters.map((c) => [c.vehicle, c]));

export function getCharacter(vehicle: string): Character | undefined {
  return byVehicle.get(vehicle);
}
