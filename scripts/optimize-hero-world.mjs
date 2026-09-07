import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { renameSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import validator from 'gltf-validator';
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';

const root = new URL('../public/models/hero-world/v2/', import.meta.url);
const sourceRoot = new URL('../assets/blender/hero-world/export/', import.meta.url);
const masterRoot = new URL('../assets/hero-world/posters/v2/', import.meta.url);
const qaRoot = new URL('../docs/qa/intro-portal/phase6-7-20260906/', import.meta.url);
await mkdir(qaRoot, { recursive: true });
const report = [];
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);

function parseGlb(bytes) {
  const jsonSize = bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
}

async function validate(file) {
  const bytes = await readFile(file);
  const result = await validator.validateBytes(new Uint8Array(bytes), { uri: file });
  if (result.issues.numErrors > 0) throw new Error(`GLB validator errors in ${file}: ${JSON.stringify(result.issues)}`);
  return { bytes, result, json: parseGlb(bytes) };
}

async function ensureSemanticHierarchy(file, name) {
  const document = await io.read(file);
  const scene = document.getRoot().listScenes()[0];
  if (!scene) throw new Error(`${name}: no default scene`);
  const top = () => [...scene.listChildren()];
  const find = (wanted) => {
    let found = null;
    scene.traverse(node => { if (node.getName() === wanted) found = node; });
    return found;
  };
  const make = (wanted) => find(wanted) ?? document.createNode(wanted);
  if (name === 'environment') {
    const environment = make('Environment');
    if (!environment.getParentNode()) scene.addChild(environment);
    for (const node of top()) {
      if (node !== environment) environment.addChild(node);
    }
    const rotor = find('FerrisRotor');
    if (!rotor) throw new Error('environment: missing FerrisRotor');
    for (const node of rotor.listChildren()) {
      if (node.getName()?.startsWith('FerrisRotor_')) node.setName(node.getName().replace('FerrisRotor_', 'RimAndSpokes_'));
    }
  } else if (name === 'little-red') {
    const vehicle = make('Vehicle');
    if (!vehicle.getParentNode()) scene.addChild(vehicle);
    const body = make('Body');
    if (!body.getParentNode()) vehicle.addChild(body);
    for (const node of top()) {
      if (node === vehicle || node === body) continue;
      if (/^Wheel_[0-3]$/.test(node.getName() ?? '')) vehicle.addChild(node);
      else if (!node.getParentNode() || node.getParentNode() === scene) body.addChild(node);
    }
  } else if (name === 'tree') {
    const tree = make('Tree');
    if (!tree.getParentNode()) scene.addChild(tree);
    for (const node of top()) {
      if (node !== tree) tree.addChild(node);
    }
    const nodes = tree.listChildren();
    const trunk = nodes.find(node => /trunk|wood/i.test(node.getName() ?? ''));
    const crown = nodes.find(node => /crown|leaf/i.test(node.getName() ?? ''));
    if (trunk) trunk.setName('Trunk');
    if (crown) crown.setName('Crown');
  }
  await io.write(file, document);
}

function hierarchyReport(name, json) {
  const nodes = json.nodes ?? [];
  const names = new Map(nodes.map((node, index) => [node.name, { ...node, index }]));
  const parent = new Map();
  nodes.forEach(node => (node.children ?? []).forEach(child => parent.set(child, node.name)));
  const required = name === 'environment'
    ? ['Environment', 'FerrisRotor', ...Array.from({ length: 8 }, (_, i) => `GondolaPivot${i}`)]
    : name === 'little-red'
      ? ['Vehicle', 'Body', ...Array.from({ length: 4 }, (_, i) => `Wheel_${i}`)]
      : ['Tree', 'Trunk', 'Crown'];
  const missing = required.filter(node => !names.has(node));
  const relationships = name === 'environment'
    ? { Environment: parent.get(names.get('FerrisRotor')?.index), GondolaPivots: required.slice(2).map(node => parent.get(names.get(node)?.index)) }
    : name === 'little-red'
      ? { Body: parent.get(names.get('Body')?.index), Wheels: required.slice(2).map(node => parent.get(names.get(node)?.index)) }
      : { Trunk: parent.get(names.get('Trunk')?.index), Crown: parent.get(names.get('Crown')?.index) };
  const animations = (json.animations ?? []).map(animation => ({
    name: animation.name ?? '',
    duration: Math.max(0, ...(animation.samplers ?? []).map(sampler => {
      const accessor = json.accessors?.[sampler.input];
      return accessor?.max?.[0] ?? 0;
    })),
    channels: (animation.channels ?? []).map(channel => nodes[channel.target?.node]?.name ?? `node-${channel.target?.node}`),
  }));
  return { required, missing, relationships, animations, nodeCount: nodes.length };
}

