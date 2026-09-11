// 2026-09-11：Intro 預設舞台已切為橫向 2.5D 視差帶（無 canvas、無 GLB）。這支腳本量的是
// 3D 舞台的指標（DPR、frame time、GLB 傳輸），所以固定走 `?stage=world` 的回滾舞台。
// 要量視差帶請直接用 e2e/intro-portal.spec.ts 的契約與 visual baseline。
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
// --out=<dir> 讓同一支腳本可以拍 before／after 兩組對照；預設仍是原本的目錄。
const outArg=process.argv.find(a=>a.startsWith('--out='));
const output=outArg?outArg.slice('--out='.length):'docs/qa/intro-portal/phase8-20260906';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PW_CHROMIUM_PATH?{executablePath:process.env.PW_CHROMIUM_PATH}:{})});
const reports=[];
try {
for(const viewport of [{width:1440,height:900},{width:390,height:844}]) {
 const name=viewport.width===390?'mobile':'desktop';
 const context=await browser.newContext({viewport,serviceWorkers:'block'});
 await context.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8}));
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Capture a decoded poster with WebGL deliberately disabled, never an empty request-in-flight image.
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:3000/intro?stage=world&heroQa=1');
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('[data-hero-world] picture img').evaluate(img=>img.decode());
 await page.screenshot({path:`${output}/${name}-poster.png`});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForSelector('[data-scene-state="ready"]');
 await page.evaluate(()=>document.fonts.ready);
 // Remove only the crossfade for state evidence; simulation and browser time
 // remain real so React, text painting and renderer metrics stay trustworthy.
 await page.addStyleTag({content:'[data-hero-world] [data-ready="true"] {transition:none !important;opacity:1 !important} [data-hero-world] picture {visibility:hidden !important}'});
 const frames=[];
 const capture=async state=>{
   const actual=await page.locator('[data-hero-world]').getAttribute('data-motion-phase');
   const dpr=await page.locator('canvas').evaluate(c=>c.width/c.getBoundingClientRect().width);
   await page.screenshot({path:`${output}/${name}-${state}.png`});
   frames.push({label:state,actual,renderDpr:dpr,capturedAt:await page.evaluate(()=>performance.now())});console.log(name,state,actual);
 };
 await capture('ready');
 // Capture exact active-time poses without replacing the browser clock. The
 // live component reads this QA-only global; normal users never define it.
 const poses={approach:.65,decelerate:4,stop:4.54,settle:4.72,acknowledge:5.55,continue:8};
 // 慢速主機上，整組擷取可能超過 24 秒的次要動態休眠預算，畫面會停格在
 // 上一個姿勢。休眠只由明確操作恢復，所以每次換姿勢前先確認它還在跑。
 const ensureRunning=async()=>{
   const resume=page.getByRole('button',{name:'繼續小紅的旅程'});
   if(await resume.count()&&await resume.isVisible())await resume.click();
 };
 for(const [state,seconds] of Object.entries(poses)){
   await ensureRunning();
   await page.evaluate(value=>{window.__HERO_WORLD_QA_TIME=value;},seconds);
   await page.waitForFunction(expected=>document.querySelector('[data-hero-world]')?.getAttribute('data-motion-phase')===expected,state,{polling:10,timeout:20_000});
   await page.waitForTimeout(80);
   await capture(state);
 }
 const metrics=await page.locator('canvas').getAttribute('data-world-metrics');
 await context.close();
 // 第二趟不帶 heroQa：QualityManager 只在非擷取模式採樣，這樣才拿得到
 // fps／draw call／triangle。本機是軟體算圖，數字只代表這台機器，不是裝置宣稱。
 const measure=await browser.newContext({viewport,serviceWorkers:'block'});
 await measure.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8}));
 const measurePage=await measure.newPage();
 await measurePage.goto('http://127.0.0.1:3000/intro?stage=world');
 await measurePage.waitForSelector('[data-scene-state="ready"]',{timeout:30_000});
 const sampled=await measurePage.waitForFunction(()=>document.querySelector('canvas')?.dataset.worldMetrics??null,null,{timeout:60_000,polling:250}).then(h=>h.jsonValue()).catch(()=>null);
 await measure.close();
 reports.push({name,viewport,controlledPoseSeconds:poses,runtimeMetrics:metrics?JSON.parse(metrics):null,softwareRenderedSample:sampled?JSON.parse(sampled):null,performanceSampled:Boolean(sampled),errors});
}
await writeFile(`${output}/capture-report.json`,JSON.stringify(reports,null,2)+'\n');console.log(reports);
}finally{await browser.close();}
