import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { WORLD_CAMERA } from "./art-direction";
import { ActiveTimeline } from "./active-clock";
import { OrthographicCamera, Vector2 } from "three";

/** SPEC §5.3：入園效果最多 360ms，且不得延後導航。 */
const ENTRY_SECONDS = .36;

export default function CameraRig({ active, entering = false }: { active: boolean; entering?: boolean }) {
  const { camera, size, gl, invalidate } = useThree();
  // 入園推近是 360ms 的真實時間，不是 N 幀。
  const entryTimeline = useMemo(() => new ActiveTimeline(), []);
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
  useEffect(() => {
    if (entering) { entryTimeline.reset(); invalidate(); }
    else entryTimeline.suspend();
  }, [entering, entryTimeline, invalidate]);
  useFrame(() => {
    if (entering && camera instanceof OrthographicCamera) {
      entryTimeline.advance(ENTRY_SECONDS);
      const entry = Math.min(1, entryTimeline.seconds / ENTRY_SECONDS);
      camera.zoom = baseZoom.current * (1 + .065 * entry);
      camera.updateProjectionMatrix(); invalidate();
    }
    if (!active) return;
    offset.current.lerp(target.current, .08);
    camera.position.x = (mobile ? 5 : 7) + offset.current.x;
    camera.position.y = (mobile ? 10.5 : 10) + offset.current.y;
    camera.lookAt(...WORLD_CAMERA.lookAt);
    if (offset.current.distanceToSquared(target.current) > .00001) invalidate();
  });
  return null;
}
