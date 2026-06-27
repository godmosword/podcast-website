import { MAP_STAGE } from "@/data/universe-zones";
import { FLY_DURATION_MS } from "./useMapCamera";
import styles from "./UniverseMapParallax.module.css";

/** 視差係數：背景層跟隨鏡頭位移的比例（越小越「遠」）。 */
const PARALLAX = 0.38;

type Props = {
  tx: number;
  ty: number;
  scale: number;
  isAnimating: boolean;
  reduced: boolean;
};

/** R2：遠景雲層 + 丘陵，以較慢速率跟隨 pan/zoom。 */
export default function UniverseMapParallax({
  tx,
  ty,
  scale,
  isAnimating,
  reduced,
}: Props) {
  const factor = reduced ? 1 : PARALLAX;
  const pScale = reduced ? scale : 1 + (scale - 1) * 0.18;
  const transform = `translate(${tx * factor}px, ${ty * factor}px) scale(${pScale})`;

  return (
    <div
      className={styles.layer}
      aria-hidden="true"
      style={{
        width: MAP_STAGE.width,
        height: MAP_STAGE.height,
        transform,
        transition: isAnimating
          ? `transform ${FLY_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
          : "none",
      }}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${MAP_STAGE.width} ${MAP_STAGE.height}`}
        width={MAP_STAGE.width}
        height={MAP_STAGE.height}
        focusable="false"
      >
        {/* 遠景丘陵（略降避免變成髒斑） */}
        <ellipse cx="180" cy="120" rx="200" ry="48" fill="#b8dcc8" opacity="0.42" />
        <ellipse cx="780" cy="100" rx="240" ry="52" fill="#a8d4c0" opacity="0.38" />
        <ellipse cx="520" cy="640" rx="280" ry="44" fill="#c8e0d0" opacity="0.34" />

        {/* 雲朵（主體較實 + 多顆小橢圓做蓬鬆輪廓） */}
        <g fill="#fff" opacity="0.85">
          <ellipse cx="120" cy="88" rx="52" ry="22" />
          <ellipse cx="155" cy="82" rx="38" ry="18" />
          <ellipse cx="90" cy="82" rx="32" ry="16" />
          <ellipse cx="138" cy="94" rx="28" ry="13" />
        </g>
        <g fill="#fff" opacity="0.8">
          <ellipse cx="420" cy="56" rx="64" ry="26" />
          <ellipse cx="468" cy="50" rx="44" ry="20" />
          <ellipse cx="378" cy="50" rx="36" ry="18" />
          <ellipse cx="440" cy="64" rx="34" ry="15" />
        </g>
        <g fill="#fff" opacity="0.82">
          <ellipse cx="860" cy="72" rx="58" ry="24" />
          <ellipse cx="905" cy="66" rx="40" ry="18" />
          <ellipse cx="820" cy="66" rx="34" ry="16" />
          <ellipse cx="876" cy="80" rx="30" ry="14" />
        </g>
        <g fill="#fff" opacity="0.7">
          <ellipse cx="680" cy="180" rx="48" ry="20" />
          <ellipse cx="715" cy="175" rx="34" ry="16" />
          <ellipse cx="654" cy="186" rx="26" ry="12" />
        </g>
        <g fill="#fff" opacity="0.62">
          <ellipse cx="240" cy="520" rx="70" ry="28" />
          <ellipse cx="290" cy="512" rx="48" ry="22" />
          <ellipse cx="208" cy="528" rx="34" ry="15" />
        </g>
      </svg>
    </div>
  );
}
