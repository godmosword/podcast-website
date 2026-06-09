import * as THREE from "three";
import type { KartStats } from "../data/karts";

/** P0：方塊車佔位；P4 換 GLB。 */
export function createKartMesh(stats: KartStats): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.5, 2.2),
    new THREE.MeshStandardMaterial({ color: stats.bodyColor, roughness: 0.45 }),
  );
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.35, 0.9),
    new THREE.MeshStandardMaterial({ color: stats.accentColor, roughness: 0.4 }),
  );
  cabin.position.set(0, 0.65, -0.15);
  cabin.castShadow = true;
  group.add(cabin);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222831 });
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12);
  const wheelPos: [number, number, number][] = [
    [-0.7, 0.22, 0.75],
    [0.7, 0.22, 0.75],
    [-0.7, 0.22, -0.75],
    [0.7, 0.22, -0.75],
  ];
  for (const [x, y, z] of wheelPos) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    group.add(w);
  }

  return group;
}
