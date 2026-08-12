"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGameKitSettings } from "@/hooks/useGameKitSettings";
import GameChrome, { GameChromeToolbar } from "@/components/games/GameChrome";
import { useGamePlayChromeSlot } from "@/components/games/GamePlayChromeSlot";
import { TutorialOverlay } from "@/lib/gamekit/react/TutorialOverlay";
import { useBestScore } from "@/lib/gamekit/react/useBestScore";
import { useGameAudio } from "@/lib/gamekit/react/useGameAudio";
import { useTouchControls } from "@/lib/gamekit/react/useTouchControls";
import { useVisibilityPause } from "@/lib/gamekit/react/useVisibilityPause";
import { GameLoop } from "@/lib/gamekit/runtime/loop";
import { reportGameSession } from "@/lib/gamekit/progress/session";
import type { GameAdapter, GameInstance, GameStatus, OverlayProps } from "@/lib/gamekit/adapter";
import type { GameAction } from "@/lib/gamekit/types";
import type { TutorialStep } from "@/data/games";
import { BarTouchButton, touchControlStyles } from "@/lib/gamekit/react/TouchControls";
import hostStyles from "./GameHost.module.css";

export type GameHostProps = {
  adapter: GameAdapter;
  /** 遊戲名。頁面標題由 GamePageShell 的 h1 持有；此處僅供 TutorialOverlay 使用。 */
  title?: string;
  /** Cover image for ready screen (passed to overlay). */
  coverSrc?: string;
  /** Tutorial steps from data/games. */
  tutorial?: readonly TutorialStep[];
  /** Extra class on the outer shell. */
  className?: string;
  /** Optional custom canvas size; otherwise adapter / viewport decides. */
  canvasWidth?: number;
  canvasHeight?: number;
  /** Children rendered below the canvas / overlay (rare). */
  children?: ReactNode;
};

const TOUCH_LABEL: Partial<Record<GameAction, string>> = {
  "move-left": "⬅️",
  "move-right": "➡️",
  "move-up": "⬆️",
  "move-down": "⬇️",
  dash: "💨",
  action: "✨",
  pause: "⏸",
  confirm: "▶",
  cancel: "✕",
};

/**
 * Unified host for every GameAdapter.
 *
 * Responsibilities:
 * - Create / dispose the GameInstance
 * - Wire audio, best-score, visibility pause, keyboard / touch input
 * - Drive fixed-step loop when the instance exposes fixedUpdate
 * - Render GameChrome + optional canvas + instance.renderOverlay
 * - Call reportGameSession exactly once per finished session
 */
