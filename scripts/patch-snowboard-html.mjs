import { readFileSync, writeFileSync } from "node:fs";

const htmlPath = new URL("../public/snowboard/index.html", import.meta.url);
const loaderPath = new URL("../public/snowboard/index.js", import.meta.url);
const marker = "// snowboard-runtime-options";
let html = readFileSync(htmlPath, "utf8");

if (!html.includes(marker)) {
  const needle = "const GODOT_THREADS_ENABLED = false;\nconst engine = new Engine(GODOT_CONFIG);";
  const runtimeOptions = `const GODOT_THREADS_ENABLED = false;
${marker}
const snowboardParams = new URLSearchParams(window.location.search);
const snowboardStage = snowboardParams.get('visualStage');
const snowboardPose = snowboardParams.get('visualPose');
const snowboardArgs = [];
if (['start', 'forest', 'valley', 'finish'].includes(snowboardStage)) snowboardArgs.push('--visual-stage=' + snowboardStage);
if (['ride', 'carve', 'jump', 'landing'].includes(snowboardPose)) snowboardArgs.push('--visual-pose=' + snowboardPose);
if (window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 700) snowboardArgs.push('--visual-mobile');
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) snowboardArgs.push('--visual-reduced-motion');
if (snowboardArgs.length) GODOT_CONFIG.args.push('--', ...snowboardArgs);
const engine = new Engine(GODOT_CONFIG);`;
  if (!html.includes(needle)) {
    throw new Error("找不到 Godot HTML runtime 插入點");
  }
  html = html.replace(needle, runtimeOptions);
}

// Godot's generated wrapper keeps a few whitespace-only lines. Normalize them so
// exported artifacts remain friendly to repository checks without changing code.
html = html.replace(/[ \t]+$/gm, "").trimEnd() + "\n";
writeFileSync(htmlPath, html);

const loader = readFileSync(loaderPath, "utf8")
  .replace(/[ \t]+$/gm, "")
  .trimEnd() + "\n";
writeFileSync(loaderPath, loader);
