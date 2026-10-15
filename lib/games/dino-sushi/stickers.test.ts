import { describe, expect, it } from "vitest";
import { BASES, TOPPINGS, type BaseId, type ToppingId } from "./toppings";
import {
  DINO_SUSHI_STICKER_TOTAL,
  DINO_SUSHI_STICKERS,
  STICKER_ROUND_PROMISE,
  applyRoundStickers,
  collectStickers,
  factsFromRound,
  isDinoSushiStickerId,
  rememberPlaced,
  stickerAnnouncement,
  stickerById,
  stickerTapSpeech,
  type ApplyState,
  type PlateFact,
  type RoundFactSource,
} from "./stickers";

function plate(base: BaseId, mood: PlateFact["mood"], toppings: ToppingId[] = []): PlateFact {
  return { sushi: { base, toppings }, mood };
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
  it("正好 24 張：12 料、3 飯、5 表情、4 驚喜，沒有客人", () => {
    expect(DINO_SUSHI_STICKERS).toHaveLength(DINO_SUSHI_STICKER_TOTAL);
    expect(DINO_SUSHI_STICKERS.filter((s) => s.group === "food")).toHaveLength(12);
    expect(DINO_SUSHI_STICKERS.filter((s) => s.group === "base")).toHaveLength(3);
    expect(DINO_SUSHI_STICKERS.filter((s) => s.group === "mood")).toHaveLength(5);
    expect(DINO_SUSHI_STICKERS.filter((s) => s.group === "surprise")).toHaveLength(4);
    expect(DINO_SUSHI_STICKERS.some((s) => s.id.startsWith("customer-"))).toBe(false);
    expect(new Set(DINO_SUSHI_STICKERS.map((s) => s.id)).size).toBe(24);
  });

  it("每種現有的料、每種飯都有一張，規則寫的是放上去或送出去", () => {
    for (const topping of TOPPINGS) {
      const sticker = stickerById(`topping-${topping.id}`);
      expect(sticker?.name).toBe(topping.label);
      expect(sticker?.rule).toBe(`把${topping.label}放上壽司`);
    }
    for (const base of BASES) {
      expect(stickerById(`base-${base.id}`)?.rule).toBe(`做好${base.label}，給多多吃`);
    }
    expect(stickerById("surprise-perfect")?.rule).toBe("連續 5 盤都一次做對");
    expect(stickerById("surprise-round")?.rule).toBe("點餐，送完 5 盤");
    expect(STICKER_ROUND_PROMISE).toContain("至少會拿到一張");
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

  it("好吃、甜甜、噴火、刷牙各一張", () => {
    const earned = collectStickers(
      [],
      factsFromRound(
        round({
          brushUsed: true,
          plates: [
            plate("nigiri", "yum"),
            plate("nigiri", "sweet", ["strawberry"]),
            plate("temaki", "puff", ["wasabi"]),
          ],
        }),
      ),
    );
    expect(earned.unlocked).toEqual([
      "topping-strawberry",
      "topping-wasabi",
      "base-nigiri",
      "base-temaki",
      "mood-yum",
      "mood-sweet",
      "mood-puff",
      "mood-brush",
    ]);
  });

  it("點餐送完一輪、連續 5 盤一次做對、自由做吃飽、每天第一次來", () => {
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

  it("收滿就不再送，也不會給不認識的 id", () => {
    const owned = DINO_SUSHI_STICKERS.map((s) => s.id);
    const full = collectStickers(owned, factsFromRound(round({ mode: "order", done: true })), {
      finishedRound: true,
    });
    expect(full).toEqual({ unlocked: [], gifted: null });
    expect(isDinoSushiStickerId("customer-xiaohong")).toBe(false);
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
    expect(stickerTapSpeech("mood-brush", false)).toBe("還沒有。幫多多刷牙");
  });
});
