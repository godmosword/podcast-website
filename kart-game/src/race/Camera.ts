import * as THREE from "three";
import { CAMERA } from "../data/config";
import type { KartState } from "./Kart";

export class FollowCamera {
  private current = new THREE.Vector3();
  private lookAt = new THREE.Vector3();
  private roll = 0;
  private initialized = false;

  update(
    camera: THREE.PerspectiveCamera,
    kart: KartState,
    alpha: number,
    shake: { x: number; y: number } = { x: 0, y: 0 },
  ): void {
    const yaw = kart.prevYaw + (kart.yaw - kart.prevYaw) * alpha;
    const px = kart.prevPos.x + (kart.pos.x - kart.prevPos.x) * alpha;
    const pz = kart.prevPos.z + (kart.pos.z - kart.prevPos.z) * alpha;
    const speed01 = Math.min(1, Math.abs(kart.speed) / 50);

    const back = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const target = new THREE.Vector3(px, 0.35, pz);
    const desired = target
      .clone()
      .addScaledVector(back, CAMERA.followDistance)
      .add(new THREE.Vector3(0, CAMERA.followHeight, 0));

    const look = target
      .clone()
      .add(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(CAMERA.lookAhead));

    if (!this.initialized) {
      this.current.copy(desired);
      this.lookAt.copy(look);
      this.initialized = true;
    }

    const lag = 1 - Math.exp(-CAMERA.positionLag * (1 / 60));
    this.current.lerp(desired, lag);
    this.lookAt.lerp(look, lag);

    const targetRoll = kart.drift.active ? kart.drift.dir * CAMERA.driftRoll : 0;
    this.roll += (targetRoll - this.roll) * (1 - Math.exp(-8 * (1 / 60)));

    camera.position.copy(this.current);
    camera.position.x += shake.x * 0.04;
    camera.position.y += shake.y * 0.04;
    camera.lookAt(this.lookAt);
    camera.rotation.z = this.roll;

    const boostFov = kart.boost > 0 ? CAMERA.fovBoost : 0;
    camera.fov = CAMERA.fovBase + speed01 * CAMERA.fovSpeed + boostFov;
    camera.updateProjectionMatrix();
  }
}
