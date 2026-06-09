import * as THREE from "three";
import type { TrackDef } from "../data/tracks";

function catmullRom(p0: THREE.Vector2, p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, t: number): THREE.Vector2 {
  const t2 = t * t;
  const t3 = t2 * t;
  return new THREE.Vector2(
    0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  );
}

function sampleSpline(points: [number, number][], segments: number): THREE.Vector2[] {
  const pts = points.map(([x, z]) => new THREE.Vector2(x, z));
  const out: THREE.Vector2[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let s = 0; s < segments; s++) {
      out.push(catmullRom(p0, p1, p2, p3, s / segments));
    }
  }
  return out;
}

export type TrackPose = {
  x: number;
  z: number;
  yaw: number;
  progress: number;
};

export class Track {
  readonly def: TrackDef;
  readonly group = new THREE.Group();
  readonly centerLine: THREE.Vector2[];
  readonly length: number;
  private arcLengths: number[] = [];

  constructor(def: TrackDef) {
    this.def = def;
    this.centerLine = sampleSpline(def.points, 12);
    this.buildArcLengths();
    this.length = this.arcLengths[this.arcLengths.length - 1] ?? 1;
    this.buildMesh();
  }

  private buildArcLengths(): void {
    this.arcLengths = [0];
    for (let i = 1; i < this.centerLine.length; i++) {
      const a = this.centerLine[i - 1];
      const b = this.centerLine[i];
      const seg = a.distanceTo(b);
      this.arcLengths.push(this.arcLengths[i - 1] + seg);
    }
    const last = this.centerLine[this.centerLine.length - 1];
    const first = this.centerLine[0];
    this.arcLengths.push(this.arcLengths[this.arcLengths.length - 1] + last.distanceTo(first));
  }

  private buildMesh(): void {
    const halfW = this.def.width * 0.5;
    const verts: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < this.centerLine.length; i++) {
      const p = this.centerLine[i];
      const n = this.centerLine[(i + 1) % this.centerLine.length];
      const dir = new THREE.Vector2(n.x - p.x, n.y - p.y).normalize();
      const left = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(halfW);
      const right = left.clone().multiplyScalar(-1);
      const l = new THREE.Vector2(p.x + left.x, p.y + left.y);
      const r = new THREE.Vector2(p.x + right.x, p.y + right.y);
      verts.push(l.x, 0.02, l.y, r.x, 0.02, r.y);
      uvs.push(0, i * 0.05, 1, i * 0.05);
    }

    for (let i = 0; i < this.centerLine.length; i++) {
      const a = i * 2;
      const b = ((i + 1) % this.centerLine.length) * 2;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const road = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.85 }),
    );
    road.receiveShadow = true;
    this.group.add(road);

    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({ color: 0x6fbf73, roughness: 0.95 }),
    );
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    this.group.add(grass);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf4d35e });
    for (let i = 0; i < this.centerLine.length; i += 4) {
      const p = this.centerLine[i];
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), wallMat);
      post.position.set(p.x, 0.6, p.y);
      post.castShadow = true;
      this.group.add(post);
    }

    const startPose = this.getPoseAtProgress(0);
    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(this.def.width, 1.5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x4488ff, emissiveIntensity: 0.3 }),
    );
    gate.position.set(startPose.x, 0.75, startPose.z);
    gate.rotation.y = startPose.yaw;
    this.group.add(gate);
  }

  getProgress(x: number, z: number): { progress: number; dist: number } {
    let bestDist = Infinity;
    let bestArc = 0;
    const n = this.centerLine.length;

    for (let i = 0; i < n; i++) {
      const a = this.centerLine[i];
      const b = this.centerLine[(i + 1) % n];
      const ab = new THREE.Vector2().subVectors(b, a);
      const ap = new THREE.Vector2(x - a.x, z - a.y);
      const t = Math.max(0, Math.min(1, ap.dot(ab) / ab.lengthSq()));
      const proj = new THREE.Vector2(a.x + ab.x * t, a.y + ab.y * t);
      const d = proj.distanceTo(new THREE.Vector2(x, z));
      if (d < bestDist) {
        bestDist = d;
        const segLen = ab.length();
        bestArc = this.arcLengths[i] + segLen * t;
      }
    }

    return { progress: (bestArc % this.length) / this.length, dist: bestDist };
  }

  getPoseAtProgress(t: number): TrackPose {
    const arc = ((t % 1) + 1) % 1 * this.length;
    let i = 0;
    while (i < this.centerLine.length - 1 && this.arcLengths[i + 1] < arc) i++;
    const a = this.centerLine[i];
    const b = this.centerLine[(i + 1) % this.centerLine.length];
    const segLen = Math.max(0.001, a.distanceTo(b));
    const localT = Math.max(0, Math.min(1, (arc - this.arcLengths[i]) / segLen));
    const x = a.x + (b.x - a.x) * localT;
    const z = a.y + (b.y - a.y) * localT;
    const yaw = Math.atan2(b.x - a.x, b.y - a.y);
    return { x, z, yaw, progress: t };
  }

  getLookahead(progress: number, meters: number): TrackPose {
    return this.getPoseAtProgress(progress + meters / this.length);
  }

  isOffTrack(x: number, z: number): boolean {
    const { dist } = this.getProgress(x, z);
    return dist > this.def.width * 0.5;
  }

  pushInside(x: number, z: number): THREE.Vector2 {
    const { dist, progress } = this.getProgress(x, z);
    const pose = this.getPoseAtProgress(progress);
    const half = this.def.width * 0.5;
    if (dist <= half) return new THREE.Vector2(x, z);
    const dx = x - pose.x;
    const dz = z - pose.z;
    const len = Math.hypot(dx, dz) || 1;
    return new THREE.Vector2(pose.x + (dx / len) * (half - 0.5), pose.z + (dz / len) * (half - 0.5));
  }
}
