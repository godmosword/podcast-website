import { describe, expect, it } from "vitest";
import { CUSTOMERS, type CustomerId } from "./customers";
import { BASES, TOPPINGS, type BaseId, type ToppingId } from "./toppings";
import {
  bookStickers,
  isStickerBookComplete,
  DINO_SUSHI_STICKER_TOTAL,
  DINO_SUSHI_STICKERS,
  STICKER_ROUND_PROMISE,
  RETIRED_STICKER_IDS,
  applyRoundStickers,
  collectStickers,
  factsFromRound,
  isDinoSushiStickerId,
  rememberPlaced,
  roundEndAnnouncement,
  stickerAnnouncement,
  stickerById,
  stickerTapSpeech,
  type ApplyState,
  type PlateFact,
  type RoundFactSource,
} from "./stickers";

function plate(
  base: BaseId,
  mood: PlateFact["mood"],
  toppings: ToppingId[] = [],
  customerId?: CustomerId,
): PlateFact {
  return { sushi: { base, toppings }, mood, ...(customerId ? { customerId } : {}) };
}

function round(partial: Partial<RoundFactSource> = {}): RoundFactSource {
  return {
    mode: "order",
    done: false,
    brushUsed: false,
    sushi: { toppings: [] },
    plates: [],
    firstTries: [],
    ...partial,
  };
}

describe("多多壽司屋貼紙目錄", () => {
  it("現役 29 張（料 13、飯 3、表情 3、驚喜 4、朋友 6）；草莓、布丁、甜甜、刷牙 4 張退役但 id 還在", () => {
    expect(DINO_SUSHI_STICKER_TOTAL).toBe(29);
    expect(DINO_SUSHI_STICKERS).toHaveLength(33);
    expect([...RETIRED_STICKER_IDS].sort()).toEqual(["mood-brush", "mood-sweet", "topping-pudding", "topping-strawberry"]);
    const active = DINO_SUSHI_STICKERS.filter((s) => !RETIRED_STICKER_IDS.has(s.id));
    expect(active).toHaveLength(29);
    expect(active.filter((s) => s.group === "food").map((s) => s.id)).toEqual(TOPPINGS.map((t) => `topping-${t.id}`));
    expect(active.filter((s) => s.group === "base")).toHaveLength(3);
    expect(active.filter((s) => s.group === "mood").map((s) => s.id)).toEqual(["mood-love", "mood-yum", "mood-puff"]);
    expect(active.filter((s) => s.group === "surprise")).toHaveLength(4);
    expect(active.filter((s) => s.group === "customer").map((s) => s.id)).toEqual(CUSTOMERS.map((c) => `customer-${c.id}`));
    expect(new Set(DINO_SUSHI_STICKERS.map((s) => s.id)).size).toBe(33);
    for (const id of RETIRED_STICKER_IDS) {
      expect(isDinoSushiStickerId(id), id).toBe(true);
      expect(stickerById(id)?.rule, id).toBe("這家店現在不賣甜點");
    }
    expect(stickerById("topping-ikura")).toMatchObject({ name: "鮭魚卵", rule: "把鮭魚卵放上壽司" });
    expect(stickerById("surprise-daily")).toMatchObject({
      name: "第一次來",
      rule: "第一次來玩",
    });
    expect(stickerById("customer-xiaohong")).toMatchObject({
      name: "小紅",
      group: "customer",
      rule: "幫小紅做對一盤",
      art: { kind: "customer", id: "xiaohong" },
    });
  });

  it("每種現有的料、每種飯都有一張，規則寫的是放上去或送出去", () => {
    for (const topping of TOPPINGS) {
      const sticker = stickerById(`topping-${topping.id}`);
      expect(sticker?.name).toBe(topping.label);
      expect(sticker?.rule).toBe(`把${topping.label}放上壽司`);
    }
    for (const base of BASES) {
      expect(stickerById(`base-${base.id}`)?.rule).toBe(`做好${base.label}，送出去`);
    }
    expect(stickerById("surprise-perfect")?.rule).toBe("連續 5 盤都一次做對");
    expect(stickerById("surprise-round")?.rule).toBe("點餐，送完 5 盤");
    expect(STICKER_ROUND_PROMISE).toContain("送完為止");
    expect(STICKER_ROUND_PROMISE).toContain("「驚喜」要自己做到");
  });
});

