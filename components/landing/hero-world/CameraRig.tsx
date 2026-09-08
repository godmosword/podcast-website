import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { WORLD_CAMERA } from "./art-direction";
import { OrthographicCamera, Vector2 } from "three";

// 進站的推近改由 CSS transform 完成（見 HeroWorld.module.css）：那是合成器的
// 工作，不需要 WebGL 再畫一輪，路由切換也就不必和算繪搶主執行緒。
export default function CameraRig({ active }: { active: boolean }) {
  const { camera, size, gl, invalidate } = useThree();
  const baseZoom = useRef(55);
  const target = useRef(new Vector2());
  const offset = useRef(new Vector2());
  const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    // 手機更正面、略低的視角，避免房子遮住前景車車。
    const framing = mobile ? WORLD_CAMERA.mobile : WORLD_CAMERA.desktop;
    camera.position.set(...framing.position);
    camera.zoom = Math.min(size.width / framing.width, size.height / framing.height) * framing.scale;
    baseZoom.current = camera.zoom;
    camera.lookAt(...WORLD_CAMERA.lookAt); camera.updateProjectionMatrix(); invalidate();
  }, [camera, size, mobile, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const move = (event: PointerEvent) => {
      if (!active || mobile || event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      target.current.set(((event.clientX - rect.left) / rect.width - .5) * .22, ((event.clientY - rect.top) / rect.height - .5) * .10);
      invalidate();
    };
    const reset = () => { target.current.set(0, 0); invalidate(); };
    canvas.addEventListener("pointermove", move, { passive: true }); canvas.addEventListener("pointerleave", reset);
    return () => { canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", reset); };
  }, [gl, active, mobile, invalidate]);
  useFrame(() => {
    if (!active) return;
    offset.current.lerp(target.current, .08);
    camera.position.x = (mobile ? 5 : 7) + offset.current.x;
    camera.position.y = (mobile ? 10.5 : 10) + offset.current.y;
    camera.lookAt(...WORLD_CAMERA.lookAt);
    if (offset.current.distanceToSquared(target.current) > .00001) invalidate();
  });
  return null;
}
