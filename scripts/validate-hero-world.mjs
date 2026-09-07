import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import validator from 'gltf-validator';

const version = process.argv[2] ?? 'v3';
if (!['v2', 'v3'].includes(version)) throw new Error('Expected v2 or v3');
const root = new URL(`../public/models/hero-world/${version}/`, import.meta.url);
const manifestPath = new URL('manifest.json', root);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const failures = [];
const checks = [];
const check = (ok, message) => { checks.push({ ok, message }); if (!ok) failures.push(message); };

function parseGlb(bytes) {
  check(bytes.length >= 20 && bytes.subarray(0, 4).toString() === 'glTF', 'GLB magic header');
  const jsonSize = bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
}

function hierarchy(name, json) {
  const nodes = json.nodes ?? [];
  const byName = new Map(nodes.map((node, index) => [node.name, { node, index }]));
  const parent = new Map();
  nodes.forEach(node => (node.children ?? []).forEach(child => parent.set(child, node.name)));
  const required = name === 'environment'
    ? ['Environment', 'FerrisRotor', ...Array.from({ length: 8 }, (_, i) => `GondolaPivot${i}`)]
    : name === 'little-red'
      ? ['Vehicle', 'Body', ...Array.from({ length: 4 }, (_, i) => `Wheel_${i}`)]
      : ['Tree', 'Trunk', 'Crown'];
  required.forEach(node => check(byName.has(node), `${name}: node ${node}`));
  if (name === 'environment') {
    check(parent.get(byName.get('FerrisRotor')?.index) === 'Environment', 'environment: FerrisRotor parent');
    for (let i = 0; i < 8; i++) check(parent.get(byName.get(`GondolaPivot${i}`)?.index) === 'FerrisRotor', `environment: GondolaPivot${i} parent`);
  } else if (name === 'little-red') {
    check(parent.get(byName.get('Body')?.index) === 'Vehicle', 'little-red: Body parent');
    for (let i = 0; i < 4; i++) check(parent.get(byName.get(`Wheel_${i}`)?.index) === 'Vehicle', `little-red: Wheel_${i} parent`);
    const drive = (json.animations ?? []).find(animation => animation.name === 'Drive');
    check(Boolean(drive), 'little-red: Drive clip');
    check((drive?.channels ?? []).every(channel => /^Wheel_[0-3]$/.test(nodes[channel.target?.node]?.name ?? '')), 'little-red: Drive targets wheels');
  } else {
    check(parent.get(byName.get('Trunk')?.index) === 'Tree', 'tree: Trunk parent');
    check(parent.get(byName.get('Crown')?.index) === 'Tree', 'tree: Crown parent');
  }
}

for (const name of ['environment', 'little-red', 'tree']) {
  const file = new URL(`${name}.glb`, root);
  check(existsSync(file), `${name}.glb exists`);
  const bytes = await readFile(file);
  const result = await validator.validateBytes(new Uint8Array(bytes), { uri: file.pathname });
  check(result.issues.numErrors === 0, `${name}: glTF validator errors=${result.issues.numErrors}`);
  check(bytes.length < 1_000_000, `${name}: under 1MB`);
  const json = parseGlb(bytes);
  hierarchy(name, json);
  const manifestAsset = manifest.assets.find(asset => asset.name === name);
  check(Boolean(manifestAsset), `${name}: manifest entry`);
  check(manifestAsset?.bytes === bytes.length, `${name}: manifest byte count`);
  check(manifestAsset?.sha256 === createHash('sha256').update(bytes).digest('hex'), `${name}: manifest SHA-256`);
}

for (const name of ['poster.webp', 'poster-mobile.webp']) {
  const file = new URL(name, root);
  check(existsSync(file), `${name} exists`);
  const bytes = await readFile(file);
  const metadata = await sharp(file.pathname).metadata();
  check(metadata.format === 'webp', `${name}: WebP format`);
  const dimensions = version === 'v2' ? (name === 'poster.webp' ? [1400,1000] : [840,600]) : (name === 'poster.webp' ? [1380,980] : [615,490]);
  check(metadata.width === dimensions[0] && metadata.height === dimensions[1], `${name}: expected dimensions`);
  const asset = manifest.assets.find(entry => entry.name === name);
  check(asset?.bytes === bytes.length, `${name}: manifest byte count`);
  check(asset?.sha256 === createHash('sha256').update(bytes).digest('hex'), `${name}: manifest SHA-256`);
  check(bytes.length <= (name === 'poster.webp' ? 180_000 : 100_000), `${name}: poster budget`);
}

// Lossless master lives outside public/ so it is never deployed or fetched.
const master = new URL(`../assets/hero-world/posters/${version}/poster.png`, import.meta.url);
check(existsSync(master), 'poster.png lossless master exists');
if (existsSync(master)) {
  const bytes = await readFile(master);
  const metadata = await sharp(master.pathname).metadata();
  const asset = manifest.assets.find(entry => entry.name === 'poster.png');
  check(metadata.format === 'png' && metadata.width === (version === 'v2' ? 1400 : 1380) && metadata.height === (version === 'v2' ? 1000 : 980), 'poster.png: expected PNG dimensions');
  check(asset?.bytes === bytes.length, 'poster.png: manifest byte count');
  check(asset?.sha256 === createHash('sha256').update(bytes).digest('hex'), 'poster.png: manifest SHA-256');
}

const totalTriangles = manifest.assets.filter(asset => asset.triangles).reduce((sum, asset) => sum + asset.triangles, 0);
check(totalTriangles < 40_000, `total triangles under 40k (${totalTriangles})`);
check(manifest.version === version, `manifest version ${version}`);
if (version === 'v2') check(manifest.buildSeed === 20260906, 'manifest build seed');
else check(manifest.blenderCleanRebuild === false && manifest.sourceRelease === 'v2', 'v3 declares NodeIO derivation, not Blender rebuild');
console.log(JSON.stringify({ pass: failures.length === 0, checks, failures, manifest: { version: manifest.version, generatedAt: manifest.generatedAt, assets: manifest.assets.map(asset => ({ name: asset.name, bytes: asset.bytes, triangles: asset.triangles, animations: asset.animations })) } }, null, 2));
if (failures.length > 0) process.exitCode = 1;
