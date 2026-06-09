import * as THREE from "three";
import type { KartState } from "./Kart";

export type ItemKind = "boost" | "banana";

export type ItemBox = {
  progress: number;
  kind: ItemKind;
  mesh: THREE.Mesh;
  taken: boolean;
};

const KINDS: ItemKind[] = ["boost", "banana", "boost"];

/** 賽道道具箱（P3 簡化版）。 */
export class ItemSystem {
  readonly boxes: ItemBox[] = [];
  private group = new THREE.Group();

  constructor(
    private scene: THREE.Scene,
    progressList: number[],
  ) {
    this.scene.add(this.group);
    progressList.forEach((p, i) => {
      const kind = KINDS[i % KINDS.length];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({
          color: kind === "boost" ? 0xffd23f : 0xffe066,
          emissive: kind === "boost" ? 0xff8800 : 0xccaa00,
          emissiveIntensity: 0.35,
        }),
      );
      mesh.castShadow = true;
      this.group.add(mesh);
      this.boxes.push({ progress: p, kind, mesh, taken: false });
    });
  }

  placeOnTrack(getPose: (t: number) => { x: number; z: number }): void {
    for (const box of this.boxes) {
      const pose = getPose(box.progress);
      box.mesh.position.set(pose.x, 0.8, pose.z);
    }
  }

  tryPickup(
    state: KartState,
    progress: number,
  ): ItemKind | null {
    for (const box of this.boxes) {
      if (box.taken) continue;
      let d = Math.abs(box.progress - progress);
      if (d > 0.5) d = 1 - d;
      if (d < 0.04) {
        box.taken = true;
        box.mesh.visible = false;
        return box.kind;
      }
    }
    return null;
  }

  applyItem(kind: ItemKind, state: KartState): void {
    if (kind === "boost") {
      state.boost = Math.max(state.boost, 1.1);
    } else if (kind === "banana") {
      state.speed *= 0.65;
    }
  }

  dispose(): void {
    this.scene.remove(this.group);
    for (const b of this.boxes) b.mesh.geometry.dispose();
  }
}
