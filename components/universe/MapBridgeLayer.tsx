import { MAP_STAGE } from "@/data/universe-zones";
import { mapDepthZ } from "@/lib/universe-depth";
import type { ResolvedBridge } from "@/lib/universe-map";
import styles from "./UniverseMap.module.css";

type Props = {
  bridges: ResolvedBridge[];
  viewBox: string;
  paused: boolean;
};

/**
 * 黏土棧道：奶油外暈＋深木底＋淺木面＋板縫節奏。
 * muted＝連到 coming/planned 島時略淡，仍為實橋（非虛線）。
 */
function ClayBridge({ d, muted }: { d: string; muted: boolean }) {
  const shadowOpacity = muted ? 0.1 : 0.16;
  const glowOpacity = muted ? 0.28 : 0.48;
  const baseOpacity = muted ? 0.42 : 0.62;
  const faceOpacity = muted ? 0.7 : 0.95;
  const seamOpacity = muted ? 0.4 : 0.65;
  const railOpacity = muted ? 0.35 : 0.55;
  return (
    <>
      {/* v6 水面投影：往下位移一點的寬圓頭低透明描邊，讓棧道落在海面上而不是漂著。
          沿用本層既有立場——不用 blur filter，寬圓頭低透明描邊本身就讀作柔影，最省 GPU。
          寬度／位移刻意讓它探出外暈（30/2=15）之外，否則會被外暈整條蓋掉。 */}
      <path
        d={d}
        fill="none"
        stroke="#3f5d78"
        strokeWidth="24"
        strokeLinecap="round"
        transform="translate(0, 7)"
        opacity={shadowOpacity}
      />
      <path
        d={d}
        fill="none"
        stroke="#ffe9b3"
        strokeWidth="30"
        strokeLinecap="round"
        className={styles.bridgeGlow}
        opacity={glowOpacity}
      />
      <path
        d={d}
        fill="none"
        stroke="#8a6438"
        strokeWidth="16"
        strokeLinecap="round"
        opacity={baseOpacity}
      />
      <path
        d={d}
        fill="none"
        stroke="#e8c890"
        strokeWidth="12"
        strokeLinecap="round"
        className={styles.bridgePlank}
        opacity={faceOpacity}
      />
      <path
        d={d}
        fill="none"
        stroke="#c8a26e"
        strokeWidth="12"
        strokeLinecap="butt"
        strokeDasharray="3 11"
        opacity={seamOpacity}
      />
      {/* 兩側細欄杆：黏土棧道輪廓 */}
      <path
        d={d}
        fill="none"
        stroke="#b88955"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 18"
        opacity={railOpacity}
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
          <ClayBridge d={bridge.d} muted={bridge.dashed} />
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