describe("貼紙解鎖", () => {
  it("第一次把料放上壽司就拿到；已經有的不會再給", () => {
    const first = collectStickers([], factsFromRound(round({ sushi: { toppings: ["salmon", "tamago"] } })));
    expect(first.unlocked).toEqual(["topping-tamago", "topping-salmon"]);
    expect(first.gifted).toBeNull();
    const again = collectStickers(first.unlocked, factsFromRound(round({ sushi: { toppings: ["salmon"] } })));
    expect(again.unlocked).toEqual([]);
  });

  it("被擠掉的料只要放過，還是算拿到", () => {
    const memory = rememberPlaced([], round({ sushi: { toppings: ["tamago"] } }));
    const afterEvict = round({ sushi: { toppings: ["shrimp"] } });
    expect(rememberPlaced(memory, afterEvict)).toEqual(["tamago", "shrimp"]);
    const earned = collectStickers([], factsFromRound(afterEvict, memory));
    expect(earned.unlocked).toEqual(["topping-tamago", "topping-shrimp"]);
  });

  it("只選飯不算；多多真的吃了才拿到那種飯和表情", () => {
    const choosing = collectStickers([], factsFromRound(round()));
    expect(choosing.unlocked).toEqual([]);
    const looked = collectStickers(
      [],
      factsFromRound(round({ plates: [plate("nigiri", "look", ["shrimp"])] })),
    );
    expect(looked.unlocked).toEqual(["topping-shrimp"]);
    const eaten = collectStickers(
      [],
      factsFromRound(round({ plates: [plate("gunkan", "love", ["corn"])] })),
    );
    expect(eaten.unlocked).toEqual(["topping-corn", "base-gunkan", "mood-love"]);
  });

  it("好吃、噴火各一張；甜甜、刷牙已退役，就算條件成立也不再發", () => {
    const earned = collectStickers(
      [],
      factsFromRound(
        round({
          brushUsed: true,
          plates: [plate("nigiri", "yum"), plate("nigiri", "sweet", ["shrimp"]), plate("temaki", "puff", ["wasabi"])],
        }),
      ),
    );
    expect(earned.unlocked).toEqual(["topping-shrimp", "topping-wasabi", "base-nigiri", "base-temaki", "mood-yum", "mood-puff"]);
  });

  it("點餐送完一輪、連續 5 盤一次做對、自由做吃飽、第一次來", () => {
    const perfect = collectStickers(
      [],
      factsFromRound(
        round({
          mode: "order",
          done: true,
          firstTries: [true, true, true, true, true],
        }),
      ),
    );
    expect(perfect.unlocked).toEqual(["surprise-round", "surprise-perfect"]);
    const free = collectStickers([], factsFromRound(round({ mode: "free", done: true })));
    expect(free.unlocked).toEqual(["surprise-free"]);
    const visit = collectStickers([], factsFromRound(round(), [], true));
    expect(visit.unlocked).toEqual(["surprise-daily"]);
  });

  it("一輪結束一張都沒有時，依目錄送出下一張；這一輪已經有了就不再送", () => {
    const gift = collectStickers(
      ["surprise-free"],
      factsFromRound(round({ mode: "free", done: true })),
      { finishedRound: true },
    );
    expect(gift).toEqual({ unlocked: ["topping-tamago"], gifted: "topping-tamago" });
    const next = collectStickers(
      ["surprise-round", "topping-tamago"],
      factsFromRound(round({ mode: "order", done: true, firstTries: [true, false, false, false, false] })),
      { finishedRound: true },
    );
    expect(next.gifted).toBe("topping-shrimp");
    const already = collectStickers([], factsFromRound(round({ mode: "free", done: true })), {
      finishedRound: true,
      earnedThisRound: ["topping-tamago"],
    });
    expect(already.gifted).toBeNull();
    expect(already.unlocked).toEqual(["surprise-free"]);
    const playing = collectStickers(["surprise-free"], factsFromRound(round({ mode: "free", done: false })), {
      finishedRound: false,
    });
    expect(playing.unlocked).toEqual([]);
  });

  it("原本 24 張都有了、這一輪沒新的，保底才從客人開始送", () => {
    const owned = DINO_SUSHI_STICKERS.filter((sticker) => sticker.group !== "customer").map((sticker) => sticker.id);
    const gift = collectStickers(owned, factsFromRound(round({ mode: "free", done: true })), {
      finishedRound: true,
    });
    expect(gift).toEqual({ unlocked: ["customer-xiaohong"], gifted: "customer-xiaohong" });
    const next = collectStickers(
      [...owned, "customer-xiaohong"],
      factsFromRound(round({ mode: "free", done: true })),
      { finishedRound: true },
    );
    expect(next.gifted).toBe("customer-anan");
  });

  it("暫時拿不到的甜點、刷牙貼紙不當保底送（2026-11-08 托盤拿掉甜點）", () => {
    const unavailable = ["topping-strawberry", "topping-pudding", "mood-sweet", "mood-brush"];
    // 前面的食材都有了，下一張照目錄本來是草莓：要跳過，往後送
    // 自由做做完本身會拿到「自由做」成就；先擁有它，這一輪才是「沒新的、要保底」
    const owned = [
      "surprise-free",
      ...DINO_SUSHI_STICKERS.filter((sticker) => sticker.group === "food" && !unavailable.includes(sticker.id)).map(
        (sticker) => sticker.id,
      ),
    ];
    const gift = collectStickers(owned, factsFromRound(round({ mode: "free", done: true })), { finishedRound: true });
    expect(gift.gifted).not.toBeNull();
    expect(unavailable).not.toContain(gift.gifted);
    // 只差這 4 張與成就：什麼都不送
    const allButUnavailable = DINO_SUSHI_STICKERS.map((sticker) => sticker.id).filter(
      (id) => !unavailable.includes(id) && !id.startsWith("surprise-"),
    );
    const none = collectStickers(allButUnavailable, factsFromRound(round({ mode: "free", done: false })), {
      finishedRound: true,
    });
    expect(none.gifted).toBeNull();
  });

  it("一輪結束念的句子：貼紙接新開的天，沒貼紙也念", () => {
    expect(roundEndAnnouncement(["topping-tamago"], null, "第 2 天開了！")).toBe("新貼紙！玉子！第 2 天開了！");
    expect(roundEndAnnouncement([], null, "第 2 天開了！")).toBe("第 2 天開了！");
    expect(roundEndAnnouncement([], null, "")).toBe("");
  });

  it("成就貼紙不當保底送：只差這幾張時，沒達成就什麼都不送", () => {
    const achievements = ["surprise-round", "surprise-perfect", "surprise-free", "surprise-daily"];
    const owned = DINO_SUSHI_STICKERS.map((sticker) => sticker.id).filter((id) => id !== "surprise-perfect");
    const none = collectStickers(
      owned,
      factsFromRound(round({ mode: "order", done: true, firstTries: [true, false, false, false, false] })),
      { finishedRound: true },
    );
    expect(none).toEqual({ unlocked: [], gifted: null });
    const notOwned = DINO_SUSHI_STICKERS.map((sticker) => sticker.id).filter((id) => !achievements.includes(id));
    const stillNone = collectStickers(notOwned, factsFromRound(round({ mode: "free", done: false })), {
      finishedRound: true,
    });
    expect(stillNone.gifted).toBeNull();
    for (const id of achievements) expect(stillNone.unlocked).not.toContain(id);
  });

  it("客人的訂單做對才拿到；看一看、自由做、做第二次都不算", () => {
    const served = collectStickers(
      [],
      factsFromRound(round({ plates: [plate("nigiri", "yum", ["shrimp"], "xiaohong")] })),
    );
    expect(served.unlocked).toContain("customer-xiaohong");
    expect(served.gifted).toBeNull();
    const looked = collectStickers(
      [],
      factsFromRound(round({ plates: [plate("nigiri", "look", ["shrimp"], "xiaohong")] })),
    );
    expect(looked.unlocked).not.toContain("customer-xiaohong");
    const free = collectStickers(
      [],
      factsFromRound(round({ mode: "free", plates: [plate("nigiri", "yum", ["shrimp"])] })),
    );
    expect(free.unlocked).not.toContain("customer-xiaohong");
    const again = collectStickers(
      ["customer-xiaohong"],
      factsFromRound(round({ plates: [plate("nigiri", "love", ["shrimp"], "xiaohong")] })),
    );
    expect(again.unlocked).not.toContain("customer-xiaohong");
  });

  it("收滿就不再送，也不會給不認識的 id", () => {
    const owned = DINO_SUSHI_STICKERS.map((s) => s.id);
    const full = collectStickers(owned, factsFromRound(round({ mode: "order", done: true })), {
      finishedRound: true,
    });
    expect(full).toEqual({ unlocked: [], gifted: null });
    expect(isDinoSushiStickerId("customer-xiaohong")).toBe(true);
    expect(isDinoSushiStickerId("customer-nobody")).toBe(false);
  });
});

