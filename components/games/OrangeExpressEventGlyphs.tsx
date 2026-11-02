import type { SceneId, ScenicEventKind } from "@/lib/games/orange-express/types";

/*
 * 沿途事件的小圖示（前窗提示、結算事件章）：跟前窗畫布裡的動物同一個樣子、同一組固定美術色，
 * 都描深色邊（色覺）。圖內不寫字。海邊過鐵軌的是螃蟹、賽跑的是海鷗；其他地方賽跑的是小狗。
 */

const INK = "rgb(58, 46, 40)";
const EDGE = 1.6;

function Duck() {
  return (
    <>
      <ellipse cx="14" cy="21" rx="9" ry="6" fill="rgb(255, 214, 102)" stroke={INK} strokeWidth={EDGE} />
      <path d="M11 19l-5-7 6 4z" fill="rgb(244, 186, 70)" />
      <circle cx="21" cy="12" r="5" fill="rgb(255, 214, 102)" stroke={INK} strokeWidth={EDGE} />
      <path d="M25 11.5l5 1.5-5 1.5z" fill="rgb(248, 140, 52)" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx="22" cy="11" r="1.1" fill={INK} />
    </>
  );
}

function Crab() {
  return (
    <>
      <circle cx="6" cy="13" r="3.4" fill="rgb(252, 150, 120)" stroke={INK} strokeWidth={EDGE} />
      <circle cx="26" cy="13" r="3.4" fill="rgb(252, 150, 120)" stroke={INK} strokeWidth={EDGE} />
      <ellipse cx="16" cy="20" rx="10" ry="6.5" fill="rgb(236, 104, 76)" stroke={INK} strokeWidth={EDGE} />
      <circle cx="12.5" cy="13" r="2.2" fill="rgb(255, 252, 244)" stroke={INK} strokeWidth="1" />
      <circle cx="19.5" cy="13" r="2.2" fill="rgb(255, 252, 244)" stroke={INK} strokeWidth="1" />
      <circle cx="12.5" cy="13" r="1" fill={INK} />
      <circle cx="19.5" cy="13" r="1" fill={INK} />
    </>
  );
}

function Crossing() {
  return (
    <>
      <rect x="14.5" y="10" width="3" height="20" rx="1" fill="rgb(236, 232, 224)" stroke={INK} strokeWidth="1" />
      <path d="M5 3l22 11M5 14L27 3" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M5 3l22 11M5 14L27 3" stroke="rgb(255, 214, 102)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="10" cy="21" r="3.6" fill="rgb(232, 72, 60)" stroke={INK} strokeWidth={EDGE} />
      <circle cx="22" cy="21" r="3.6" fill="rgb(232, 72, 60)" stroke={INK} strokeWidth={EDGE} />
    </>
  );
}

function Wave() {
  return (
    <>
      <path d="M22 17l5-11" stroke={INK} strokeWidth="4.4" strokeLinecap="round" />
      <path d="M22 17l5-11" stroke="rgb(255, 224, 196)" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="15" cy="25" rx="7" ry="6" fill="rgb(140, 200, 236)" stroke={INK} strokeWidth={EDGE} />
      <circle cx="15" cy="13" r="7" fill="rgb(255, 224, 196)" stroke={INK} strokeWidth={EDGE} />
      <path d="M8 12a7 7 0 0 1 14 0z" fill="rgb(120, 78, 52)" />
      <circle cx="12.5" cy="14" r="1" fill={INK} />
      <circle cx="17.5" cy="14" r="1" fill={INK} />
      <path d="M12.5 17c1.5 1.4 3.5 1.4 5 0" fill="none" stroke={INK} strokeWidth="1" />
    </>
  );
}

function Dog() {
  return (
    <>
      <path d="M8 22v7M18 22v7" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M8 22v7M18 22v7" stroke="rgb(196, 140, 92)" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="13" cy="20" rx="9" ry="5.5" fill="rgb(196, 140, 92)" stroke={INK} strokeWidth={EDGE} />
      <circle cx="23" cy="13" r="5.5" fill="rgb(196, 140, 92)" stroke={INK} strokeWidth={EDGE} />
      <ellipse cx="20" cy="9" rx="2" ry="3.6" fill="rgb(140, 96, 64)" stroke={INK} strokeWidth="1" />
      <circle cx="24" cy="12" r="1" fill={INK} />
      <circle cx="28" cy="14" r="1.2" fill={INK} />
    </>
  );
}

function Gull() {
  return (
    <>
      <path d="M16 17L3 7l8 10zM16 17l13-10-8 10z" fill="rgb(176, 186, 196)" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx="16" cy="18" rx="7" ry="4.5" fill="rgb(255, 255, 252)" stroke={INK} strokeWidth={EDGE} />
      <circle cx="20" cy="17" r="1" fill={INK} />
      <path d="M23 18l4 1-4 1z" fill="rgb(248, 180, 60)" />
    </>
  );
}

export function EventGlyph({
  kind,
  scene,
  className,
}: {
  kind: ScenicEventKind;
  scene: SceneId;
  className?: string;
}) {
  let body;
  if (kind === "ducks") body = scene === "sea" ? <Crab /> : <Duck />;
  else if (kind === "crossing") body = <Crossing />;
  else if (kind === "wave") body = <Wave />;
  else if (scene === "sea") body = <Gull />;
  else body = <Dog />;
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className} data-event={kind}>
      {body}
    </svg>
  );
}
