/**
 * 多多壽司屋重畫的圖（計畫 docs/plans/2026-11-08-dino-sushi-real-shop.md，PR-B）。
 * 第 1 輪：軍艦、手捲、鮪魚沙拉（已上線）。第 2 輪：鮭魚卵、鰻魚、干貝＋6 位朋友的「好吃」臉。
 */
import { join } from "node:path";
import { ROOT } from "./transcribe-core";

export const FOOD_DIR = join(ROOT, "public/games/v2/dino-sushi/food");
export const CUSTOMER_DRAFTS = join(ROOT, "scripts/assets/dino-sushi-customer-drafts");

export type ArtSpec = {
  slug: string;
  label: string;
  round: 1 | 2;
  /**
   * shipped：已核可上線；declined：使用者看過選了不要。這兩種生圖時一律跳過，
   * 要重生得用 --only 點名並加 --redo（付費，先在聊天列清單等確認）。
   */
  status: "pending" | "shipped" | "declined";
  /** food：透明底、去透明邊、轉 webp。face：白底照草稿格式，核可後交給 build-dino-sushi-customer-stickers 去背。 */
  kind: "food" | "face";
  size: "1024x1024" | "1024x1536" | "1536x1024";
  refs: readonly string[];
  prompt: string;
  /** 核可後寫到哪裡。 */
  target: string;
  /** 審稿時放在左邊對照的舊圖；新配料沒有舊圖就放參考圖。 */
  compare: string;
};

/** 跟現有食材一致的畫法：黏土、霧面、俯角約 30°、左上柔光、透明底。 */
const FOOD_STYLE = [
  "A single piece of kid-friendly sushi food art for a children's game, in the same soft claymation / plasticine style as the reference images:",
  "rounded chunky clay forms, smooth matte surfaces with fine clay texture, soft studio light from the top-left, gentle soft shadow on the lower right of each form, low contrast, warm and appetizing colors.",
  "Camera: the same three-quarter top-down view as the references, about 30 degrees above the table, object centered, the whole object inside the frame with a little margin.",
  "Transparent background. No plate, no table, no cast shadow on the ground, no props, no chopsticks.",
].join(" ");

const FOOD_NEGATIVE =
  "No text, no letters, no numbers, no logos, no watermark. No faces, eyes or mouths on the food. No photorealism, no glossy plastic, no velvet or felt fabric look.";

const food = (
  slug: string,
  label: string,
  round: 1 | 2,
  size: ArtSpec["size"],
  refs: readonly string[],
  subject: string,
  compare = `${slug}.webp`,
): ArtSpec => ({
  slug,
  label,
  round,
  status: "shipped",
  kind: "food",
  size,
  refs: refs.map((name) => join(FOOD_DIR, name)),
  prompt: [FOOD_STYLE, subject, FOOD_NEGATIVE].join(" "),
  target: join(FOOD_DIR, `${slug}.webp`),
  compare: join(FOOD_DIR, compare),
});

