"use client";

import { RiderHeart } from "@/components/games/OrangeExpressGlyphs";
import { OrangeExpressNextHand } from "@/components/games/OrangeExpressNextHand";
import { COPY } from "@/lib/games/orange-express/copy";
import styles from "./orange-express.module.css";

const INK = "rgb(58, 46, 40)";
const SKIN = "rgb(255, 224, 196)";
const HAIR = "rgb(120, 78, 52)";
const SHIRT = "rgb(140, 200, 236)";

function Arm({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      <path d={d} fill="none" stroke={SKIN} strokeWidth="4.5" strokeLinecap="round" />
    </>
  );
}

/**
 * 揮手的朋友（PR-K1）：前窗左下角一張固定不動的卡，點它就是跟朋友揮手。跟路旁畫的朋友同一組顏色、同一個位置語彙（停好時的月台朋友卡）。
 * 點的不是路旁那個朋友：開快時他只有最後約 0.3 秒看得清楚，孩子點不到。做到了兩手舉高、冒愛心。
 */
export function OrangeExpressWaveFriend({
  done,
  next,
  onWave,
}: {
  done: boolean;
  /** nextAction 指的就是這張卡：加黃框與手指。 */
  next: boolean;
  onWave: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.waveFriend}
      aria-label={done ? COPY.waveFriendDone : COPY.waveFriend}
      aria-disabled={done ? true : undefined}
      data-done={done ? "true" : "false"}
      data-next={next ? "true" : undefined}
      data-testid="orange-express-wave-friend"
      onClick={onWave}
    >
      <svg viewBox="0 0 64 64" aria-hidden className={styles.waveFriendFace}>
        <rect x="20" y="37" width="24" height="24" rx="10" fill={SHIRT} stroke={INK} strokeWidth="2" />
        {done ? <Arm d="M21 43 L10 27" /> : null}
        <g className={done ? undefined : styles.waveArm}>
          <Arm d="M43 43 L54 27" />
        </g>
        <circle cx="32" cy="24" r="13" fill={SKIN} stroke={INK} strokeWidth="2" />
        <path d="M19 24a13 13 0 0 1 26 0c-4-3-8-4-13-4s-9 1-13 4z" fill={HAIR} />
        <circle cx="27" cy="26" r="1.9" fill={INK} />
        <circle cx="37" cy="26" r="1.9" fill={INK} />
        <path d="M27 31c2 3 8 3 10 0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {done ? <RiderHeart /> : null}
      {next ? <OrangeExpressNextHand at="button" /> : null}
    </button>
  );
}
