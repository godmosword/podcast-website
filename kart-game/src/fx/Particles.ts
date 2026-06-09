import * as THREE from "three";
import { ObjectPool } from "../core/pool";

type Particle = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  life: number;
  vel: THREE.Vector3;
};

/** 漂移煙／火花粒子池（Phase 1/4）。 */
export class ParticleSystem {
  private pool: ObjectPool<Particle>;
  private active: Particle[] = [];
  private group = new THREE.Group();

  constructor(private scene: THREE.Scene) {
    this.scene.add(this.group);
    this.pool = new ObjectPool(
      () => ({
        mesh: new THREE.Mesh(
          new THREE.PlaneGeometry(0.5, 0.5),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        ),
        life: 0,
        vel: new THREE.Vector3(),
      }),
      (p) => {
        p.life = 0;
        p.mesh.visible = false;
        this.group.remove(p.mesh);
      },
      32,
    );
  }

  emitSmoke(x: number, y: number, z: number, charge: number, reduced: boolean): void {
    if (reduced) return;
    const count = charge > 0.8 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const p = this.pool.acquire();
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      const t = Math.min(1, charge);
      mat.color.setHSL(0.08 + t * 0.05, 0.3, 0.55 + t * 0.15);
      mat.opacity = 0.35 + t * 0.35;
      p.mesh.visible = true;
      p.mesh.position.set(x + (Math.random() - 0.5), y, z + (Math.random() - 0.5));
      p.mesh.rotation.y = Math.random() * Math.PI;
      p.life = 0.5 + t * 0.4;
      p.vel.set((Math.random() - 0.5) * 2, 1.5 + Math.random(), (Math.random() - 0.5) * 2);
      this.group.add(p.mesh);
      this.active.push(p);
    }
  }

  emitSpark(x: number, y: number, z: number): void {
    const p = this.pool.acquire();
    const mat = p.mesh.material as THREE.MeshBasicMaterial;
    mat.color.set(0xffd23f);
    mat.opacity = 0.9;
    p.mesh.visible = true;
    p.mesh.position.set(x, y, z);
    p.life = 0.25;
    p.vel.set((Math.random() - 0.5) * 4, 2 + Math.random() * 2, (Math.random() - 0.5) * 4);
    this.group.add(p.mesh);
    this.active.push(p);
  }

  update(dt: number, camera: THREE.Camera): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.pool.release(p);
        this.active.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= 3 * dt;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, p.life * 0.8);
      p.mesh.lookAt(camera.position);
    }
  }

  dispose(): void {
    for (const p of [...this.active]) this.pool.release(p);
    this.active.length = 0;
    this.scene.remove(this.group);
  }
}