const FOOD_SPECS: readonly ArtSpec[] = [
  food("gunkan", "軍艦（飯底）", 1, "1024x1024", ["nigiri.webp", "salmon.webp"], [
    "Subject: an EMPTY gunkan-maki (battleship sushi) base, no topping yet, as it looks in a real sushi shop.",
    "An oval of white sushi rice wrapped by ONE thin band of nori seaweed around its side. Long axis horizontal; low and squat: the band is only about 40-45% as tall as the oval is long.",
    "The nori is a single thin sheet: matte deep green-black with a faint sheen and visible paper-like fibres, with one straight vertical seam slightly right of the front. Not thick, not fabric, not a box, no second step or tier, no lid.",
    "Top opening: a wide oval about 80% of the outer width, so we look down into it; the rice surface sits about 10-15% below the nori rim, with rice grains like the reference rice, leaving room for a topping.",
  ].join(" ")),
  /* 2026-11-11 Kaiyi 決定不重畫，以現圖為準：近直立錐形，畫布 709×1327，不透明寬高比約 0.53。 */
  food("temaki", "手捲（飯底）", 1, "1024x1536", ["nigiri.webp", "cucumber.webp"], [
    "Subject: an EMPTY temaki (hand roll) base, no filling yet, as it looks in a real sushi shop.",
    "A nearly upright cone of ONE nori sheet rolled diagonally, on a 709×1327 canvas, with an opaque (non-transparent) width-to-height ratio of about 0.53. One diagonal seam where the sheet overlaps across the front; the back of the cone rises about 15% higher than the front edge.",
    "The nori is matte deep green-black with a faint sheen and paper-like fibres; thin, not fabric, not velvet, not a perfectly symmetric ice-cream cone.",
    "The open top is wide (about 90% of the image width of the cone) and tips slightly toward the camera; it is filled with white sushi rice with a gently domed surface, like the reference rice — NO hole or ring in the rice, leaving room on top for fillings.",
  ].join(" ")),
  food("tuna", "鮪魚沙拉", 1, "1024x1024", ["corn.webp", "nigiri.webp"], [
    "Subject: a small scoop of Japanese tuna-mayo salad (ツナマヨ) as a sushi topping, like on a real tuna-mayo gunkan.",
    "Flaked canned tuna, pale beige with a soft pink tint, with visible shredded fibres and small chunks, mixed through with mayonnaise so it has a soft creamy sheen.",
    "A low rounded mound with a flat bottom: height about 45% of its width. A few tiny green scallion bits are fine.",
    "NO piped mayonnaise swirl on top, no cream rosette, no whipped-cream look, no pink rice look.",
  ].join(" ")),
  food("ikura", "鮭魚卵", 2, "1024x1024", ["corn.webp", "salmon.webp"], [
    "Subject: a small heap of salmon roe (ikura) as a sushi topping, like on a real ikura gunkan.",
    "ONLY the beads: many round glossy beads, each translucent orange-red with a darker orange core and one tiny bright highlight, piled loosely in a low rounded heap (height about 45% of its width).",
    "NO base, NO disc, NO tart shell, NO cup or slab under the beads; the bottom of the heap is just more beads, with the transparent background showing between the lowest ones.",
    "Beads are smaller than the reference corn kernels and clearly shiny and see-through, not matte yellow; no green garnish, no cucumber slice.",
  ].join(" "), "corn.webp"),
  food("unagi", "鰻魚", 2, "1024x1024", ["salmon.webp", "nigiri.webp"], [
    "Subject: one slice of grilled eel (unagi kabayaki) as a nigiri topping, about the same size and proportions as the reference salmon slice.",
    "A long, slightly curved flat fillet with a glossy dark caramel-brown sweet sauce glaze, a few soft darker grill marks across it, and lighter golden-brown flesh visible along the edges.",
    "ONLY the eel slice by itself, floating on the transparent background: NO rice under it, NO rice ball, NO nigiri, NO plate; the underside of the fillet is golden-brown eel flesh with nothing beneath it.",
    "No sesame seeds, no seaweed belt.",
  ].join(" "), "salmon.webp"),
  food("scallop", "干貝", 2, "1024x1024", ["salmon.webp", "tamago.webp"], [
    "Subject: one raw scallop (hotate) as a nigiri topping, like in a real sushi shop.",
    "A single thick round disc, wider than it is tall, soft ivory white with a faint pearly peach blush, a gently domed top with subtle concentric fibre lines, slightly translucent at the edges.",
    "Smaller than the reference salmon slice. Not a white rice ball, not a marshmallow, not a mushroom; no sauce, no garnish.",
  ].join(" "), "tamago.webp"),
];

/**
 * 每位朋友的臉長在哪裡要寫清楚：2026-11-10 第一次生阿樂、香香時，模型在擋風玻璃上多畫了一張臉。
 * 寫明位置後重生，香香核可；阿樂使用者選不要（status: declined）。
 */
const CUSTOMERS = [
  ["xiaohong", "小紅", "red race car", ""],
  ["anan", "安安", "white ambulance", ""],
  ["ale", "阿樂", "yellow taxi",
    "Its face is split in two places, keep exactly that: the two eyes are on the windshield, and the ONE mouth is the smile on the front bumper below the headlights. Change the windshield eyes into closed happy arcs with pink blush under them, and make the bumper smile open and delighted. Do NOT draw any mouth on the windshield."],
  ["lingling", "鈴鈴", "green-and-white street sweeper", ""],
  ["dongdong", "東東", "yellow excavator", ""],
  ["xiangxiang", "香香", "pink rice-dumpling food truck",
    "Its whole face (eyes, mouth, cheeks) is on the pink front of the body between the two headlights, below the windshield; the windshield is plain glass with no face. Keep it that way: change only that front face, and do NOT draw any eyes or mouth on the windshield. The two little rice dumplings on the roof keep their own small faces unchanged."],
] as const;

const faceSpec = ([id, name, what, where]: (typeof CUSTOMERS)[number]): ArtSpec => ({
  slug: `yum-${id}`,
  label: `${name}「好吃」臉`,
  round: 2,
  /* 2026-11-10 使用者在審圖台決定：阿樂的好吃臉不要，其他五位核可上線 */
  status: id === "ale" ? "declined" : "shipped",
  kind: "face",
  size: "1536x1024",
  refs: [join(CUSTOMER_DRAFTS, `${id}.jpg`)],
  prompt: [
    `Image 1 is the approved character sticker of ${name}, a friendly ${what} in soft claymation / plasticine style.`,
    "Reproduce this exact same vehicle character: same body shape, colors, proportions, decorations, number of wheels, camera angle, size and position in the frame, on the same plain white background.",
    "Change ONLY the face, keeping it on the same part of the vehicle as in the reference, to a 'yummy!' expression:",
    "eyes closed in happy upward arcs, mouth open in a delighted smile as if it just tasted something delicious, a small soft pink blush on each cheek.",
    "The vehicle has exactly ONE face: never add a second face, a second mouth or extra eyes anywhere.",
    where,
    "No food, no hearts, no stars, no hands or arms, no text, no extra objects, no new shadows. Do not mirror or rotate the vehicle.",
  ].filter(Boolean).join(" "),
  target: join(CUSTOMER_DRAFTS, `${id}-yum.jpg`),
  compare: join(CUSTOMER_DRAFTS, `${id}.jpg`),
});

export const ART_SPECS: readonly ArtSpec[] = [...FOOD_SPECS, ...CUSTOMERS.map(faceSpec)];
