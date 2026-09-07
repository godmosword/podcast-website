// Deterministic art pass over the validated v2 release; NOT a Blender rebuild.
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import validator from 'gltf-validator';
const source = new URL('../public/models/hero-world/v2/', import.meta.url);
const target = new URL('../public/models/hero-world/v3/', import.meta.url);
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
await mkdir(target, { recursive: true });
const palette = {
  sand: [.43,.29,.19], grass: [.30,.43,.26], road: [.43,.34,.26],
  ivory: [.83,.76,.61], cream: [.72,.57,.38], red: [.58,.14,.095],
  pink: [.72,.33,.28], blue: [.10,.30,.32], sky: [.30,.52,.53],
  yellow: [.85,.53,.17], wood: [.25,.14,.08], leaf: [.26,.42,.29],
  mint: [.16,.32,.22], paving: [.61,.47,.33], warmglass: [.94,.49,.13],
  dark: [.025,.037,.03],
};
const rough = { red:.77, ivory:.92, leaf:.88, paving:.94, road:.96, warmglass:.58, sky:.62 };
const reports = [];
for (const name of ['environment','little-red','tree']) {
  const input = new URL(`${name}.glb`, source);
  const doc = await io.read(input.pathname);
  const buffer = doc.getRoot().listBuffers()[0];
  const mats = new Map();
  const material = key => {
    if (!mats.has(key)) {
      const m = doc.createMaterial(key).setBaseColorFactor([...palette[key],1]).setMetallicFactor(0).setRoughnessFactor(rough[key] ?? .86).setDoubleSided(true);
      if(key==='warmglass') m.setEmissiveFactor([.27,.10,.018]);
      mats.set(key,m);
    }
    return mats.get(key);
  };
  for(const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if(!mesh) continue;
    const key = node.getName()==='Crown'?'leaf':node.getName()==='Trunk'?'wood':node.getName().split('_').at(-1);
    if(!palette[key]) continue; // Cabin/wheel palette atlas and animation stay intact.
    // The biscuit previously protruded through the meadow at the centre.
    if(node.getName()==='Environment_sand') {const t=node.getTranslation();t[1]-=.085;node.setTranslation(t);}
    if(node.getName()==='Environment_paving') {const t=node.getTranslation();t[1]+=.032;node.setTranslation(t);}
    for(const primitive of mesh.listPrimitives()) {
      primitive.setMaterial(material(key));
      primitive.setAttribute('TEXCOORD_0',null);
      const pos=primitive.getAttribute('POSITION');
      const matrix=node.getWorldMatrix();
      const colors=new Uint8Array(pos.getCount()*3);
      for(let i=0;i<pos.getCount();i++) {
        const v=pos.getElement(i,[]);
        const x=matrix[0]*v[0]+matrix[4]*v[1]+matrix[8]*v[2]+matrix[12];
        const y=matrix[1]*v[0]+matrix[5]*v[1]+matrix[9]*v[2]+matrix[13];
        const z=matrix[2]*v[0]+matrix[6]*v[1]+matrix[10]*v[2]+matrix[14];
        // Broad, subtle hand-painted contact tones; no claim of ray-baked AO.
        let shade=1;
        if(key==='grass') {
          const house=Math.exp(-(((x+1.6)/1.5)**2+((z+.65)/1.4)**2));
          shade-=.13*house;
        } else if(key==='ivory' && name==='environment' && y>.45 && x<-.45 && z<.15) {
          shade-=.11*Math.exp(-Math.max(0,y-.25)*2.5);
          if(y>1.7)shade-=.06;
        } else if(key==='leaf') shade=.86+.14*Math.min(1,Math.max(0,(y-.55)/1.05));
        else if(key==='red')shade=.94+.06*Math.min(1,Math.max(0,y/2.4));
        colors.set([Math.round(shade*255),Math.round(shade*255),Math.round(shade*255)],i*3);
      }
      primitive.setAttribute('COLOR_0',doc.createAccessor().setType('VEC3').setArray(colors).setNormalized(true).setBuffer(buffer));
    }
  }
  await doc.transform(prune());
  const output=new URL(`${name}.glb`,target);
  await io.write(output.pathname,doc);
  const bytes=await readFile(output);
  const result=await validator.validateBytes(new Uint8Array(bytes));
  if(result.issues.numErrors||result.issues.numWarnings)throw new Error(JSON.stringify(result.issues));
  const j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  const triangles=j.meshes.reduce((n,m)=>n+m.primitives.reduce((s,p)=>s+j.accessors[p.indices??p.attributes.POSITION].count/3,0),0);
  reports.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),triangles,primitives:j.meshes.reduce((n,m)=>n+m.primitives.length,0),materials:j.materials.length,errors:0,warnings:0,sourceSha256:createHash('sha256').update(await readFile(input)).digest('hex')});
}
await writeFile(new URL('asset-report.json',target),JSON.stringify({source:'v2',generator:'scripts/polish-hero-world.mjs (NodeIO)',blenderCleanRebuild:false,assets:reports},null,2)+'\n');
console.log(reports);
