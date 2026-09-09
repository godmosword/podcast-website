import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { WORLD_CAMERA } from "./art-direction";
import { OrthographicCamera, Vector2, Vector3 } from "three";

// 進站的推近改由 CSS transform 完成（見 HeroWorld.module.css）：那是合成器的
// 工作，不需要 WebGL 再畫一輪，路由切換也就不必和算繪搶主執行緒。
export default function CameraRig({ active }: { active: boolean }) {
  const { camera, size, gl, invalidate } = useThree();
  const baseZoom = useRef(55);
  const target = useRef(new Vector2());
  const offset = useRef(new Vector2());
  // 斷點是 state：轉向、iPad 分割畫面與 setViewportSize 都會換 framing，
  // 否則會發生「桌機 framing 配手機 size」而把島的兩端切掉。
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const framing = useMemo(() => (mobile ? WORLD_CAMERA.mobile : WORLD_CAMERA.desktop), [mobile]);
  // 依 framing.pan 把相機與目標一起沿相機自身的 right／up 軸平移，算出這一版
  // 構圖的基準位置與注視點；平行投影下這是平移取景窗，不會改變視角。
  const base = useMemo(() => {
    const position = new Vector3(...framing.position);
    const target = new Vector3(...WORLD_CAMERA.lookAt);
    const forward = new Vector3().subVectors(target, position).normalize();
    const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
    const up = new Vector3().crossVectors(right, forward).normalize();
    const shift = right.multiplyScalar(framing.pan[0]).add(up.multiplyScalar(framing.pan[1]));
    return { position: position.add(shift), target: target.add(shift) };
  }, [framing]);
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    // 手機更正面、略低的視角，避免房子遮住前景車車。
    camera.position.copy(base.position);
    const widthZoom = size.width / framing.width;
    const zoom = framing.fit === "width" ? widthZoom : Math.min(widthZoom, size.height / framing.height);
    camera.zoom = zoom * framing.scale;
    baseZoom.current = camera.zoom;
    camera.lookAt(base.target);
    camera.updateProjectionMatrix(); invalidate();
  }, [camera, size, framing, base, invalidate]);
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
    // 基準值一律取自 art-direction，不再抄一份常數在這裡——抄一份的後果是
    // 改 art-direction 不會反映到實機上，構圖就永遠調不準。
    camera.position.x = base.position.x + offset.current.x;
    camera.position.y = base.position.y + offset.current.y;
    camera.lookAt(base.target);
    if (offset.current.distanceToSquared(target.current) > .00001) invalidate();
  });
  return null;
}
