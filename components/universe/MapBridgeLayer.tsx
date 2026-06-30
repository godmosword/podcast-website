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
          <path
            d={bridge.d}
            fill="none"
            stroke="#c8a979"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={bridge.dashed ? "4 22" : undefined}
            className={bridge.dashed ? styles.dashedBridge : undefined}
            opacity={bridge.dashed ? 0.7 : 0.95}
          />
        </svg>
      ))}
    </>
  );
}
