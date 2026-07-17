"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { useGameKitSettings } from "@/hooks/useGameKitSettings";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import PixelGameCanvas from "@/components/games/PixelGameCanvas";
import GameChrome, { GameChromeToolbar } from "@/components/games/GameChrome";
import { CarAdventureCanvas } from "@/components/games/car-adventure/CarAdventureCanvas";
import { CarAdventureMenu } from "@/components/games/car-adventure/CarAdventureMenu";
import {
  BarTouchButton,
  touchControlStyles,
} from "@/lib/gamekit/react/TouchControls";
import { useBestScore } from "@/lib/gamekit/react/useBestScore";
import { useGameAudio } from "@/lib/gamekit/react/useGameAudio";
import { useTouchControls } from "@/lib/gamekit/react/useTouchControls";
import { useVisibilityPause } from "@/lib/gamekit/react/useVisibilityPause";
import { TutorialOverlay } from "@/lib/gamekit/react/TutorialOverlay";
import { JuiceController } from "@/lib/gamekit/runtime/juice";
import { GAMES } from "@/data/games";
import { updateAdventure } from "@/lib/games/car-adventure/physics";
import {
  createGameState,
  type GameState,
  type Input,
  type Status,
} from "@/lib/games/car-adventure/types";
import styles from "./CarAdventureGame.module.css";

const CAR_ADVENTURE_META = GAMES.find((g) => g.slug === "car-adventure");
const COVER = CAR_ADVENTURE_META?.art.cover ?? "/games/v2/car-adventure/cover.webp";
const TUTORIAL_STEPS = CAR_ADVENTURE_META?.tutorial ?? [];

