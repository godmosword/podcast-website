export type ColoringCompletionActivity = {
  /** 已完成的創作操作（蠟筆或油漆桶），不是畫布百分比。 */
  operations: number;
  /** 本次創作實際用過的非橡皮擦顏色數。 */
  colors: number;
};

export type ColoringCompletionTone = "start" | "growing" | "rich";

export function coloringCompletionTone(
  activity: ColoringCompletionActivity,
): ColoringCompletionTone {
  if (activity.operations <= 0) return "start";
  if (activity.operations >= 5 || activity.colors >= 3) return "rich";
  return "growing";
}

export function coloringCompletionCopy(
  activity: ColoringCompletionActivity,
): { tone: ColoringCompletionTone; label: string; detail: string } {
  const tone = coloringCompletionTone(activity);
  switch (tone) {
    case "start":
      return {
        tone,
        label: "準備開始創作",
        detail: "喜歡現在的樣子時，隨時都可以完成作品。",
      };
    case "growing":
      return {
        tone,
        label: "作品越來越精彩了！",
        detail: "繼續調色，或在你喜歡的時候完成作品。",
      };
    case "rich":
      return {
        tone,
        label: "看起來快完成囉！",
        detail: "如果你喜歡現在的樣子，也可以完成作品囉！",
      };
  }
}
