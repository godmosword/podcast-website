import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { InstancedMesh, Matrix4, Mesh, Object3D } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { TREE_PLACEMENTS, type Quality, QUALITY } from "./config";

function TreeInstances({ source, count, shadows, active, sway }: { source: Mesh; count: number; shadows: boolean; active: boolean; sway: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const clock = useRef(0);
  const scratch = useMemo(() => ({ object: new Object3D(), matrix: new Matrix4() }), []);
  useFrame((_, delta) => {
    if (!active || !sway || !ref.current) return;
    clock.current += Math.min(delta, .05);
    // Only two foliage instances, with trunks still anchored. No per-frame allocations.
    for (let i = 0; i < Math.min(2, count); i++) {
      const [x,z,scale] = TREE_PLACEMENTS[i];
      scratch.object.position.set(x,.19,z);
      scratch.object.scale.setScalar(scale);
      scratch.object.rotation.z = Math.sin(clock.current * .65 + i * 2) * .008;
      scratch.object.updateMatrix();
      scratch.matrix.multiplyMatrices(scratch.object.matrix, source.matrixWorld);
      ref.current.setMatrixAt(i,scratch.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const object = new Object3D();
    const matrix = new Matrix4();
    TREE_PLACEMENTS.slice(0, count).forEach(([x, z, scale], i) => {
      object.position.set(x, .19, z); object.scale.setScalar(scale); object.updateMatrix();
      matrix.multiplyMatrices(object.matrix, source.matrixWorld);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
  }, [source, count]);
  return <instancedMesh ref={ref} args={[source.geometry, source.material, count]} castShadow={shadows} receiveShadow={shadows} dispose={null} />;
}

export default function World({ environment, tree, quality, active }: { environment: GLTF; tree: GLTF; quality: Quality; active: boolean }) {
  const invalidate = useThree(s => s.invalidate);
  const elapsed = useRef(0);
  const wheel = useMemo(() => ({
    rotor: environment.scene.getObjectByName("FerrisRotor"),
    cabins: Array.from({ length: 8 }, (_, i) => environment.scene.getObjectByName(`GondolaPivot${i}`)),
  }), [environment]);
  useEffect(() => { if (active) invalidate(); }, [active, invalidate]);
  useFrame((_, delta) => {
    if (!active || quality === "low" || !wheel.rotor) return;
    elapsed.current += Math.min(delta,.05);
    const angle = elapsed.current * Math.PI * 2 / 56;
    wheel.rotor.rotation.z = angle;
    wheel.cabins.forEach(cabin => { if (cabin) cabin.rotation.z = -angle; });
    invalidate();
  });
  const settings = QUALITY[quality];
  const trees = useMemo(() => {
    tree.scene.updateMatrixWorld(true);
    const parts: Mesh[] = [];
    tree.scene.traverse(o => { if (o instanceof Mesh) parts.push(o); });
    return parts;
  }, [tree]);
  useLayoutEffect(() => {
    environment.scene.traverse(o => {
      if (o instanceof Mesh) { o.castShadow = settings.shadows && !/^Environment_(sand|grass|road|paving)$/.test(o.name); o.receiveShadow = settings.shadows; }
    });
  }, [environment, settings.shadows]);
  return <group dispose={null}>
    <primitive object={environment.scene} />
    {trees.map(source => <TreeInstances key={source.uuid} source={source} count={settings.trees} shadows={settings.shadows} active={active} sway={quality === "high" && /crown|leaf/i.test(source.name)} />)}
  </group>;
}
