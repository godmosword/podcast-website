import { describe, expect, it } from "vitest";
import { cleanSegments, refilterSegments } from "./transcribe-core";

const cue = (text: string, t = 0) => ({ t, text });
const texts = (cues: readonly { text: string }[]) => cues.map((c) => c.text);

describe("簡轉繁的「只」與「隻」", () => {
  it("OpenCC 字典把「是只」「有只」當量詞：副詞要留「只」", () => {
    const out = cleanSegments([
      cue("它里面就是只有平板而已"),
      cue("但是只要洗手就好"),
      cue("还是只能等一下"),
      cue("还有只有他知道"),
      cue("总是只想玩"),
    ]);
    expect(texts(out)).toEqual([
      "它裡面就是只有平板而已",
      "但是只要洗手就好",
      "還是只能等一下",
      "還有只有他知道",
      "總是只想玩",
    ]);
  });

  it("真的量詞不動", () => {
    const out = cleanSegments([
      cue("一只小猫"),
      cue("他是只小猫"),
      cue("一只有翅膀的鸟"),
      cue("那只要去哪"),
      cue("有只小狗"),
      cue("两只"),
    ]);
    expect(texts(out)).toEqual([
      "一隻小貓",
      "他是隻小貓",
      "一隻有翅膀的鳥",
      "那隻要去哪",
      "有隻小狗",
      "兩隻",
    ]);
  });
});

describe("refilterSegments：同步再處理只過濾，不再簡轉繁", () => {
  it("人工改過的字不會被蓋掉（#296 就是這樣變成「隻有」）", () => {
    const input = [cue("它裡面就是只有平板而已"), cue("我們來了解一下", 2), cue("台灣", 4)];
    expect(refilterSegments(input)).toEqual(input);
  });

  it("幻覺句照樣濾掉、主持人名照樣修、連續重複照樣合併", () => {
    const out = refilterSegments([
      cue("請不吝點讚 訂閱 轉發"),
      cue("嗨 我是蹦蹦", 1),
      cue("嗨 我是蹦蹦", 2),
      cue("  ", 3),
      cue("好啊", 4),
    ]);
    expect(texts(out)).toEqual(["嗨 我是 Bonbon", "好啊"]);
  });

  it("再跑一次結果一樣", () => {
    const once = refilterSegments([cue("嗨 我是蹦蹦"), cue("好啊", 1)]);
    expect(refilterSegments(once)).toEqual(once);
  });
});
