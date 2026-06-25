import { useId } from "react";
import type { CSSProperties } from "react";
import type { GameMeta } from "@/data/games";
import {
  ClayBlob,
  ClayCar,
  ClayCircle,
  ClayGrad,
  ClayScene,
  clayIds,
} from "@/lib/games/clay-svg";

type Props = {
  gameId: GameMeta["slug"];
  className?: string;
  style?: CSSProperties;
};

/**
 * 遊樂園卡片縮圖：黏土風 mini 場景 SVG（柔光、圓角、高光）。
 */
export default function GameThumbArt({ gameId, className, style }: Props) {
  const uid = useId().replace(/:/g, "");
  const sh = clayIds(uid, "sh");

  const common = {
    viewBox: "0 0 120 90",
    className,
    style,
    role: "img" as const,
    "aria-hidden": true,
    focusable: "false" as const,
  };

  switch (gameId) {
    case "car-adventure":
      return (
        <svg {...common}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad
                  id={clayIds(uid, "sky")}
                  light="#b8e8ff"
                  mid="#8fd3ff"
                  dark="#6eb8e8"
                />
                <ClayGrad
                  id={clayIds(uid, "cloud")}
                  light="#fff"
                  mid="#f8fcff"
                  dark="#e8f4ff"
                />
                <ClayGrad
                  id={clayIds(uid, "dirt")}
                  light="#9a7050"
                  mid="#7a5230"
                  dark="#5c3d22"
                />
                <ClayGrad
                  id={clayIds(uid, "grass")}
                  light="#7fd87f"
                  mid="#5fc15f"
                  dark="#4aa84a"
                />
                <ClayGrad
                  id={clayIds(uid, "hero")}
                  light="#ffe566"
                  mid="#ffd23f"
                  dark="#e8b82a"
                />
                <ClayGrad
                  id={clayIds(uid, "enemy")}
                  light="#ff8a8a"
                  mid="#ff6b6b"
                  dark="#e04545"
                />
                <ClayGrad
                  id={clayIds(uid, "coin")}
                  light="#ffe566"
                  mid="#ffc107"
                  dark="#e8a800"
                />
                <ClayGrad
                  id={clayIds(uid, "win")}
                  light="#dff6ff"
                  mid="#b8e8ff"
                  dark="#8fcde8"
                />
              </>
            }
          >
            <rect width="120" height="90" rx="12" fill={`url(#${clayIds(uid, "sky")})`} />
            <ClayBlob
              x={14}
              y={16}
              w={34}
              h={14}
              r={7}
              gradId={clayIds(uid, "cloud")}
              shadowId={sh}
              highlight={false}
            />
            <ClayBlob
              x={72}
              y={10}
              w={28}
              h={12}
              r={6}
              gradId={clayIds(uid, "cloud")}
              shadowId={sh}
              highlight={false}
            />
            <ClayBlob
              x={0}
              y={68}
              w={48}
              h={14}
              r={5}
              gradId={clayIds(uid, "dirt")}
              shadowId={sh}
            />
            <ClayBlob
              x={0}
              y={68}
              w={48}
              h={5}
              r={3}
              gradId={clayIds(uid, "grass")}
              shadowId={sh}
            />
            <ClayBlob
              x={54}
              y={58}
              w={28}
              h={10}
              r={4}
              gradId={clayIds(uid, "dirt")}
              shadowId={sh}
            />
            <ClayBlob
              x={54}
              y={58}
              w={28}
              h={4}
              r={2}
              gradId={clayIds(uid, "grass")}
              shadowId={sh}
            />
            <ClayBlob
              x={92}
              y={52}
              w={24}
              h={26}
              r={4}
              gradId={clayIds(uid, "dirt")}
              shadowId={sh}
            />
            <ClayBlob
              x={92}
              y={52}
              w={24}
              h={5}
              r={2}
              gradId={clayIds(uid, "grass")}
              shadowId={sh}
            />
            <ClayBlob
              x={102}
              y={46}
              w={5}
              h={32}
              r={2}
              gradId={clayIds(uid, "dirt")}
              shadowId={sh}
              highlight={false}
            />
            <ClayBlob x={106} y={48} w={8} h={8} r={2} gradId={clayIds(uid, "cloud")} shadowId={sh} />
            <ClayBlob x={114} y={48} w={8} h={8} r={2} gradId={clayIds(uid, "enemy")} shadowId={sh} />
            <ClayBlob x={106} y={56} w={8} h={8} r={2} gradId={clayIds(uid, "enemy")} shadowId={sh} />
            <ClayBlob x={114} y={56} w={8} h={8} r={2} gradId={clayIds(uid, "cloud")} shadowId={sh} />
            <ClayCircle cx={70} cy={50} r={5} gradId={clayIds(uid, "coin")} shadowId={sh} />
            <ClayCircle cx={82} cy={46} r={4.5} gradId={clayIds(uid, "coin")} shadowId={sh} />
            <ClayCar
              x={28}
              y={44}
              bodyGrad={clayIds(uid, "hero")}
              roofGrad={clayIds(uid, "hero")}
              windowGrad={clayIds(uid, "win")}
              shadowId={sh}
            />
            <ClayCar
              x={58}
              y={48}
              bodyGrad={clayIds(uid, "enemy")}
              roofGrad={clayIds(uid, "enemy")}
              windowGrad={clayIds(uid, "win")}
              shadowId={sh}
              scale={0.82}
            />
          </ClayScene>
        </svg>
      );

    case "block-drop":
      return (
        <svg {...common}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad
                  id={clayIds(uid, "bg")}
                  light="#f8faff"
                  mid="#f0f4ff"
                  dark="#e2e8f5"
                />
                <ClayGrad
                  id={clayIds(uid, "frame")}
                  light="#3a4258"
                  mid="#1a1f35"
                  dark="#0f1220"
                />
                <ClayGrad
                  id={clayIds(uid, "c1")}
                  light="#8ee4ff"
                  mid="#5bd0ff"
                  dark="#2f9fe0"
                />
                <ClayGrad
                  id={clayIds(uid, "c2")}
                  light="#ffe566"
                  mid="#ffd866"
                  dark="#e8b82a"
                />
                <ClayGrad
                  id={clayIds(uid, "c3")}
                  light="#ffc8dc"
                  mid="#f7a8c4"
                  dark="#e8789c"
                />
                <ClayGrad
                  id={clayIds(uid, "c4")}
                  light="#d4f0bc"
                  mid="#b7df9b"
                  dark="#8fc872"
                />
                <ClayGrad
                  id={clayIds(uid, "c5")}
                  light="#ddd0f5"
                  mid="#c5b3e6"
                  dark="#a892d4"
                />
                <ClayGrad
                  id={clayIds(uid, "c6")}
                  light="#ffc89a"
                  mid="#ff9f68"
                  dark="#e87840"
                />
              </>
            }
          >
            <rect width="120" height="90" rx="12" fill={`url(#${clayIds(uid, "bg")})`} />
            <ClayBlob
              x={26}
              y={10}
              w={68}
              h={70}
              r={10}
              gradId={clayIds(uid, "frame")}
              shadowId={sh}
              highlight={false}
            />
            <rect x={30} y={14} width={60} height={62} rx={7} fill="#12182a" />
            {(
              [
                [clayIds(uid, "c4"), 36, 54],
                [clayIds(uid, "c5"), 52, 54],
                [clayIds(uid, "c3"), 68, 54],
                [clayIds(uid, "c1"), 44, 38],
                [clayIds(uid, "c2"), 60, 38],
                [clayIds(uid, "c6"), 52, 22],
              ] as const
            ).map(([grad, x, y]) => (
              <ClayBlob
                key={`${grad}-${x}`}
                x={x}
                y={y}
                w={14}
                h={14}
                r={4}
                gradId={grad}
                shadowId={sh}
              />
            ))}
          </ClayScene>
        </svg>
      );

    case "candy-match":
      return (
        <svg {...common}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad
                  id={clayIds(uid, "bg")}
                  light="#fff5fa"
                  mid="#ffeaf3"
                  dark="#fbd7e7"
                />
                <ClayGrad
                  id={clayIds(uid, "tile1")}
                  light="#ffc8dc"
                  mid="#ffb4cf"
                  dark="#e8789c"
                />
                <ClayGrad
                  id={clayIds(uid, "tile2")}
                  light="#fff3b8"
                  mid="#ffe16f"
                  dark="#e0b13d"
                />
                <ClayGrad
                  id={clayIds(uid, "tile3")}
                  light="#cfeefe"
                  mid="#8ddff0"
                  dark="#4fb3d4"
                />
                <ClayGrad
                  id={clayIds(uid, "tile4")}
                  light="#cdf3dd"
                  mid="#9de7b8"
                  dark="#5fbf85"
                />
                <ClayGrad
                  id={clayIds(uid, "tile5")}
                  light="#e4d6ff"
                  mid="#c9a8ff"
                  dark="#8f6ad4"
                />
              </>
            }
          >
            <rect width="120" height="90" rx="12" fill={`url(#${clayIds(uid, "bg")})`} />
            {(
              [
                // 3x3 消除盤，中央列三連（粉紅）
                ["tile2", 24, 12], ["tile3", 52, 12], ["tile5", 80, 12],
                ["tile1", 24, 38], ["tile1", 52, 38], ["tile1", 80, 38],
                ["tile4", 24, 64], ["tile2", 52, 64], ["tile3", 80, 64],
              ] as const
            ).map(([grad, x, y], i) => (
              <ClayBlob
                key={i}
                x={x}
                y={y}
                w={22}
                h={22}
                r={7}
                gradId={clayIds(uid, grad)}
                shadowId={sh}
              />
            ))}
            {/* 中央三連的閃亮 */}
            <ClayCircle cx={36} cy={36} r={3} gradId={clayIds(uid, "tile2")} shadowId={sh} />
            <ClayCircle cx={94} cy={34} r={2.6} gradId={clayIds(uid, "tile2")} shadowId={sh} />
            {/* 三連格上的笑臉 */}
            {[35, 63, 91].map((cx) => (
              <g key={cx}>
                <circle cx={cx - 4} cy={47} r={1.6} fill="#4a3a52" />
                <circle cx={cx + 4} cy={47} r={1.6} fill="#4a3a52" />
                <path
                  d={`M${cx - 3.5} 51c2.2 1.8 4.8 1.8 7 0`}
                  stroke="#4a3a52"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ))}
          </ClayScene>
        </svg>
      );

    case "candy-kart":
      return (
        <svg {...common}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad
                  id={clayIds(uid, "sky")}
                  light="#fff3f9"
                  mid="#ffe4f0"
                  dark="#f7c8de"
                />
                <ClayGrad
                  id={clayIds(uid, "road")}
                  light="#ffe9d6"
                  mid="#ffd9b8"
                  dark="#eebd92"
                />
                <ClayGrad
                  id={clayIds(uid, "stripe")}
                  light="#fff"
                  mid="#fff4fa"
                  dark="#ffd9ea"
                />
                <ClayGrad
                  id={clayIds(uid, "hill")}
                  light="#cdf3dd"
                  mid="#b9f3db"
                  dark="#8fd9b6"
                />
                <ClayGrad
                  id={clayIds(uid, "kart")}
                  light="#ffc8dc"
                  mid="#ffb4cf"
                  dark="#e8789c"
                />
                <ClayGrad
                  id={clayIds(uid, "rival")}
                  light="#cfe2ff"
                  mid="#9dbbff"
                  dark="#7591e0"
                />
                <ClayGrad
                  id={clayIds(uid, "star")}
                  light="#fff3b8"
                  mid="#ffe889"
                  dark="#f0b429"
                />
                <ClayGrad
                  id={clayIds(uid, "win")}
                  light="#ffffff"
                  mid="#ecf7ff"
                  dark="#bde7ff"
                />
              </>
            }
          >
            <rect width="120" height="90" rx="12" fill={`url(#${clayIds(uid, "sky")})`} />
            <ClayBlob
              x={-6}
              y={34}
              w={56}
              h={26}
              r={13}
              gradId={clayIds(uid, "hill")}
              shadowId={sh}
              highlight={false}
            />
            <ClayBlob
              x={76}
              y={30}
              w={52}
              h={30}
              r={15}
              gradId={clayIds(uid, "hill")}
              shadowId={sh}
              highlight={false}
            />
            <ClayBlob
              x={0}
              y={52}
              w={120}
              h={38}
              r={10}
              gradId={clayIds(uid, "road")}
              shadowId={sh}
              highlight={false}
            />
            <ClayBlob
              x={8}
              y={68}
              w={14}
              h={4}
              r={2}
              gradId={clayIds(uid, "stripe")}
              shadowId={sh}
              highlight={false}
            />
            <ClayBlob
              x={50}
              y={68}
              w={14}
              h={4}
              r={2}
              gradId={clayIds(uid, "stripe")}
              shadowId={sh}
              highlight={false}
            />
            <ClayBlob
              x={94}
              y={68}
              w={14}
              h={4}
              r={2}
              gradId={clayIds(uid, "stripe")}
              shadowId={sh}
              highlight={false}
            />
            <ClayCircle cx={28} cy={26} r={6} gradId={clayIds(uid, "star")} shadowId={sh} />
            <ClayCircle cx={96} cy={18} r={4.5} gradId={clayIds(uid, "star")} shadowId={sh} />
            <ClayCar
              x={64}
              y={42}
              bodyGrad={clayIds(uid, "rival")}
              roofGrad={clayIds(uid, "rival")}
              windowGrad={clayIds(uid, "win")}
              shadowId={sh}
              scale={0.78}
            />
            <ClayCar
              x={26}
              y={48}
              bodyGrad={clayIds(uid, "kart")}
              roofGrad={clayIds(uid, "kart")}
              windowGrad={clayIds(uid, "win")}
              shadowId={sh}
            />
          </ClayScene>
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <rect width="120" height="90" rx="12" fill="var(--sky-2)" />
        </svg>
      );
  }
}
