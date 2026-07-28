import { MAP_STAGE } from "@/data/universe-zones";
import { mapDepthZ } from "@/lib/universe-depth";
import type { ResolvedBridge } from "@/lib/universe-map";
import styles from "./UniverseMap.module.css";

type Props = {
  bridges: ResolvedBridge[];
  viewBox: string;
  paused: boolean;
};

/** 淺色黏土棧道（開放／未開放島共用；虛線改實橋但更淡）。 */
function BridgePlanks({ d, muted }: { d: string; muted: boolean }) {
  const faceOpacity = muted ? 0.55 : 0.78;
  const baseOpacity = muted ? 0.28 : 0.38;
  const seamOpacity = muted ? 0.35 : 0.45;
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke="#f3e6c8"
        strokeWidth="26"
        strokeLinecap="round"
        className={styles.bridgeGlow}
        opacity={muted ? 0.25 : 0.4}
      />
      <path
        d={d}
        fill="none"
        stroke="#c4a574"
        strokeWidth="14"
        strokeLinecap="round"
        opacity={baseOpacity}
      />
      <path
        d={d}
        fill="none"
        stroke="#e8d4a8"
        strokeWidth="10"
        strokeLinecap="round"
        className={styles.bridgePlank}
        opacity={faceOpacity}
      />
      <path
        d={d}
        fill="none"
        stroke="#d4bc8a"
        strokeWidth="10"
        strokeLinecap="butt"
        strokeDasharray="3 11"
        opacity={seamOpacity}
      />
    </>
  );
}

export default function MapBridgeLayer({ bridges, viewBox, paused }: Props) {
  return (
    <>
      {bridges.map((bridge) => (
        <svg
          key={bridge.id}
          className={[styles.bridgeSvg, paused ? styles.paused : ""]
            .filter(Boolean)
            .join(" ")}
          viewBox={viewBox}
          width={MAP_STAGE.width}
          height={MAP_STAGE.height}
          style={{ zIndex: mapDepthZ(bridge.depthY, "bridge") }}
          aria-hidden="true"
          focusable="false"
        >
          <BridgePlanks d={bridge.d} muted={bridge.dashed} />
          {/* hover 命中層：寬透明描邊承接滑鼠；svg 本身維持 pointer-events:none，
              事件照常冒泡給 viewport，pan/zoom 不受影響 */}
          <path
            d={bridge.d}
            fill="none"
            stroke="transparent"
            strokeWidth="34"
            strokeLinecap="round"
            className={styles.bridgeHit}
          />
        </svg>
      ))}
    </>
  );
}
