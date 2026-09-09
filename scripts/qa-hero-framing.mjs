// 把 art-direction.ts 註解裡的「Roof, ferris rim and Little Red's eyes stay
// inside」從註解升級成可執行的斷言。用正式的 R3F 場景與 CameraRig 算出每個
// 具名節點的螢幕座標（NDC），再逐一檢查有沒有被畫面邊緣切掉。
//
//   node scripts/qa-hero-framing.mjs [--json=<path>] [--shots=<dir>]
//
// 出血規則：使用者定稿的手機構圖是「水平完整、底部微出血」，所以地面幾何
// 允許超出下緣，其餘一律必須完整入鏡。
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';

const root = resolve('.');
const temp = await mkdtemp(join(tmpdir(), 'hero-framing-'));
const jsonArg = process.argv.find(a => a.startsWith('--json='));
const shotsArg = process.argv.find(a => a.startsWith('--shots='));

// 只有地面可以出血，而且只准往下。其餘節點缺一角就是失敗。
const GROUND = /^Environment_(sand|grass|road|paving|mint)$/;

// 以 stage 的實際尺寸開視窗，不是以整個 viewport——CameraRig 吃的是 canvas
// 尺寸，用 viewport 量會量到不存在的構圖。
const STAGE_VIEWPORTS = [
  { label: '320w portrait', width: 320, mobile: true },
  { label: '375w portrait', width: 375, mobile: true },
  { label: '390w portrait', width: 390, mobile: true },
  { label: '414w portrait', width: 414, mobile: true },
  { label: '430w portrait', width: 430, mobile: true },
  { label: 'desktop stage', width: 1104, height: 810, mobile: false },
];

await build({
  entryPoints: [join(root, 'components/landing/hero-world/art-direction.ts')],
  bundle: true, format: 'esm', outfile: join(temp, 'art.mjs'),
});
const { HERO_STAGE_ASPECT } = await import(pathToFileURL(join(temp, 'art.mjs')).href);

await build({
  stdin: {
    contents: `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import HeroScene from './components/landing/hero-world/HeroScene';import {_roots} from '@react-three/fiber';import {Vector3} from 'three';
window.worldFraming=()=>{const {scene,camera}=_roots.get(document.querySelector('canvas')).store.getState();scene.updateMatrixWorld(true);
const nodes=[];scene.traverse(o=>{if(o.isMesh&&o.name)nodes.push(o);});
// 投影真正的頂點，不是 AABB 的八個角。合併過的網格（例如 cream 同時含
// 書頁、門階與島緣的小石頭）AABB 會嚴重高估，量出根本不存在的切邊。
const measure=(object)=>{let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,seen=false;const v=new Vector3();
object.traverse(node=>{const geometry=node.geometry;if(!geometry?.attributes?.position)return;const position=geometry.attributes.position;
for(let i=0;i<position.count;i++){v.fromBufferAttribute(position,i).applyMatrix4(node.matrixWorld).project(camera);seen=true;
if(v.x<minX)minX=v.x;if(v.x>maxX)maxX=v.x;if(v.y<minY)minY=v.y;if(v.y>maxY)maxY=v.y;}});
return seen?{minX,maxX,minY,maxY}:null;};
const per={};for(const node of nodes){const m=measure(node);if(m)per[node.name]=m;}
const rotor=scene.getObjectByName('FerrisRotor');const vehicle=scene.getObjectByName('Vehicle');
return {per,ferris:rotor?measure(rotor):null,vehicle:vehicle?measure(vehicle):null,zoom:camera.zoom,canvas:[innerWidth,innerHeight]};};
const mobile=innerWidth<750;document.body.style.margin='0';document.body.style.background='transparent';document.getElementById('root').style.cssText='width:100vw;height:100vh';
function App(){const [active,setActive]=useState(true);return <HeroScene active={active} quality={mobile?'medium':'high'} run={0} onReady={()=>{setActive(false);document.documentElement.dataset.ready='true'}} onFailure={()=>{document.documentElement.dataset.error='true'}} onFinish={()=>{}} onQuality={()=>{}}/>;} createRoot(document.getElementById('root')).render(<App/>);`,
    resolveDir: root, loader: 'tsx',
  },
  bundle: true, format: 'esm', outfile: join(temp, 'app.js'), jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
});

const server = createServer(async (req, res) => {
  try {
    const path = req.url.split('?')[0];
    if (path === '/') { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><div id="root"></div><script type="module" src="/app.js"></script>'); return; }
    const file = path === '/app.js' ? join(temp, 'app.js') : join(root, 'public', path);
    const data = await readFile(file);
    res.setHeader('content-type', extname(file) === '.js' ? 'text/javascript' : 'application/octet-stream');
    res.end(data);
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}) });
const results = [];
let failures = 0;
try {
  if (shotsArg) await mkdir(shotsArg.slice('--shots='.length), { recursive: true });
  for (const target of STAGE_VIEWPORTS) {
    const aspect = target.mobile ? HERO_STAGE_ASPECT.mobile : HERO_STAGE_ASPECT.desktop;
    const height = target.height ?? Math.round(target.width / aspect);
    const page = await browser.newPage({ viewport: { width: target.width, height }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForSelector('html[data-ready="true"]', { timeout: 30_000 });
    await page.waitForTimeout(150);
    const framing = await page.evaluate(() => window.worldFraming());
    if (shotsArg) await page.screenshot({ path: join(shotsArg.slice('--shots='.length), `${target.width}x${height}.png`), omitBackground: true });
    await page.close();

    const offenders = [];
    for (const [name, box] of Object.entries(framing.per)) {
      const ground = GROUND.test(name);
      if (box.minX < -1.001) offenders.push({ name, edge: 'left', overshoot: +( -1 - box.minX).toFixed(3) });
      if (box.maxX > 1.001) offenders.push({ name, edge: 'right', overshoot: +(box.maxX - 1).toFixed(3) });
      if (box.maxY > 1.001) offenders.push({ name, edge: 'top', overshoot: +(box.maxY - 1).toFixed(3) });
      if (box.minY < -1.001 && !ground) offenders.push({ name, edge: 'bottom', overshoot: +(-1 - box.minY).toFixed(3) });
    }
    const pass = offenders.length === 0;
    if (!pass) failures += 1;
    results.push({ ...target, height, aspect: +(target.width / height).toFixed(3), zoom: +framing.zoom.toFixed(2), pass, offenders, ferris: framing.ferris, vehicle: framing.vehicle, per: framing.per });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${target.label.padEnd(16)} ${target.width}x${height}  zoom=${framing.zoom.toFixed(1)}${pass ? '' : '  ' + offenders.map(o => `${o.name}/${o.edge}+${o.overshoot}`).join(' ')}`);
  }
  if (jsonArg) await writeFile(jsonArg.slice('--json='.length), JSON.stringify(results, null, 2) + '\n');
} finally {
  await browser.close(); server.close(); await rm(temp, { recursive: true, force: true });
}
if (failures) { console.error(`\n${failures} viewport(s) clip the scene.`); process.exitCode = 1; }
