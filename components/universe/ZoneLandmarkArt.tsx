import { useId } from "react";
import type { ZoneId, ZoneStatus } from "@/data/universe-zones";
import {
  ClayBlob,
  ClayCar,
  ClayCircle,
  ClayGrad,
  ClayScene,
  clayIds,
} from "@/lib/games/clay-svg";

type Props = {
  zoneId: ZoneId;
  status?: ZoneStatus;
  className?: string;
};

const common = {
  viewBox: "0 0 96 96",
  role: "img" as const,
  "aria-hidden": true,
  focusable: "false" as const,
};

/** R1：各島黏土風地標 SVG（取代 R0 emoji 佔位）。 */
export default function ZoneLandmarkArt({ zoneId, status = "open", className }: Props) {
  const uid = useId().replace(/:/g, "");
  const sh = clayIds(uid, "sh");
  const dimmed = status === "planned" ? 0.82 : status === "coming" ? 0.9 : 1;

  const svgProps = {
    ...common,
    className,
    style: dimmed < 1 ? { opacity: dimmed } : undefined,
  };

  switch (zoneId) {
    case "car-park":
      return (
        <svg {...svgProps}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad id={clayIds(uid, "sky")} light="#dff4ff" mid="#b8e4ff" dark="#8eccef" />
                <ClayGrad id={clayIds(uid, "wheel")} light="#ffe08a" mid="#ffc94d" dark="#e8a820" />
                <ClayGrad id={clayIds(uid, "spoke")} light="#fff5e0" mid="#f0dcc0" dark="#d4b890" />
                <ClayGrad id={clayIds(uid, "cabin")} light="#ffb8c8" mid="#ff8fab" dark="#e86a8a" />
                <ClayGrad id={clayIds(uid, "cabin2")} light="#b8e8ff" mid="#7ec8f0" dark="#5aa8d8" />
                <ClayGrad id={clayIds(uid, "cabin3")} light="#c8f0b8" mid="#98d878" dark="#78b858" />
                <ClayGrad id={clayIds(uid, "base")} light="#f5e8c8" mid="#e8c890" dark="#c8a870" />
              </>
            }
          >
            <ClayBlob x={8} y={68} w={80} h={18} r={9} gradId={clayIds(uid, "base")} shadowId={sh} />
            <ClayCircle cx={48} cy={42} r={28} gradId={clayIds(uid, "wheel")} shadowId={sh} />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                x1={48}
                y1={42}
                x2={48 + Math.cos((deg * Math.PI) / 180) * 24}
                y2={42 + Math.sin((deg * Math.PI) / 180) * 24}
                stroke={`url(#${clayIds(uid, "spoke")})`}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))}
            <ClayCircle cx={48} cy={18} r={7} gradId={clayIds(uid, "cabin")} shadowId={sh} />
            <ClayCircle cx={72} cy={42} r={7} gradId={clayIds(uid, "cabin2")} shadowId={sh} />
            <ClayCircle cx={48} cy={66} r={7} gradId={clayIds(uid, "cabin3")} shadowId={sh} />
            <ClayCircle cx={24} cy={42} r={7} gradId={clayIds(uid, "cabin")} shadowId={sh} />
            <ClayCircle cx={62} cy={24} r={6} gradId={clayIds(uid, "cabin2")} shadowId={sh} />
            <ClayCircle cx={34} cy={24} r={6} gradId={clayIds(uid, "cabin3")} shadowId={sh} />
          </ClayScene>
        </svg>
      );

    case "dino":
      return (
        <svg {...svgProps}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad id={clayIds(uid, "body")} light="#98e878" mid="#68c848" dark="#489828" />
                <ClayGrad id={clayIds(uid, "belly")} light="#c8f0a8" mid="#a8d888" dark="#88b868" />
                <ClayGrad id={clayIds(uid, "spot")} light="#78c858" mid="#58a838" dark="#408820" />
                <ClayGrad id={clayIds(uid, "eye")} light="#fff" mid="#f0f0f0" dark="#d0d0d0" />
                <ClayGrad id={clayIds(uid, "ground")} light="#e8d8a8" mid="#d0b878" dark="#b09858" />
              </>
            }
          >
            <ClayBlob x={6} y={72} w={84} h={14} r={7} gradId={clayIds(uid, "ground")} shadowId={sh} />
            <ellipse cx={52} cy={50} rx={28} ry={22} fill={`url(#${clayIds(uid, "body")})`} filter={`url(#${sh})`} />
            <ellipse cx={58} cy={54} rx={18} ry={14} fill={`url(#${clayIds(uid, "belly")})`} />
            <ellipse cx={76} cy={38} rx={14} ry={16} fill={`url(#${clayIds(uid, "body")})`} filter={`url(#${sh})`} />
            <circle cx={82} cy={32} r={5} fill={`url(#${clayIds(uid, "eye")})`} />
            <circle cx={84} cy={31} r={2} fill="#2a2a2a" />
            <path
              d="M 28 44 Q 18 36 14 28 Q 12 22 18 20 Q 24 18 28 26 Z"
              fill={`url(#${clayIds(uid, "body")})`}
              filter={`url(#${sh})`}
            />
            <path
              d="M 34 62 L 30 78 L 38 78 Z"
              fill={`url(#${clayIds(uid, "body")})`}
              filter={`url(#${sh})`}
            />
            <path
              d="M 52 62 L 48 78 L 56 78 Z"
              fill={`url(#${clayIds(uid, "body")})`}
              filter={`url(#${sh})`}
            />
            <circle cx={44} cy={46} r={4} fill={`url(#${clayIds(uid, "spot")})`} opacity={0.7} />
            <circle cx={56} cy={42} r={3} fill={`url(#${clayIds(uid, "spot")})`} opacity={0.6} />
            {status === "building" ? (
              <g opacity={0.85}>
                <ClayBlob x={62} y={8} w={8} h={28} r={3} gradId={clayIds(uid, "spot")} shadowId={sh} />
                <rect x={58} y={12} width={16} height={4} rx={2} fill="#f0c040" />
              </g>
            ) : null}
          </ClayScene>
        </svg>
      );

    case "rescue":
      return (
        <svg {...svgProps}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad id={clayIds(uid, "body")} light="#ff9a9a" mid="#ff6b6b" dark="#e04545" />
                <ClayGrad id={clayIds(uid, "roof")} light="#6ab0ff" mid="#3d8fd9" dark="#2568b0" />
                <ClayGrad id={clayIds(uid, "win")} light="#dff4ff" mid="#b8e0ff" dark="#90c8f0" />
                <ClayGrad id={clayIds(uid, "siren")} light="#ffe566" mid="#ffd23f" dark="#e8b020" />
                <ClayGrad id={clayIds(uid, "road")} light="#e8e0d0" mid="#d0c8b8" dark="#b0a898" />
              </>
            }
          >
            <ClayBlob x={4} y={70} w={88} h={16} r={8} gradId={clayIds(uid, "road")} shadowId={sh} />
            <ClayCar
              x={22}
              y={36}
              bodyGrad={clayIds(uid, "body")}
              roofGrad={clayIds(uid, "roof")}
              windowGrad={clayIds(uid, "win")}
              shadowId={sh}
              scale={1.35}
            />
            <ClayCircle cx={58} cy={28} r={6} gradId={clayIds(uid, "siren")} shadowId={sh} />
            <ClayCircle cx={66} cy={28} r={6} gradId={clayIds(uid, "body")} shadowId={sh} />
          </ClayScene>
        </svg>
      );

    case "ocean":
      return (
        <svg {...svgProps}>
          <ClayScene
            uid={uid}
            bg={
              <>
                <ClayGrad id={clayIds(uid, "wave1")} light="#a8e0ff" mid="#68c0f0" dark="#4098d0" />
                <ClayGrad id={clayIds(uid, "wave2")} light="#88d0ff" mid="#50b0e8" dark="#3890c8" />
                <ClayGrad id={clayIds(uid, "star")} light="#fff8c0" mid="#ffe878" dark="#e8c840" />
                <ClayGrad id={clayIds(uid, "rocket")} light="#f0e8ff" mid="#d8c8f0" dark="#b8a0d8" />
                <ClayGrad id={clayIds(uid, "fin")} light="#ffb8c8" mid="#ff8fab" dark="#e86a8a" />
              </>
            }
          >
            <path
              d="M 0 58 Q 16 48 32 58 T 64 58 T 96 58 L 96 96 L 0 96 Z"
              fill={`url(#${clayIds(uid, "wave1")})`}
              filter={`url(#${sh})`}
            />
            <path
              d="M 0 68 Q 20 58 40 68 T 80 68 T 96 68 L 96 96 L 0 96 Z"
              fill={`url(#${clayIds(uid, "wave2")})`}
              opacity={0.85}
            />
            <ClayBlob x={38} y={18} w={20} h={36} r={10} gradId={clayIds(uid, "rocket")} shadowId={sh} />
            <ClayCircle cx={48} cy={16} r={8} gradId={clayIds(uid, "fin")} shadowId={sh} />
            <polygon points="48,8 42,18 54,18" fill={`url(#${clayIds(uid, "fin")})`} />
            <ClayCircle cx={22} cy={22} r={3} gradId={clayIds(uid, "star")} shadowId={sh} />
            <ClayCircle cx={72} cy={16} r={2.5} gradId={clayIds(uid, "star")} shadowId={sh} />
            <ClayCircle cx={64} cy={32} r={2} gradId={clayIds(uid, "star")} shadowId={sh} />
          </ClayScene>
        </svg>
      );
  }
}