export default function GameHost({
  adapter,
  title,
  tutorial = [],
  className,
  canvasWidth = 360,
  canvasHeight = 640,
  children,
}: GameHostProps) {
  const instanceRef = useRef<GameInstance | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isCoarse = useCoarsePointer();
  const { kidsMode, gameVolume, motionPreference } = useGameKitSettings();
  const reduced = useReducedMotion(motionPreference);
  const { best, saveBest } = useBestScore(adapter.id);
  const { useKeyboardInput } = useTouchControls();
  /** PLAY-IA-7：有 shell slot 就 portal；否則 fallback 畫布上方原列 */
  const chromeSlot = useGamePlayChromeSlot();

  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [announce, setAnnounce] = useState("");

  const {
    ensureAudio,
    soundUi,
    toggleSound,
    playBgm,
    stopBgm,
    pauseBgm,
    tone,
  } = useGameAudio(adapter.id);

  const syncHost = useCallback(() => {
    const g = instanceRef.current;
    if (!g) return;
    setStatus(g.getStatus());
    setScore(g.getScore());
  }, []);

  // ── create / dispose instance ──────────────────────────────────────────
  useEffect(() => {
    const inst = adapter.create({
      kidsMode,
      reducedMotion: reduced,
      audio: { ensureAudio, tone },
      onSession: (result) => {
        // 每次 onSession 都寫入（中關／多賽道）；去重由各 adapter 負責。
        if (best == null || result.score > best) {
          void saveBest(result.score);
        }
        reportGameSession(result);
      },
    });
    instanceRef.current = inst;
    setStatus(inst.getStatus());
    setScore(inst.getScore());

    return () => {
      loopRef.current?.stop();
      loopRef.current = null;
      inst.dispose();
      instanceRef.current = null;
    };
    // Only re-create when adapter identity changes; kidsMode is read at create time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter.id]);

  // ── fixed-step loop (canvas games) ─────────────────────────────────────
  useEffect(() => {
    const inst = instanceRef.current;
    if (!inst?.fixedUpdate) return;

    const loop = new GameLoop();
    loopRef.current = loop;

    const startLoop = () => {
      loop.start({
        fixedUpdate: (dt) => {
          const g = instanceRef.current;
          if (!g || g.getStatus() !== "playing") return;
          g.fixedUpdate?.(dt);
          setScore(g.getScore());
          const next = g.getStatus();
          if (next !== status) setStatus(next);
        },
        render: (alpha) => {
          const g = instanceRef.current;
          const canvas = canvasRef.current;
          if (!g?.render || !canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          g.render(ctx, alpha);
        },
      });
    };

    if (status === "playing") startLoop();
    else loop.stop();

    return () => {
      loop.stop();
    };
  }, [status, adapter.id]);

  // ── audio follow status ────────────────────────────────────────────────
  useEffect(() => {
    if (status === "playing") playBgm();
    else if (status === "paused") pauseBgm();
    else stopBgm();
  }, [status, playBgm, pauseBgm, stopBgm]);

  // ── visibility ─────────────────────────────────────────────────────────
  useVisibilityPause({
    onHidden: () => {
      const g = instanceRef.current;
      if (g && g.getStatus() === "playing") {
        g.pause();
        setStatus("paused");
        setAnnounce("遊戲已暫停");
      }
    },
    onVisible: () => {
      // stay paused until player resumes
    },
  });

  // ── unified keyboard / gamepad ─────────────────────────────────────────
  useKeyboardInput(
    (input) => {
      const g = instanceRef.current;
      if (!g) return;
      const s = g.getStatus();

      if (s === "playing") {
        if (input.wasPressed("pause")) {
          g.pause();
          setStatus("paused");
          setAnnounce("遊戲已暫停");
          return;
        }
        ([
          "move-left",
          "move-right",
          "move-up",
          "move-down",
          "dash",
          "action",
        ] as GameAction[]).forEach((a) => {
          g.setAction(a, input.isHeld(a));
        });
      } else if (s === "paused" && input.wasPressed("pause")) {
        g.resume();
        setStatus("playing");
        setAnnounce("繼續遊戲");
      } else if (
        (s === "ready" || s === "over" || s === "won") &&
        input.wasPressed("confirm")
      ) {
        ensureAudio();
        g.start();
        setStatus(g.getStatus());
        setScore(g.getScore());
      }
    },
    status === "playing" ||
      status === "paused" ||
      status === "ready" ||
      status === "over" ||
      status === "won",
  );

  // ── host actions ───────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    const g = instanceRef.current;
    if (!g) return;
    ensureAudio();
    g.start();
    setStatus(g.getStatus());
    setScore(g.getScore());
  }, [ensureAudio]);

  const handlePause = useCallback(() => {
    const g = instanceRef.current;
    if (!g || g.getStatus() !== "playing") return;
    g.pause();
    setStatus("paused");
    setAnnounce("遊戲已暫停");
  }, []);

  const handleResume = useCallback(() => {
    const g = instanceRef.current;
    if (!g || g.getStatus() !== "paused") return;
    g.resume();
    setStatus("playing");
    setAnnounce("繼續遊戲");
  }, []);

  const handleRestart = useCallback(() => {
    const g = instanceRef.current;
    if (!g) return;
    ensureAudio();
    g.restart();
    setStatus(g.getStatus());
    setScore(g.getScore());
  }, [ensureAudio]);

  const overlayProps: OverlayProps = {
    status,
    score,
    best,
    kidsMode,
    reducedMotion: reduced,
    gameVolume,
    soundOn: soundUi,
    onStart: handleStart,
    onResume: handleResume,
    onRestart: handleRestart,
    onOpenTutorial: () => setShowTutorial(true),
    syncHost,
  };

  const touchActions =
    instanceRef.current?.getTouchActions?.() ??
    (["move-left", "move-right", "action"] as const);

  const needsCanvas = Boolean(instanceRef.current?.fixedUpdate);

  /*
   * 契約：工具列必須「無條件」渲染。
   * 若把整列包進 `title || best != null` 之類的條件，hasScore: false 的遊戲
   * （例如主打的 candy-match，best 恆為 null）會完全失去這些控制。
   * 只有「最佳分數」可以條件顯示；遊戲名由 GamePageShell 的 h1 持有，此處不重複。
   * PLAY-IA-7：有 chromeSlot 時 portal 進 sticky 抬頭，否則 fallback 原列。
   */
  const toolbarRow = (
    <div
      className={
        chromeSlot
          ? `${hostStyles.toolbarRow} ${hostStyles.toolbarRowPortaled}`
          : hostStyles.toolbarRow
      }
    >
      {(best ?? 0) > 0 ? (
        <span className={hostStyles.bestScore}>最佳 ⭐ {best}</span>
      ) : null}
      <GameChromeToolbar
        canPause={status === "playing" || status === "paused"}
        paused={status === "paused"}
        onPause={handlePause}
        onResume={handleResume}
        soundOn={soundUi}
        onToggleSound={toggleSound}
      />
    </div>
  );

  return (
    <GameChrome
      canPause={status === "playing" || status === "paused"}
      paused={status === "paused"}
      onPause={handlePause}
      onResume={handleResume}
      onRestart={handleRestart}
      announce={announce}
      className={className}
    >
      <div style={{ position: "relative", width: "100%" }}>
        {chromeSlot ? createPortal(toolbarRow, chromeSlot) : toolbarRow}

        {needsCanvas && (
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            /* 遊戲畫面需有可及名稱，smoke 亦以此定位畫布。 */
            role="img"
            aria-label="遊戲畫面"
            style={{
              display: "block",
              width: "100%",
              maxWidth: canvasWidth,
              margin: "0 auto",
              borderRadius: 16,
              background: "#fffaf2",
              imageRendering: "pixelated",
            }}
          />
        )}

        {instanceRef.current?.renderOverlay?.(overlayProps)}

        {isCoarse && status === "playing" && (
          <div className={touchControlStyles.touchBar}>
            {touchActions.map((action) => (
              <BarTouchButton
                key={action}
                label={action}
                coarse
                onDown={() => instanceRef.current?.setAction(action, true)}
                onUp={() => instanceRef.current?.setAction(action, false)}
              >
                {TOUCH_LABEL[action] ?? action}
              </BarTouchButton>
            ))}
          </div>
        )}

        {showTutorial && tutorial.length > 0 && (
          <TutorialOverlay
            title={title ?? adapter.id}
            steps={tutorial}
            onClose={() => setShowTutorial(false)}
          />
        )}

        {children}
      </div>
    </GameChrome>
  );
}
