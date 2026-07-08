import { MAP_STAGE } from "@/data/universe-zones";
import { mapDepthZ } from "@/lib/universe-depth";
import type { ResolvedBridge } from "@/lib/universe-map";
import styles from "./UniverseMap.module.css";

type Props = {
  bridges: ResolvedBridge[];
  viewBox: string;
  paused: boolean;
};

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
          {bridge.dashed ? (
            <path
              d={bridge.d}
              fill="none"
              stroke="#c8a979"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="4 22"
              className={styles.dashedBridge}
              opacity={0.7}
            />
          ) : (
            // 開放橋＝黏土棧道：深木底描邊 + 淺木面 + 板縫節奏（R-joy 2）
            <>
              {/* hover 暖光暈：寬圓頭低透明描邊，opacity 由 CSS hover 驅動（免 blur filter） */}
              <path
                d={bridge.d}
                fill="none"
                stroke="#ffe9b3"
                strokeWidth="28"
                strokeLinecap="round"
                className={styles.bridgeGlow}
              />
              <path
                d={bridge.d}
                fill="none"
                stroke="#8a6438"
                strokeWidth="16"
                strokeLinecap="round"
                opacity={0.55}
              />
              <path
                d={bridge.d}
                fill="none"
                stroke="#d9b98a"
                strokeWidth="12"
                strokeLinecap="round"
                className={styles.bridgePlank}
                opacity={0.95}
              />
              <path
                d={bridge.d}
                fill="none"
                stroke="#c8a26e"
                strokeWidth="12"
                strokeLinecap="butt"
                strokeDasharray="3 11"
                opacity={0.7}
              />
            </>
          )}
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