describe("同一輪重複結算", () => {
  it("保底只送一次；下一輪才可以再拿", () => {
    const play = "play-1";
    const done = round({ mode: "free", done: true });
    const first = applyRoundStickers(["surprise-free"], null, play, done, "");
    expect(first.added).toEqual(["topping-tamago"]);
    expect(first.state.gifted).toBe("topping-tamago");
    expect(first.state.settled).toBe(true);
    const owned = ["surprise-free", ...first.added];
    const second = applyRoundStickers(owned, first.state, play, done, play);
    expect(second.alreadySettled).toBe(true);
    expect(second.added).toEqual([]);
    const replay = applyRoundStickers(owned, null, "play-2", done, play);
    expect(replay.added).toEqual(["topping-shrimp"]);
    expect(replay.state.gifted).toBe("topping-shrimp");
  });

  it("中途放過的料，結算時還在這一輪的清單裡", () => {
    let state: ApplyState | null = null;
    let owned: string[] = [];
    const placed = applyRoundStickers(owned, state, "play-3", round({ sushi: { toppings: ["tuna"] } }), "");
    state = placed.state;
    owned = placed.added;
    const evicted = applyRoundStickers(
      owned,
      state,
      "play-3",
      round({ sushi: { toppings: [] }, mode: "free", done: true }),
      "",
    );
    expect(evicted.state.earned).toContain("topping-tuna");
    expect(evicted.added).toContain("surprise-free");
    expect(evicted.state.gifted).toBeNull();
  });
});

