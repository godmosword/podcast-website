import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOGO_FAMILIES,
  NON_VEHICLE_SLUGS,
  PILOT_SLUGS,
  TIER1_SLUGS,
  getCharacterLogos,
  type CharacterLogo,
  type LogoFamilyKey,
} from "@/data/character-logos";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const NON_VEHICLE = new Set<string>(NON_VEHICLE_SLUGS);
const PILOT = new Set<string>(PILOT_SLUGS);
const TIER1 = new Set<string>(TIER1_SLUGS);

export function parseSharedPromptBlocks(markdown: string): Record<string, string> {
  const blocks: Record<string, string> = {};
  const pattern = /<!-- BLOCK:([a-z-]+) -->\n([\s\S]*?)\n<!-- \/BLOCK:\1 -->/g;
  for (const match of markdown.matchAll(pattern)) {
    blocks[match[1]] = match[2].trim();
  }
  return blocks;
}

const EXTRA: Record<string, string> = {
  "an-an":
    "The red cross is the only defining feature and must stay one large continuous red region. Do not add a roof light bar.",
  "liang-liang":
    "White body plus a gold roof light bar as the only feature. Do not use navy — it would vanish on this background.",
  "quan-quan":
    "Share the fire-engine silhouette with Diandian. Only feature: a blunt ladder whose top edge is a diagonal line. Quanquan is slightly larger. No water cannon.",
  "dian-dian":
    "Share the fire-engine silhouette with Quanquan. Only feature: a blunt water cannon whose top edge is a rounded tube, not a ladder.",
  "pen-pen":
    "Only feature: a blunt spray nozzle. The tank is the large secondary-color region. No extra hazard stripes as a third color.",
  "ling-ling":
    "Only feature: a pair of round spinning brushes, both fully visible. Cream cab is the eye surface. Do not add a roof speaker.",
  "dong-dong":
    "Only feature: the digging bucket. Do not add tracks or a detailed cab. Pale window band is the large secondary region and the eye surface.",
  "diao-che":
    "Only feature: the hook boom. Orange body is the silhouette; dark brown is the boom. Eyes sit on the lighter orange region. Do not add outriggers.",
  "a-ku":
    "Only feature: a blunt drill bit. Do not add tracks or a bucket. Distinct from Dongdong.",
  "a-ni":
    "Only feature: the mixing drum. Do not add a chute. Distinct from Dongdong's bucket.",
  "xiao-hong":
    "Bloodline race-car template (baseline proportions). Single rear spoiler. Coral-red body; pale blue windshield band is the eye surface. No digits, no number 2.",
  "xiao-chong":
    "Rival, not a blood relative. Longer, lower silhouette than the red family. Two intake scoops are the only feature. Primary IP color must be yellow or orange, never red.",
  "xiao-hong-dad":
    "Same bloodline template as Xiao Hong, slightly longer, smaller windshield ratio. Spoiler is the machine feature. Add one short blunt brow-line in the eye color, smaller than the spoiler — generation mark only, not detailed eyebrows, not a third color, no mustache.",
  "xiao-hong-baby":
    "Same bloodline template, squattest and most square, largest windshield ratio. Pacifier is the only feature, built from the two IP colors — no third teal.",
  "xiao-hong-dad-young":
    "Same bloodline template as Xiao Hong, slightly taller. Small spoiler only. No mustache and no brow-line.",
  "lan-ba-shi":
    "Cream body. The pale-blue continuous square window band is both the secondary color and the defining feature. Do not paint a mid-blue body.",
  "huang-ji-cheng":
    "Roof taxi lamp is the only feature. No checkerboard as a third color.",
  "zhi-zhi":
    "Roof LiDAR dome is the only feature. Distinct from the yellow taxi by that dome, not by extra cameras.",
  "xiao-ju-hsr":
    "Streamlined nose cone is the only feature. No extra carriages.",
  "xiao-nan":
    "Rounded train face plus door as one combined feature. Do not add a pantograph.",
  "san-lun-che":
    "Single front wheel is the only feature. Both rear wheels remain visible as a pair.",
  "xiao-fei":
    "Propeller ring is the only feature. Four rotors read as one ring, not thin arms.",
  "xiang-xiang":
    "Diagonal awning: the top edge MUST be a slanted line, unlike Huacan's circle. Cream window band is the eye surface.",
  "popcorn-truck":
    "Popcorn kettle: the top edge MUST be a circle, unlike Xiangxiang's slant. Cream face/window is the eye surface.",
  "pu-pu-pig":
    "Blunt pig snout is the only feature. Pink snout is the secondary region and the eye surface. Do not add a second feature such as a water cannon.",
  "xiao-rou":
    "Roof tent is the only feature. Cream window is the eye surface. Do not add a striped side awning.",
  "gao-gao":
    "Rim and spokes are the only feature. Cream hub is the face and eye surface. No extra gondola colors.",
  dudu: "Arched roof is the only feature — not a race-car spoiler. Cream windshield is the eye surface.",
  "duo-duo":
    "Back fins are the only feature. Tips must be blunt, not a sawtooth row. No arms, hands, or teeth.",
  "monster-truck":
    "Giant wheels are the only feature. Dark wheels are the secondary region. No roof light bar.",
  "dirty-germs":
    "One pair of blunt round horns, both visible. Cream belly/face is the eye surface. Single creature, not a swarm.",
  "nuan-nuan-turtle":
    "Shell is the only feature. Coral shell is the silhouette; peach face/belly is the eye surface. No bow, no skateboard, no car body.",
  "bong-bong":
    "One ahoge hair tuft is the only feature. Pale teal hoodie is the large secondary region. No backpack.",
  mami: "Microphone is the only feature. Apricot headphones/mic mass is the large secondary region. No beauty mark.",
  watt: "Antenna sphere on a short thick stalk. The sphere must be obviously round — never a needle or thin spike. Pale teal panel is the secondary region.",
};