export default function CarAdventureGame() {
  const game = useRef<GameState | null>(null);
  const juiceRef = useRef(new JuiceController());
  const statusRef = useRef<Status>("ready");
  const isCoarse = useCoarsePointer();
  const reducedRef = useRef(false);
  const reduced = useReducedMotion();
  const { useKeyboardInput } = useTouchControls();
  const { best, saveBest } = useBestScore("car-adventure");

  const [status, setStatus] = useState<Status>("ready");
  const [showTutorial, setShowTutorial] = useState(false);
  const { kidsMode } = useGameKitSettings();
  const [levelIndex, setLevelIndex] = useState(0);
  const [announce, setAnnounce] = useState("");
  const levelIndexRef = useRef(0);
  const levelStartLivesRef = useRef(3);
  const kidsModeRef = useRef(kidsMode);
  kidsModeRef.current = kidsMode;

  const {
    ensureAudio,
    tone,
    soundUi,
    toggleSound,
    playBgm,
    stopBgm,
    pauseBgm,
    resumeBgm,
  } = useGameAudio("car-adventure");

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const setStat = useCallback(
    (s: Status) => {
      if (
        (s === "won" || s === "over") &&
        game.current &&
        (best == null || game.current.score > best)
      ) {
        void saveBest(game.current.score);
      }
      statusRef.current = s;
      setStatus(s);
    },
    [best, saveBest],
  );

  const sJump = useCallback(() => tone(520, 0.12, "square", 0.04), [tone]);
  const sCoin = useCallback(() => tone(880, 0.08, "triangle", 0.05), [tone]);
  const sStomp = useCallback(() => tone(300, 0.1, "square", 0.05), [tone]);
  const sHurt = useCallback(() => tone(180, 0.3, "sawtooth", 0.06), [tone]);
  const sWin = useCallback(
    () =>
      [523, 659, 784, 1046].forEach((f, i) =>
        setTimeout(() => tone(f, 0.2, "triangle", 0.06), i * 130),
      ),
    [tone],
  );

  const reset = useCallback((idx = levelIndexRef.current) => {
    const startLives = kidsModeRef.current ? 5 : 3;
    game.current = createGameState(idx, startLives, kidsModeRef.current);
    levelStartLivesRef.current = startLives;
  }, []);

  const beginLevel = useCallback(
    (idx: number) => {
      levelIndexRef.current = idx;
      setLevelIndex(idx);
      ensureAudio();
      reset(idx);
      setStat("playing");
    },
    [ensureAudio, reset, setStat],
  );

  const begin = useCallback(() => {
    beginLevel(levelIndexRef.current);
  }, [beginLevel]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") {
      setAnnounce("遊戲已暫停");
      setStat("paused");
    } else if (statusRef.current === "paused") {
      if (game.current) game.current.last = null;
      setAnnounce("繼續遊戲");
      setStat("playing");
    }
  }, [setStat]);

  const update = useCallback(
    (g: GameState, dt: number) => {
      updateAdventure(g, dt, {
        reduced: reducedRef.current,
        juice: juiceRef.current,
        levelStartLives: levelStartLivesRef.current,
        onJump: sJump,
        onCoin: sCoin,
        onStomp: sStomp,
        onHurt: sHurt,
        onWin: sWin,
        setStatus: setStat,
        onAdvanceLevel: (next) => {
          levelIndexRef.current = next;
          setLevelIndex(next);
          levelStartLivesRef.current = g.lives;
          statusRef.current = "playing";
          setStatus("playing");
        },
      });
    },
    [sJump, sCoin, sStomp, sHurt, sWin, setStat],
  );

  /** 單一鍵盤路徑：選單確認、暫停、移動／跳躍。 */
  useEffect(() => {
    const setKey = (k: string, v: boolean) => {
      const g = game.current;
      if (!g) return;
      if (k === "ArrowLeft" || k === "a" || k === "A") g.input.left = v;
      else if (k === "ArrowRight" || k === "d" || k === "D") g.input.right = v;
      else if (k === "ArrowUp" || k === "w" || k === "W" || k === " ")
        g.input.jump = v;
    };
    const onDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key))
        e.preventDefault();
      const s = statusRef.current;
      if (
        (s === "ready" || s === "won" || s === "over") &&
        (e.key === " " || e.key === "Enter")
      ) {
        begin();
        return;
      }
      if (
        (e.key === "p" || e.key === "P") &&
        (s === "playing" || s === "paused")
      ) {
        togglePause();
        return;
      }
      if (s !== "playing") return;
      setKey(e.key, true);
    };
    const onUp = (e: KeyboardEvent) => setKey(e.key, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [begin, togglePause]);

  useKeyboardInput(
    (input) => {
      const g = game.current;
      if (!g) return;
      if (statusRef.current === "playing") {
        if (input.wasPressed("pause")) {
          togglePause();
          return;
        }
        g.input.left = input.isHeld("move-left");
        g.input.right = input.isHeld("move-right");
        g.input.jump = input.isHeld("move-up") || input.isHeld("action");
      } else if (statusRef.current === "paused" && input.wasPressed("pause")) {
        togglePause();
      } else if (
        (statusRef.current === "ready" ||
          statusRef.current === "won" ||
          statusRef.current === "over") &&
        input.wasPressed("confirm")
      ) {
        begin();
      }
    },
    status === "playing" ||
      status === "paused" ||
      status === "ready" ||
      status === "won" ||
      status === "over",
  );

  useEffect(() => {
    if (status === "playing" && game.current) game.current.last = null;
  }, [status]);

  useEffect(() => {
    if (status === "playing") playBgm();
    else if (status === "paused") pauseBgm();
    else stopBgm();
  }, [status, playBgm, pauseBgm, stopBgm]);

  useVisibilityPause({
    onHidden: () => {
      pauseBgm();
      if (statusRef.current === "playing") setStat("paused");
    },
    onVisible: () => {
      if (statusRef.current === "playing") resumeBgm();
    },
  });

  const hold =
    (key: keyof Input, v: boolean) => () => {
      const g = game.current;
      if (g) g.input[key] = v;
    };

  return (
    <GameChrome
      canPause={status === "playing" || status === "paused"}
      paused={status === "paused"}
      onPause={() => {
        if (statusRef.current === "playing") togglePause();
      }}
      onResume={() => {
        if (statusRef.current === "paused") togglePause();
      }}
      onRestart={begin}
      announce={announce}
    >
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div className={styles.heading}>
            🏁 車車大冒險 {kidsMode ? "🧒" : ""}
          </div>
          <div className={styles.topActions}>
            {(best ?? 0) > 0 && (
              <span
                className={styles.best}
                aria-label={`最佳得分 ${best}`}
              >
                最佳 ⭐ {best ?? 0}
              </span>
            )}
            <GameChromeToolbar
              canPause={status === "playing" || status === "paused"}
              paused={status === "paused"}
              onPause={() => {
                if (statusRef.current === "playing") togglePause();
              }}
              onResume={() => {
                if (statusRef.current === "paused") togglePause();
              }}
              soundOn={soundUi}
              onToggleSound={toggleSound}
            />
          </div>
        </div>

        <PixelGameCanvas gameId="car-adventure">
          <CarAdventureCanvas
            game={game}
            statusRef={statusRef}
            juiceRef={juiceRef}
            reducedRef={reducedRef}
            reset={reset}
            update={update}
          />
        </PixelGameCanvas>

        <CarAdventureMenu
          status={status}
          levelIndex={levelIndex}
          score={game.current?.score ?? null}
          kidsMode={kidsMode}
          coverSrc={COVER}
          onSelectLevel={(i) => {
            levelIndexRef.current = i;
            setLevelIndex(i);
          }}
          onStart={() => beginLevel(levelIndex)}
          onResume={togglePause}
          onOpenTutorial={() => setShowTutorial(true)}
        />

        {showTutorial && (
          <TutorialOverlay
            title={CAR_ADVENTURE_META?.title ?? "車車大冒險"}
            steps={TUTORIAL_STEPS}
            onClose={() => setShowTutorial(false)}
          />
        )}

        <div className={touchControlStyles.touchBar}>
          <div className={touchControlStyles.touchCluster}>
            <BarTouchButton
              label="左"
              coarse={isCoarse}
              onDown={hold("left", true)}
              onUp={hold("left", false)}
            >
              ⬅️
            </BarTouchButton>
            <BarTouchButton
              label="右"
              coarse={isCoarse}
              onDown={hold("right", true)}
              onUp={hold("right", false)}
            >
              ➡️
            </BarTouchButton>
          </div>
          <BarTouchButton
            label="跳"
            big
            coarse={isCoarse}
            onDown={hold("jump", true)}
            onUp={hold("jump", false)}
          >
            ⬆️ 跳
          </BarTouchButton>
        </div>

        <p className={styles.help}>
          {isCoarse
            ? "按住按鈕移動 · 點跳躍"
            : "← → / A D 移動 · ↑ / W / 空白鍵 跳（可變高度）· 踩敵人頭可彈飛 · P 暫停 · 手把支援"}
        </p>
      </div>
    </GameChrome>
  );
}
