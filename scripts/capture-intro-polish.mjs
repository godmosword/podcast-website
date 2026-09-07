import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const output='docs/qa/intro-portal/phase8-20260906';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
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
 await page.goto('http://127.0.0.1:3000/intro?heroQa=1');
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
 for(const [state,seconds] of Object.entries(poses)){
   await page.evaluate(value=>{window.__HERO_WORLD_QA_TIME=value;},seconds);
   await page.waitForFunction(expected=>document.querySelector('[data-hero-world]')?.getAttribute('data-motion-phase')===expected,state,{polling:10,timeout:5_000});
   await page.waitForTimeout(80);
   await capture(state);
 }
 const metrics=await page.locator('canvas').getAttribute('data-world-metrics');
 reports.push({name,viewport,controlledPoseSeconds:poses,runtimeMetrics:metrics?JSON.parse(metrics):null,performanceSampled:false,errors});
 await context.close();
}
await writeFile(`${output}/capture-report.json`,JSON.stringify(reports,null,2)+'\n');console.log(reports);
}finally{await browser.close();}
