import { useId } from "react";
import type { CSSProperties } from "react";
import type { GameCatalogEntry } from "@/lib/games/catalog";
import {
  ClayBlob,
  ClayCar,
  ClayCircle,
  ClayGrad,
  ClayScene,
  ClayStar,
  clayIds,
} from "@/lib/games/clay-svg";

type Props = {
  gameId: GameCatalogEntry["id"];
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
    case "car-star":
      return (
        <svg {...common}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad
                  id={clayIds(uid, "sky")}
                  light="#ebe4ff"
                  mid="#dcd0f5"
                  dark="#c5b3e6"
                />
                <ClayGrad
                  id={clayIds(uid, "road")}
                  light="#a8927a"
                  mid="#8d857b"
                  dark="#6e655c"
                />
                <ClayGrad
                  id={clayIds(uid, "body")}
                  light="#ffe566"
                  mid="#ffd866"
                  dark="#e8b82a"
                />
                <ClayGrad
                  id={clayIds(uid, "roof")}
                  light="#b8e8ff"
                  mid="#8fcde8"
                  dark="#6eb8d4"
                />
                <ClayGrad
                  id={clayIds(uid, "win")}
                  light="#dff6ff"
                  mid="#b8e8ff"
                  dark="#8fcde8"
                />
                <ClayGrad
                  id={clayIds(uid, "star")}
                  light="#fff3a8"
                  mid="#ffd866"
                  dark="#e8b82a"
                />
              </>
            }
          >
            <rect width="120" height="90" rx="12" fill={`url(#${clayIds(uid, "sky")})`} />
            <ellipse cx="60" cy="82" rx="46" ry="7" fill="rgba(61,48,40,0.1)" />
            <ClayBlob
              x={6}
              y={62}
              w={108}
              h={14}
              r={7}
              gradId={clayIds(uid, "road")}
              shadowId={sh}
            />
            <ClayCar
              x={32}
              y={38}
              bodyGrad={clayIds(uid, "body")}
              roofGrad={clayIds(uid, "roof")}
              windowGrad={clayIds(uid, "win")}
              shadowId={sh}
            />
            <ClayStar cx={22} cy={26} size={9} gradId={clayIds(uid, "star")} shadowId={sh} />
            <ClayStar cx={52} cy={18} size={7} gradId={clayIds(uid, "star")} shadowId={sh} />
            <ClayStar cx={78} cy={24} size={8} gradId={clayIds(uid, "star")} shadowId={sh} />
            <ClayStar cx={98} cy={30} size={6} gradId={clayIds(uid, "star")} shadowId={sh} />
            <ClayCircle
              cx={94}
              cy={14}
              r={8}
              gradId={clayIds(uid, "star")}
              shadowId={sh}
            />
          </ClayScene>
        </svg>
      );

    case "car-mission":
      return (
        <svg {...common}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad
                  id={clayIds(uid, "night")}
                  light="#3d5a80"
                  mid="#2d4a6e"
                  dark="#1a2744"
                />
                <ClayGrad
                  id={clayIds(uid, "moon")}
                  light="#fffef5"
                  mid="#fff8dc"
                  dark="#f0e6b8"
                />
                <ClayGrad
                  id={clayIds(uid, "truck")}
                  light="#d4f0bc"
                  mid="#b7df9b"
                  dark="#8fc872"
                />
                <ClayGrad
                  id={clayIds(uid, "win")}
                  light="#dff6ff"
                  mid="#b8e8ff"
                  dark="#8fcde8"
                />
                <ClayGrad
                  id={clayIds(uid, "glow")}
                  light="#f4ffb8"
                  mid="#e8ff9a"
                  dark="#c8e86a"
                />
                <ClayGrad
                  id={clayIds(uid, "path")}
                  light="#9a9088"
                  mid="#7a7268"
                  dark="#5a534c"
                />
              </>
            }
          >
            <rect width="120" height="90" rx="12" fill={`url(#${clayIds(uid, "night")})`} />
            <ClayCircle
              cx={96}
              cy={18}
              r={11}
              gradId={clayIds(uid, "moon")}
              shadowId={sh}
            />
            {[
              [24, 34],
              [50, 26],
              [72, 38],
              [88, 30],
              [38, 48],
            ].map(([x, y]) => (
              <ClayCircle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r={3.2}
                gradId={clayIds(uid, "glow")}
                shadowId={sh}
              />
            ))}
            <ClayBlob
              x={8}
              y={60}
              w={104}
              h={12}
              r={6}
              gradId={clayIds(uid, "path")}
              shadowId={sh}
            />
            <ClayCar
              x={36}
              y={36}
              bodyGrad={clayIds(uid, "truck")}
              roofGrad={clayIds(uid, "truck")}
              windowGrad={clayIds(uid, "win")}
              shadowId={sh}
              scale={1.08}
            />
          </ClayScene>
        </svg>
      );

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

    default:
      return (
        <svg {...common}>
          <rect width="120" height="90" rx="12" fill="var(--sky-2)" />
        </svg>
      );
  }
}
