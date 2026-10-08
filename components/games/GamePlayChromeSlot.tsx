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
};

/**
 * 沉浸遊戲頁單列 sticky 抬頭：返回 + 唯一 h1 + chrome slot + 日夜切換。
 * PLAY-IA-7／PLAY-IA-8。
 */
export function GamePlayHeader({ playTitle }: GamePlayHeaderProps) {
  const slotRef = useContext(GamePlayChromeSlotRefContext);
  const leaveGuard = useContext(GamePlayLeaveGuardContext);
  const onBack = (event: MouseEvent<HTMLAnchorElement>) => {
    // 另開分頁不會丟掉進度，不攔。
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if (leaveGuard?.current?.() === false) event.preventDefault();
  };

  return (
    <header className={styles.playHeader}>
      <Link href="/games" className={styles.back} onClick={onBack}>
        <span aria-hidden>←</span> 回遊樂園
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
