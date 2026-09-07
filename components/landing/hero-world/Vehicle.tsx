import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AnimationMixer, Group } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { ARRIVAL_SECONDS, ROAD_START_ANGLE, driveProgress, greetingPose, motionPhase, wheelAnimationTime, type MotionPhase, type Quality } from "./config";

export default function Vehicle({ asset, active, run, quality, onFinish, onGreeting, onPhase }: {
  asset: GLTF; active: boolean; run: number; quality: Quality; onFinish: () => void; onGreeting?: (greeting: boolean) => void; onPhase?: (phase: MotionPhase) => void;
}) {
  const greeted = useRef(false);
  const qaTimeEnabled = useRef(typeof window !== "undefined" && new URLSearchParams(window.location.search).has("heroQa"));
  const group = useRef<Group>(null);
  const body = useMemo(() => asset.scene.getObjectByName("Body"), [asset]);
  const driveDuration = useMemo(() => asset.animations.find(clip => clip.name === "Drive")?.duration ?? 2, [asset]);
  const elapsed = useRef(0);
  const completed = useRef(false);
  const phase = useRef<MotionPhase>("approach");
  const invalidate = useThree(s => s.invalidate);
  const mixer = useMemo(() => new AnimationMixer(asset.scene), [asset]);
  useEffect(() => {
    asset.animations.forEach(clip => mixer.clipAction(clip).play());
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(asset.scene); };
  }, [asset, mixer]);
  useEffect(() => { elapsed.current = 0; completed.current = false; invalidate(); }, [run, invalidate]);
  useEffect(() => { if (active) invalidate(); }, [active, invalidate]);
  useFrame((_, delta) => {
    if (!group.current) return;
    const forcedTime = qaTimeEnabled.current
      ? (window as Window & { __HERO_WORLD_QA_TIME?: number }).__HERO_WORLD_QA_TIME
      : undefined;
    if (typeof forcedTime === "number" && Number.isFinite(forcedTime)) elapsed.current = Math.min(ARRIVAL_SECONDS, Math.max(0, forcedTime));
    else if (active && !completed.current && quality !== "low") elapsed.current = Math.min(ARRIVAL_SECONDS, elapsed.current + Math.min(delta, .05));
    const progress = driveProgress(elapsed.current);
    // Arrive at the forecourt with both eyes visible, preserving the timing.
    const angle = ROAD_START_ANGLE + progress * Math.PI * 2;
    const pose = greetingPose(elapsed.current);
    const nextPhase = motionPhase(elapsed.current);
    if (phase.current !== nextPhase) { phase.current = nextPhase; onPhase?.(nextPhase); }
    // The root and wheels follow the road. Suspension is applied only to the
    // Body node so the four wheel origins remain grounded throughout settle.
    group.current.position.set(3.98 * Math.sin(angle), .27, 2.48 * Math.cos(angle));
    group.current.rotation.y = Math.atan2(3.98 * Math.cos(angle), -2.48 * Math.sin(angle)) + pose.look;
    group.current.rotation.z = 0;
    if (body) {
      body.position.y = pose.settle;
      body.rotation.z = pose.settle * .35;
    }
    if (greeted.current !== pose.greeting) { greeted.current = pose.greeting; onGreeting?.(pose.greeting); }
    mixer.setTime(wheelAnimationTime(progress, driveDuration));
    if (elapsed.current >= ARRIVAL_SECONDS || quality === "low") {
      if (!completed.current) { completed.current = true; onFinish(); }
    } else if (active) invalidate();
  });
  return <group ref={group}>
    <primitive object={asset.scene} dispose={null} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.012, 0]} scale={[1.45, 1.65, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial transparent depthWrite={false}
        vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
        fragmentShader="varying vec2 vUv; void main(){float d=length((vUv-.5)*2.0);gl_FragColor=vec4(.17,.12,.085,.22*(1.0-smoothstep(.15,1.0,d)));}" />
    </mesh>
  </group>;
}