const sourceValidation = [];
for (const name of ['environment', 'little-red', 'tree']) {
  const input = new URL(`${name}.raw.glb`, sourceRoot);
  const output = new URL(`${name}.glb`, root);
  const raw = await validate(input.pathname);
  sourceValidation.push({ name, bytes: raw.bytes.length, warnings: raw.result.issues.numWarnings, errors: raw.result.issues.numErrors });
  // 共用材質已在 Blender 合併。保留動態節點和 Drive，不使用破壞階層的 flatten。
  execFileSync('node_modules/.bin/gltf-transform', ['optimize', input.pathname, output.pathname, '--compress', 'quantize', '--texture-compress', 'false', '--simplify', 'false', '--flatten', 'false', '--join', 'false'], {stdio: 'inherit'});
  if (name === 'environment') {
    const simplified = new URL(`${name}.simplified.glb`, root);
    execFileSync('node_modules/.bin/gltf-transform', ['simplify', output.pathname, simplified.pathname, '--ratio', '0.76', '--error', '0.002'], {stdio: 'inherit'});
    renameSync(simplified, output);
  }
  await ensureSemanticHierarchy(output.pathname, name);
  const { bytes, result, json } = await validate(output.pathname);
  const triangles = json.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((n, p) => n + (p.indices === undefined ? json.accessors[p.attributes.POSITION].count : json.accessors[p.indices].count) / 3, 0), 0);
  const hierarchy = hierarchyReport(name, json);
  if (hierarchy.missing.length > 0) throw new Error(`${name}: missing semantic nodes ${hierarchy.missing.join(', ')}`);
  report.push({name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: createHash('sha256').update(bytes).digest('hex'), triangles, materials: (json.materials ?? []).length, primitives: json.meshes.reduce((sum,m) => sum+m.primitives.length,0), animations: hierarchy.animations.map(a=>a.name), animationDetails: hierarchy.animations, hierarchy, errors: result.issues.numErrors, warnings: result.issues.numWarnings});
}
await sharp(new URL('poster.png', masterRoot).pathname).webp({quality: 85}).toFile(new URL('poster.webp', root).pathname);
await sharp(new URL('poster.png', masterRoot).pathname).resize(840).webp({quality: 82}).toFile(new URL('poster-mobile.webp', root).pathname);
const posters = [];
for (const file of ['poster.png', 'poster.webp', 'poster-mobile.webp']) {
  // poster.png is the lossless master in assets/; only the WebP wire posters ship in public/.
  const base = file === 'poster.png' ? masterRoot : root;
  const bytes = await readFile(new URL(file, base));
  const metadata = await sharp(new URL(file, base).pathname).metadata();
  posters.push({ name: file, role: file === 'poster.png' ? 'lossless-master' : 'wire-poster', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), width: metadata.width, height: metadata.height, format: metadata.format });
}
const manifest = { version: 'v2', generatedAt: new Date().toISOString(), generator: 'Blender 4.5 LTS build.py + gltf-transform 4.5.0', blenderSource: 'assets/blender/hero-world/hero-world.blend', buildScript: 'assets/blender/hero-world/build.py', buildSeed: 20260906, camera: { type: 'orthographic', position: [7, -12, 10], lookAt: [0, 0, 0.6], orthoScale: 14, resolution: [1400, 1000] }, lighting: { areaPosition: [-3, -5, 10], energy: 1600, size: 7 }, assets: [...report, ...posters] };
await writeFile(new URL('manifest.json', root), JSON.stringify(manifest,null,2)+'\n');
await writeFile(new URL('asset-report.json', qaRoot), JSON.stringify({ version: 'v2', sourceValidation, assets: report, posters, manifest: 'public/models/hero-world/v2/manifest.json' },null,2)+'\n');
await writeFile(new URL('asset-report.json', root), JSON.stringify({ version: 'v2', sourceValidation, assets: report, posters },null,2)+'\n');
await writeFile(new URL('asset-report.json', new URL('../docs/qa/intro-portal/', import.meta.url)), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ sourceValidation, assets: report, posters }, null, 2));
if (report.reduce((n, r) => n + r.bytes, 0) > 1_000_000 || report.reduce((n,r) => n+r.triangles,0) > 40_000) throw new Error('Hero asset budget exceeded');
