// Uses the actual R3F scene, lights and CameraRig. No Blender required.
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, extname, join } from 'node:path';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const root=resolve('.');
const output=join(root,'public/models/hero-world/v3');
// PNG masters stay out of public/ so they are never deployed; only WebP ships.
const masterOutput=join(root,'assets/hero-world/posters/v3');
const temp=await mkdtemp(join(tmpdir(),'intro-posters-'));
await mkdir(output,{recursive:true});
await mkdir(masterOutput,{recursive:true});
await build({stdin:{contents:`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import HeroScene from './components/landing/hero-world/HeroScene';import {_roots} from '@react-three/fiber';import {Vector3,Quaternion} from 'three';import {WORLD_CAMERA,WORLD_LIGHT} from './components/landing/hero-world/art-direction';
window.worldQA=(angle)=>{const {gl,scene,camera}=_roots.get(document.querySelector('canvas')).store.getState();const rotor=scene.getObjectByName('FerrisRotor');const cabins=Array.from({length:8},(_,i)=>scene.getObjectByName('GondolaPivot'+i));rotor.rotation.z=angle;cabins.forEach(c=>c.rotation.z=-angle);scene.updateMatrixWorld(true);const upright=cabins.map(c=>new Vector3(0,1,0).applyQuaternion(c.getWorldQuaternion(new Quaternion())).toArray());gl.shadowMap.needsUpdate=true;gl.render(scene,camera);const total={calls:gl.info.render.calls,triangles:gl.info.render.triangles};const shadows=gl.shadowMap.enabled;gl.shadowMap.enabled=false;gl.render(scene,camera);const main={calls:gl.info.render.calls,triangles:gl.info.render.triangles};gl.shadowMap.enabled=shadows;gl.shadowMap.needsUpdate=true;gl.render(scene,camera);return {angle,upright,total,main,shadow:{calls:total.calls-main.calls,triangles:total.triangles-main.triangles},camera:WORLD_CAMERA,lighting:WORLD_LIGHT};};
const mobile=innerWidth<750;document.body.style.margin='0';document.body.style.background='transparent';document.getElementById('root').style.cssText='width:100vw;height:100vh';
function App(){const [active,setActive]=useState(true);return <HeroScene active={active} quality={mobile?'medium':'high'} run={0} onReady={()=>{setActive(false);document.documentElement.dataset.ready='true'}} onFailure={()=>{document.documentElement.dataset.error='true'}} onFinish={()=>{}} onQuality={()=>{}}/>;} createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',outfile:join(temp,'app.js'),jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'candidate-release',setup(b){b.onLoad({filter:/hero-world\/config\.ts$/},async args=>({contents:(await readFile(args.path,'utf8')).replace('/models/hero-world/v2','/models/hero-world/v3'),loader:'ts'}));}}]});
const server=createServer(async(req,res)=>{try{let path=req.url.split('?')[0];if(path==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><div id="root"></div><script type="module" src="/app.js"></script>');return;}let f=path==='/app.js'?join(temp,'app.js'):join(root,'public',path);const data=await readFile(f);res.setHeader('content-type',extname(f)==='.js'?'text/javascript':'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
// --qa-out=<dir> redirects the four-angle QA captures; --qa-only keeps the
// released v3 posters and manifest untouched while still measuring the scene.
const qaOutArg=process.argv.find(a=>a.startsWith('--qa-out='));
const qaOnly=process.argv.includes('--qa-only');
const posters=[];const rendererReports=[];const qa=join(root,qaOutArg?qaOutArg.slice('--qa-out='.length):'docs/qa/intro-portal/phase8-20260906');
await mkdir(qa,{recursive:true});
try{
for(const c of [{name:'poster',width:1380,height:980,quality:'high'},{name:'poster-mobile',width:615,height:490,quality:'medium'}]){
 const page=await browser.newPage({viewport:{width:c.width,height:c.height},deviceScaleFactor:1});
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.waitForSelector('html[data-ready="true"]');
 await page.waitForTimeout(200);
 const png=await page.screenshot({omitBackground:true});
 if(!qaOnly){
  await writeFile(join(masterOutput,`${c.name}.png`),png);
  await sharp(png).webp({quality:90,alphaQuality:100}).toFile(join(output,`${c.name}.webp`));
  for(const ext of ['png','webp']){const name=`${c.name}.${ext}`,bytes=await readFile(join(ext==='png'?masterOutput:output,name));posters.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),width:c.width,height:c.height,quality:c.quality});}
 }
 if(process.argv.includes('--qa')){
   const measurements=[];
   for(const degrees of [0,90,180,270]){
     const sample=await page.evaluate(degrees=>window.worldQA(degrees*Math.PI/180),degrees);
     if(sample.upright.some(up=>Math.abs(up[0])>1e-6||Math.abs(up[1]-1)>1e-6||Math.abs(up[2])>1e-6))throw new Error('Inverted gondola');
     measurements.push({degrees,...sample});
     await page.screenshot({path:join(qa,`${c.name}-ferris-${degrees}.png`),omitBackground:true});
   }
   rendererReports.push({quality:c.quality,viewport:[c.width,c.height],measurements});
 }
 await page.close();
}
if(!qaOnly){
const report=JSON.parse(await readFile(join(output,'asset-report.json'),'utf8'));
const manifest={version:'v3',sourceRelease:'v2',generatedAt:new Date().toISOString(),generator:'polish-hero-world.mjs + render-hero-posters.mjs',blenderCleanRebuild:false,blenderNote:'Existing v2 geometry modified by NodeIO. build.py and .blend have NOT been clean rebuilt.',artDirection:'components/landing/hero-world/art-direction.ts',camera:{desktop:{position:[7,10,12],width:13.8,height:9.8,scale:1.16},mobile:{position:[5,10.5,14],width:12.3,height:9.8,scale:.94},lookAt:[.18,.65,0]},lighting:{sky:'#fff1dc',ground:'#9dab9e',fill:1.85,key:'#fff0d9',intensity:2.45,position:[-3,8,5]},assets:[...report.assets,...posters]};
await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}
if(rendererReports.length)await writeFile(join(qa,'renderer-report.json'),JSON.stringify(rendererReports,null,2)+'\n');
console.log(qaOnly?{qaOnly:true,qa,rendererReports:rendererReports.length}:posters);
}finally{await browser.close();server.close();await rm(temp,{recursive:true,force:true});}
