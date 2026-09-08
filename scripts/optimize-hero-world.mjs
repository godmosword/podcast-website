// v3 資產管線的第二段：把 build.py 匯出的 raw GLB 最佳化成 public/models/hero-world/v3。
// 來源鏈只有一條：hero-world.blend / build.py → export/*.raw.glb → 這支腳本。
// 沒有任何步驟讀取既有的上線 GLB，因此 v3 可以從來源乾淨重建。
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { renameSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import validator from 'gltf-validator';
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';

const root = new URL('../public/models/hero-world/v3/', import.meta.url);
const sourceRoot = new URL('../assets/blender/hero-world/export/', import.meta.url);
const qaRoot = new URL('../docs/qa/intro-portal/v3-clean-rebuild-20260908/', import.meta.url);
await mkdir(root, { recursive: true });
await mkdir(qaRoot, { recursive: true });
const report = [];
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);

const buildInfo = JSON.parse(await readFile(new URL('build-info.json', sourceRoot), 'utf8').catch(() => {
  throw new Error('Missing export/build-info.json — run `blender -b --python assets/blender/hero-world/build.py` first');
}));

function parseGlb(bytes) {
  const jsonSize = bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
}

async function validate(file) {
  const bytes = await readFile(file);
  const result = await validator.validateBytes(new Uint8Array(bytes), { uri: file });
  // 0 errors 是硬限制；warnings 也一併擋下，避免「通過但有雜訊」的資產上線。
  if (result.issues.numErrors > 0 || result.issues.numWarnings > 0) {
    throw new Error(`glTF validator issues in ${file}: ${JSON.stringify(result.issues)}`);
  }
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
  sourceValidation.push({
    name, file: `${name}.raw.glb`, bytes: raw.bytes.length,
    sha256: createHash('sha256').update(raw.bytes).digest('hex'),
    warnings: raw.result.issues.numWarnings, errors: raw.result.issues.numErrors,
  });
  // 共用材質已在 Blender 合併；保留動態節點與 Drive，不使用破壞階層的 flatten。
  // palette 關掉：v3 的顏色是美術定稿的一部分，留在各自的材質裡比壓成 atlas
  // 貼圖更容易改，也讓 GLB 完全不帶紋理。
  execFileSync('node_modules/.bin/gltf-transform', ['optimize', input.pathname, output.pathname, '--compress', 'quantize', '--texture-compress', 'false', '--simplify', 'false', '--flatten', 'false', '--join', 'false', '--palette', 'false'], {stdio: 'inherit'});
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
  if ((json.images ?? []).length > 0) throw new Error(`${name}: unexpected texture in an untextured release`);
  report.push({name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: createHash('sha256').update(bytes).digest('hex'), triangles, materials: (json.materials ?? []).length, primitives: json.meshes.reduce((sum,m) => sum+m.primitives.length,0), textures: (json.textures ?? []).length, animations: hierarchy.animations.map(a=>a.name), animationDetails: hierarchy.animations, hierarchy, errors: result.issues.numErrors, warnings: result.issues.numWarnings, sourceRaw: `${name}.raw.glb`, sourceSha256: sourceValidation.at(-1).sha256});
}

const assetReport = {
  version: 'v3',
  generator: 'assets/blender/hero-world/build.py + scripts/optimize-hero-world.mjs',
  blenderCleanRebuild: true,
  build: buildInfo,
  generatedAt: new Date().toISOString(),
  sourceValidation,
  assets: report,
};
await writeFile(new URL('asset-report.json', root), JSON.stringify(assetReport, null, 2)+'\n');
await writeFile(new URL('asset-report.json', qaRoot), JSON.stringify(assetReport, null, 2)+'\n');
await writeFile(new URL('asset-report.json', new URL('../docs/qa/intro-portal/', import.meta.url)), JSON.stringify(report, null, 2)+'\n');
console.log(JSON.stringify({ build: buildInfo, sourceValidation, assets: report.map(asset => ({ ...asset, hierarchy: undefined, animationDetails: undefined })) }, null, 2));
console.log('Next: node scripts/render-hero-posters.mjs   # posters + manifest.json');
if (report.reduce((n, r) => n + r.bytes, 0) > 1_000_000 || report.reduce((n,r) => n+r.triangles,0) > 40_000) throw new Error('Hero asset budget exceeded');
