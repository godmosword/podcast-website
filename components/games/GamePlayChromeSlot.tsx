"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Icon from "@/components/ui/Icon";
import styles from "./GamePageShell.module.css";

const GamePlayChromeSlotContext = createContext<HTMLElement | null>(null);
const GamePlayChromeSlotRefContext = createContext<
  ((node: HTMLElement | null) => void) | null
>(null);

/** 回 false 就擋下「回遊樂園」，由遊戲自己接手（例如先問要不要收藏）。 */
export type GamePlayLeaveGuard = () => boolean;
type LeaveGuardBox = { current: GamePlayLeaveGuard | null };
const GamePlayLeaveGuardContext = createContext<LeaveGuardBox | null>(null);

/**
 * 提供遊戲頁 sticky 抬頭右側的 chrome 掛載點（PLAY-IA-7）。
 * GameHost 以 createPortal 把工具列送進來；無 Provider 時 hook 回 null → Host fallback 原列。
 */
export function GamePlayChromeProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const slotRef = useCallback((node: HTMLElement | null) => {
    setSlot(node);
  }, []);

  const value = useMemo(() => slot, [slot]);
  const leaveGuard = useRef<GamePlayLeaveGuard | null>(null);

  return (
    <GamePlayChromeSlotContext.Provider value={value}>
      <GamePlayChromeSlotRefContext.Provider value={slotRef}>
        <GamePlayLeaveGuardContext.Provider value={leaveGuard}>
          {children}
        </GamePlayLeaveGuardContext.Provider>
      </GamePlayChromeSlotRefContext.Provider>
    </GamePlayChromeSlotContext.Provider>
  );
}

/** GameHost 讀取掛載點；不在 Provider 內時為 null。 */
export function useGamePlayChromeSlot(): HTMLElement | null {
  return useContext(GamePlayChromeSlotContext);
}

/** 遊戲在離開前要攔一下時註冊；傳 null 就不攔。不在 Provider 內時不做事。 */
export function useGamePlayLeaveGuard(guard: GamePlayLeaveGuard | null): void {
  const box = useContext(GamePlayLeaveGuardContext);
  useEffect(() => {
    if (!box) return;
    box.current = guard;
    return () => {
      if (box.current === guard) box.current = null;
    };
  }, [box, guard]);
}

type GamePlayHeaderProps = {
  playTitle: string;
  /**
   * 著色本：只留遊樂園圖示。文字仍在無障礙名稱裡。
   * 其他遊戲維持「箭頭＋回遊樂園」文字，避免只剩圖示認不出路。
   */
  iconBack?: boolean;
};

function ParkGateIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M3.5 20V9.2L12 3.6l8.5 5.6V20"
        fill="#b9f3db"
        stroke="#2f2f2f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 20v-6.2h6V20"
        fill="#fff6ea"
        stroke="#2f2f2f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="1.35" fill="#e85d4c" />
    </svg>
  );
}

/**
 * 沉浸遊戲頁單列 sticky 抬頭：返回 + 唯一 h1 + chrome slot + 日夜切換。
 * PLAY-IA-7／PLAY-IA-8。
 */
export function GamePlayHeader({ playTitle, iconBack = false }: GamePlayHeaderProps) {
  const slotRef = useContext(GamePlayChromeSlotRefContext);
  const leaveGuard = useContext(GamePlayLeaveGuardContext);
  const onBack = (event: MouseEvent<HTMLAnchorElement>) => {
    // 另開分頁不會丟掉進度，不攔。
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if (leaveGuard?.current?.() === false) event.preventDefault();
  };

  return (
    <header className={styles.playHeader}>
      <Link
        href="/games"
        className={iconBack ? `${styles.back} ${styles.backIcon}` : styles.back}
        onClick={onBack}
      >
        {iconBack ? <ParkGateIcon /> : <Icon name="arrow-left" size={18} />}
        <span className={iconBack ? styles.srOnly : undefined}>回遊樂園</span>
      </Link>
      <h1 id="game-play-title" className={styles.playTitle}>
        {playTitle}
      </h1>
      <div className={styles.headerActions}>
        <div
          ref={slotRef}
          className={styles.chromeSlot}
          data-testid="game-chrome-slot"
        />
        <span className={styles.themeSlot}>
          <ThemeToggle iconOnly />
        </span>
      </div>
    </header>
  );
}