describe("貼紙怎麼念", () => {
  it("一張、保底、很多張", () => {
    expect(stickerAnnouncement(["topping-tamago"], null)).toBe("新貼紙！玉子！");
    expect(stickerAnnouncement(["topping-shrimp"], "topping-shrimp")).toBe("多多送你貼紙！蝦！");
    expect(stickerAnnouncement(["topping-tamago", "base-nigiri"], null)).toBe("新貼紙！玉子、握壽司！");
    expect(
      stickerAnnouncement(["topping-tamago", "topping-shrimp", "topping-crab", "mood-yum"], null),
    ).toBe("新貼紙！玉子、蝦、蟹肉棒，還有更多！");
    expect(stickerTapSpeech("mood-brush", true)).toBe("刷牙");
    expect(stickerTapSpeech("mood-brush", false)).toBe("還沒有。這家店現在不賣甜點");
  });
});

describe("下架的甜點貼紙（2026-11-08）", () => {
  const available = DINO_SUSHI_STICKERS.filter((s) => !RETIRED_STICKER_IDS.has(s.id)).map((s) => s.id);

  it("沒拿過的不放進貼紙書，總數只算拿得到的", () => {
    const book = bookStickers([]);
    expect(book.map((s) => s.id)).toEqual(available);
    expect(book.some((s) => RETIRED_STICKER_IDS.has(s.id))).toBe(false);
  });

  it("舊存檔已經拿到的照留在原本的位置", () => {
    const book = bookStickers(["topping-strawberry", "topping-tamago"]).map((s) => s.id);
    expect(book).toContain("topping-strawberry");
    expect(book).not.toContain("topping-pudding");
    expect(book.length).toBe(available.length + 1);
    const order = DINO_SUSHI_STICKERS.map((s) => s.id);
    expect([...book].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(book);
  });

  it("拿得到的都收齊就算全收集，不用等永遠拿不到的", () => {
    expect(isStickerBookComplete(available)).toBe(true);
    expect(isStickerBookComplete(available.slice(1))).toBe(false);
    expect(isStickerBookComplete(DINO_SUSHI_STICKERS.map((s) => s.id))).toBe(true);
  });
});