function oklchLine(family: LogoFamilyKey): string {
  const spec = LOGO_FAMILIES[family];
  const { l, c, h } = spec.oklch;
  return `OKLCH(L ${l.toFixed(2)} C ${c.toFixed(2)} H ${h}) / ${spec.hex} (${family} family, ${spec.label})`;
}

function productionLine(slug: string): string {
  const tags: string[] = [];
  if (PILOT.has(slug)) tags.push("Pilot");
  tags.push(TIER1.has(slug) ? "Tier 1" : "Tier 2");
  return tags.join(" · ");
}

export function buildLogoPrompt(
  logo: CharacterLogo,
  blocks: Record<string, string>,
): string {
  const composition = NON_VEHICLE.has(logo.slug)
    ? blocks["composition-non-vehicle"]
    : blocks["composition-vehicle"];
  if (!composition) {
    throw new Error("缺少構圖共用區塊");
  }
  const extra = EXTRA[logo.slug];
  if (!extra) {
    throw new Error(`缺少 ${logo.slug} 的獨有約束`);
  }
  const subject = NON_VEHICLE.has(logo.slug)
    ? `Subject: ${logo.name} the ${logo.vehicle}, reduced to one continuous rounded silhouette with exactly one defining feature: ${logo.feature}.`
    : `Subject: ${logo.name} the ${logo.vehicle}, reduced to one continuous rounded silhouette with exactly one defining feature: ${logo.feature}. Front three-quarter-low view; the vehicle's front IS the face — grille as mouth, headlights as eyes.`;

  return [
    blocks.lead,
    "",
    `Background: fully opaque edge-to-edge solid ${oklchLine(logo.family)}. Use this color for the background only. Background stays visually flat: no vignette, spotlight, or directional wash.`,
    "",
    subject,
    extra,
    "",
    blocks.complexity,
    "",
    `Color: exactly three semantic colors total — two IP base colors (${logo.ipColorPrimary} primary, ${logo.ipColorSecondary} secondary) plus the background. Keep the secondary color as one large continuous region. Silhouette-to-background contrast uses the hue-weighted gate (2.8 / 3.6 / 4.5) with margin >= 0.2; facial marks on the lighter IP region >= 5:1.`,
    "",
    composition,
    "",
    blocks.eyes,
    "",
    blocks.style,
    "",
    blocks.forbid,
    "",
    blocks.output,
    `Asset paths: public/characters/logo/${logo.slug}-512.webp, ${logo.slug}-128.webp, ${logo.slug}-32.webp.`,
  ].join("\n");
}

export function renderLogoPromptMarkdown(
  logo: CharacterLogo,
  blocks: Record<string, string>,
): string {
  const prompt = buildLogoPrompt(logo, blocks);
  return [
    `# ${logo.name} · \`${logo.slug}\``,
    "",
    `家族：${logo.family} · 車種：${logo.vehicle} · 特徵：${logo.feature} · ${productionLine(logo.slug)}`,
    "",
    "把下面英文 fence **整段**貼給 image model。改恆定層請先改 [`_shared.md`](./_shared.md)。",
    "",
    "```",
    prompt,
    "```",
    "",
  ].join("\n");
}

export function writeLogoPromptFiles(
  repoRoot: string = ROOT,
): string[] {
  const sharedPath = join(repoRoot, "docs/logo-prompts/_shared.md");
  const outDir = join(repoRoot, "docs/logo-prompts");
  const blocks = parseSharedPromptBlocks(readFileSync(sharedPath, "utf8"));
  const required = [
    "lead",
    "complexity",
    "eyes",
    "composition-vehicle",
    "composition-non-vehicle",
    "style",
    "forbid",
    "output",
  ];
  for (const key of required) {
    if (!blocks[key]) throw new Error(`_shared.md 缺少 BLOCK:${key}`);
  }
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const logo of getCharacterLogos()) {
    const relative = `docs/logo-prompts/${logo.slug}.md`;
    writeFileSync(
      join(repoRoot, relative),
      renderLogoPromptMarkdown(logo, blocks),
      "utf8",
    );
    written.push(relative);
  }
  return written;
}

function main(): void {
  const written = writeLogoPromptFiles();
  console.log(`wrote ${written.length} prompt files → docs/logo-prompts/`);
}

const isDirectRun =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main();
}
