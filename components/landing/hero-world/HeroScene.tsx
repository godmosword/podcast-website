"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { useWorldAssets } from "./SceneLoader";
import { WORLD_LIGHT } from "./art-direction";
import { QUALITY, type Quality } from "./config";
import World from "./World";
import Vehicle from "./Vehicle";
import CameraRig from "./CameraRig";
import QualityManager from "./QualityManager";
import type { MotionPhase } from "./config";

type Props = { entering?: boolean; onGreeting?: (greeting: boolean) => void; onPhase?: (phase: MotionPhase) => void; active: boolean; quality: Quality; run: number; onReady: () => void; onFailure: () => void; onFinish: () => void; onQuality: (q: Quality) => void };

function Contents(props: Props) {
  const callbacks = useRef(props); callbacks.current = props;
  const failure = useCallback(() => callbacks.current.onFailure(), []);
  const assets = useWorldAssets(failure);
  const gl = useThree(s => s.gl);
  const invalidate = useThree(s => s.invalidate);
  const frames = useRef(0);
  const [sceneReady, setSceneReady] = useState(false);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); failure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, failure]);
  useEffect(() => {
    if (assets) { gl.shadowMap.needsUpdate = true; invalidate(); }
  }, [assets, gl, props.quality, invalidate]);
  useFrame(() => {
    if (assets && frames.current < 2) {
      frames.current++;
      if (frames.current === 2) { setSceneReady(true); callbacks.current.onReady(); }
      else invalidate();
    }
  });
  return <>
    <hemisphereLight args={[WORLD_LIGHT.sky, WORLD_LIGHT.ground, WORLD_LIGHT.fill]} />
    <directionalLight position={WORLD_LIGHT.position} intensity={WORLD_LIGHT.intensity} color={WORLD_LIGHT.key} castShadow={QUALITY[props.quality].shadows}
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7}
      shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={.5} shadow-camera-far={25}
      shadow-bias={-.001} shadow-normalBias={.035} />
    <CameraRig active={props.active} entering={props.entering} />
    <QualityManager active={props.active} quality={props.quality} onQuality={props.onQuality} />
    {assets ? <>
      <World environment={assets.environment} tree={assets.tree} quality={props.quality} active={props.active && sceneReady} />
      <Vehicle asset={assets.vehicle} active={props.active && sceneReady} run={props.run} quality={props.quality} onFinish={props.onFinish} onGreeting={props.onGreeting} onPhase={props.onPhase} />
    </> : null}
  </>;
}
export default function HeroScene(props: Props) {
  return <Canvas orthographic camera={{ position: [7, 10, 12], near: .1, far: 80, zoom: 55 }}
    dpr={QUALITY[props.quality].dpr} frameloop={props.active ? "demand" : "never"}
    shadows={QUALITY[props.quality].shadows ? "soft" : false}
    gl={{ alpha: true, antialias: props.quality === "high", powerPreference: "low-power", toneMapping: ACESFilmicToneMapping }}
    onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.shadowMap.autoUpdate = props.quality === "high"; }}
    fallback={null}>
    <Contents {...props} />
  </Canvas>;
}
