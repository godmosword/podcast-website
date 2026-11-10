import { describe, expect, it } from "vitest";
import { addTopping, changeBase, EMPTY_SUSHI, type Sushi } from "./sushi";
import { buildTray } from "./orders";
import { favoriteFor, reactionFor, servingLine, shortCaption } from "./reactions";
import type { Order } from "./orders";

function make(base: NonNullable<Sushi["base"]>, toppings: Sushi["toppings"]): Sushi {
  return toppings.reduce((s, t) => addTopping(s, t), changeBase(EMPTY_SUSHI, base));
}

describe("多多的字卡", () => {
  it("一到三種料的說法", () => {
    expect(servingLine(make("nigiri", ["tamago"]))).toBe("玉子，好好吃！");
    expect(servingLine(make("nigiri", ["tamago", "shrimp"]))).toBe("玉子加蝦，好好吃！");
    expect(servingLine(make("nigiri", ["tamago", "shrimp", "salmon"]))).toBe(
      "玉子、蝦加鮭魚，好好吃！",
    );
    expect(servingLine(make("nigiri", ["tamago", "tamago"]))).toBe("玉子，好好吃！");
    expect(servingLine(make("gunkan", []))).toBe("白飯香香的！");
  });
});

describe("點餐反應", () => {
  const order: Order = { base: "nigiri", toppings: ["tamago", "shrimp"], customerId: "xiaohong" };

  it("缺料時不吃，字卡說出還缺什麼", () => {
    const r = reactionFor(make("nigiri", ["tamago"]), { order, firstTry: true });
    expect(r).toMatchObject({ mood: "look", eats: false, line: "還想要蝦！" });
  });

  it("飯型不對時先說飯型", () => {
    const r = reactionFor(make("temaki", ["tamago"]), { order, firstTry: true });
    expect(r.line).toBe("想要握壽司，還有蝦！");
    expect(reactionFor(make("temaki", ["tamago", "shrimp"]), { order, firstTry: true }).line).toBe(
      "想要握壽司！",
    );
  });

  it("一次做對是最高級；補過才對是普通好吃", () => {
    expect(reactionFor(make("nigiri", ["shrimp", "tamago"]), { order, firstTry: true })).toMatchObject({
      mood: "love",
      eats: true,
      line: "蝦加玉子，好好吃！",
    });
    expect(reactionFor(make("nigiri", ["shrimp", "tamago"]), { order, firstTry: false }).mood).toBe(
      "yum",
    );
  });

  it("芥末：排氣管噗一朵白雲，多多自己笑", () => {
    const r = reactionFor(make("nigiri", ["tamago", "shrimp", "wasabi"]), { order, firstTry: true });
    expect(r).toMatchObject({ mood: "puff", eats: true, line: "噗～辣辣的，哈哈！" });
  });
});

describe("自由做反應", () => {
  it("最愛只挑這一輪托盤上的家常料，吃到最愛是最高級", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const tray = buildTray(seed);
      const fav = favoriteFor(seed, tray);
      expect(tray).toContain(fav);
      expect(["strawberry", "pudding", "wasabi"]).not.toContain(fav);
      const r = reactionFor(make("gunkan", [fav]), { favorite: fav });
      expect(r.mood).toBe("love");
      expect(r.eats).toBe(true);
    }
  });

  it("沒有最愛時是普通好吃；只有白飯也會吃", () => {
    expect(reactionFor(make("gunkan", ["corn"]), { favorite: "salmon" }).mood).toBe("yum");
    expect(reactionFor(make("gunkan", []), { favorite: "salmon" })).toMatchObject({
      mood: "yum",
      eats: true,
      line: "白飯香香的！",
    });
  });

  it("每種反應有自己的音型", () => {
    const sfx = new Set(
      [
        reactionFor(make("gunkan", ["corn"]), { favorite: "salmon" }),
        reactionFor(make("gunkan", ["salmon"]), { favorite: "salmon" }),
        reactionFor(make("gunkan", ["wasabi"]), { favorite: "salmon" }),
        reactionFor(make("gunkan", []), { order: { base: "nigiri", toppings: ["corn"], customerId: "ale" }, firstTry: true }),
      ].map((r) => r.sfx),
    );
    expect(sfx.size).toBe(4);
  });
});

describe("shortCaption：矮舞台的短字卡", () => {
  const reaction = (mood: Parameters<typeof shortCaption>[0]["mood"], line: string) => ({
    mood,
    line,
    sfx: mood,
    eats: mood !== "look",
    brush: false,
  });

  it("吃下去的句子只留最後一段", () => {
    expect(shortCaption(reaction("love", "小黃瓜、鮪魚沙拉加蝦，好好吃！"))).toBe("好好吃！");
    expect(shortCaption(reaction("puff", "噗～辣辣的，哈哈！"))).toBe("哈哈！");
  });

  it("本來就短的句子不變", () => {
    expect(shortCaption(reaction("sweet", "甜甜的！"))).toBe("甜甜的！");
    expect(shortCaption(reaction("yum", "白飯香香的！"))).toBe("白飯香香的！");
    expect(shortCaption(reaction("love", "最愛蝦了！"))).toBe("最愛蝦了！");
  });

  it("缺料句不裁：孩子要看缺什麼", () => {
    expect(shortCaption(reaction("look", "想要軍艦，還有蝦！"))).toBe("想要軍艦，還有蝦！");
  });
});
