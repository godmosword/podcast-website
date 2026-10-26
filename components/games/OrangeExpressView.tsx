"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import type { GameAction } from "@/lib/gamekit/types";
import { useGameLoop } from "@/lib/gamekit/react/useGameLoop";
import {
  loadOrangeExpressLevel,
  resolveOrangeExpressLevel,
  saveOrangeExpressLevel,
} from "@/lib/gamekit/progress/orange-express-prefs";
import { OrangeExpressCab } from "@/components/games/OrangeExpressCab";
import { OrangeExpressResult } from "@/components/games/OrangeExpressResult";
import { OrangeExpressWindshield } from "@/components/games/OrangeExpressWindshield";
import type { OrangeExpressInstance } from "@/lib/gamekit/games/orange-express/adapter";
import { ARRIVE_CHIME, DOOR_CHIME, HORN } from "@/lib/games/orange-express/chime";
import { COPY } from "@/lib/games/orange-express/copy";
import { medalsFor } from "@/lib/games/orange-express/medals";
import {
  clampNotch,
  createRun,
  honk,
  powerCap,
  step,
  withHook,
} from "@/lib/games/orange-express/reducer";
import type { LevelId, Notch, RunState } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

type Screen = "title" | "drive" | "result";

const LEVELS: readonly LevelId[] = ["look", "drive", "captain"];

function liveText(run: RunState): string {
  if (run.phase === "doors-open") return COPY.boarding;
  if (run.phase === "stopped") return COPY.atStation;
  if (run.misses > 0 && run.phase === "running" && run.progress < 0.4) return COPY.tryStopAgain;
  return "";
}

export function OrangeExpressView({
  status,
  kidsMode,
  reducedMotion,
  audio,
  instance,
  onStart,
  onResume,
  onOpenTutorial,
  syncHost,
}: OverlayProps & {
  audio?: GameAudioBus;
  instance: OrangeExpressInstance;
}) {
  const [screen, setScreen] = useState<Screen>("title");
  const [level, setLevel] = useState<LevelId>("look");
  const [run, setRun] = useState<RunState | null>(null);
  const [shake, setShake] = useState(false);
  const [honked, setHonked] = useState(0);
  const runRef = useRef<RunState | null>(null);
  const levelRef = useRef(level);
  const screenRef = useRef(screen);
  const phaseRef = useRef<RunState["phase"] | null>(null);
  const picked = useRef(false);
  levelRef.current = level;
  screenRef.current = screen;

  const apply = useCallback((next: RunState) => {
    runRef.current = next;
    setRun(next);
  }, []);

  const begin = useCallback(() => {
    const nextLevel = levelRef.current;
    saveOrangeExpressLevel(nextLevel);
    const hook = typeof window === "undefined" ? undefined : window.__orangeExpress;
    const next = withHook(createRun(nextLevel), hook);
    phaseRef.current = next.phase;
    apply(next);
    setScreen("drive");
    instance.notifyPlaying(nextLevel);
    syncHost();
  }, [apply, instance, syncHost]);

  const goTitle = useCallback(() => {
    runRef.current = null;
    phaseRef.current = null;
    setRun(null);
    setScreen("title");
    instance.notifyReady();
    syncHost();
  }, [instance, syncHost]);

  const tryDoors = useCallback(() => {
    const cur = runRef.current;
    if (!cur) return;
    if (cur.phase === "doors-open") {
      const next = step(cur, { type: "close-doors" });
      if (next !== cur) apply(next);
      return;
    }
    const next = step(cur, { type: "open-doors" });
    if (next === cur) {
      if (cur.phase === "running" || cur.phase === "in-window") {
        instance.noteEarlyDoor();
        setShake(true);
      }
      return;
    }
    apply(next);
  }, [apply, instance]);

  const onAction = useCallback(
    (action: GameAction) => {
      const cur = runRef.current;
      if (!cur || instance.isInputPaused()) return;
      if (action === "move-up" || action === "move-down") {
        const max = powerCap(cur.level);
        const notch = clampNotch(cur.power + (action === "move-up" ? 1 : -1), max);
        const next = step(cur, { type: "set-power", notch });
        if (next !== cur) apply(next);
        return;
      }
      if (action === "move-left" || action === "move-right") {
        const notch = clampNotch(cur.brake + (action === "move-left" ? 1 : -1), 2);
        const next = step(cur, { type: "set-brake", notch });
        if (next !== cur) apply(next);
        return;
      }
      if (action === "dash") {
        honk(cur);
        audio?.voices?.(HORN);
        setHonked((count) => count + 1);
        return;
      }
      if (action === "action") tryDoors();
    },
    [apply, audio, instance, tryDoors],
  );

  const beginRef = useRef(begin);
  const titleRef = useRef(goTitle);
  const actionRef = useRef(onAction);
  beginRef.current = begin;
  titleRef.current = goTitle;
  actionRef.current = onAction;

  useEffect(() => {
    instance.registerController({
      startSelected: () => beginRef.current(),
      restart: () => beginRef.current(),
      goToTitle: () => titleRef.current(),
      onAction: (action) => actionRef.current(action),
    });
    return () => {
      instance.registerController({
        startSelected: () => {},
        restart: () => {},
        goToTitle: () => {},
        onAction: () => {},
      });
    };
  }, [instance]);

  useEffect(() => {
    if (picked.current) return;
    setLevel(resolveOrangeExpressLevel(loadOrangeExpressLevel(), kidsMode));
  }, [kidsMode]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.__orangeExpress) return;
    window.__orangeExpressJump = (patch) => {
      const cur = runRef.current;
      if (!cur) return;
      apply(withHook(cur, patch));
    };
    return () => {
      delete window.__orangeExpressJump;
    };
  }, [apply]);

  useEffect(() => {
    if (!shake) return;
    const timer = window.setTimeout(() => setShake(false), 280);
    return () => window.clearTimeout(timer);
  }, [shake]);

  useEffect(() => {
    if (!run || screen !== "drive") return;
    const prev = phaseRef.current;
    if (prev !== "in-window" && run.phase === "in-window") audio?.voices?.(ARRIVE_CHIME);
    if (prev !== "doors-open" && run.phase === "doors-open") audio?.voices?.(DOOR_CHIME);
    phaseRef.current = run.phase;
    if (run.phase === "route-done") {
      instance.notifyWon(run);
      setScreen("result");
      syncHost();
    }
  }, [audio, instance, run, screen, syncHost]);

  useGameLoop({
    enabled: status === "playing" && screen === "drive" && run?.phase !== "route-done",
    onFrame: (dtMs) => {
      const cur = runRef.current;
      if (!cur || instance.isInputPaused() || cur.phase === "route-done") return;
      const next = step(cur, { type: "tick", dt: dtMs / 1000 });
      if (next !== cur) apply(next);
    },
  });

  const choose = (next: LevelId) => {
    picked.current = true;
    setLevel(next);
    saveOrangeExpressLevel(next);
  };

  const setPower = (notch: Notch) => {
    const cur = runRef.current;
    if (!cur) return;
    const next = step(cur, { type: "set-power", notch });
    if (next === cur && notch > cur.power) setShake(true);
    else if (next !== cur) apply(next);
  };

  const setBrake = (notch: Notch) => {
    const cur = runRef.current;
    if (!cur) return;
    const next = step(cur, { type: "set-brake", notch });
    if (next !== cur) apply(next);
  };

  const pressHorn = () => {
    if (runRef.current) honk(runRef.current);
    audio?.ensureAudio();
    audio?.voices?.(HORN);
    setHonked((count) => count + 1);
  };

  if (screen === "title" || !run) {
    return (
      <div className={styles.screen} data-screen="title" data-testid="orange-express-title">
        <p className={styles.route}>{COPY.routeName}</p>
        <div className={styles.levels} role="radiogroup" aria-label={COPY.routeName}>
          {LEVELS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={level === id}
              className={level === id ? styles.levelOn : styles.level}
              onClick={() => choose(id)}
            >
              <strong>{COPY.levels[id]}</strong>
              <small>{COPY.levelHints[id]}</small>
            </button>
          ))}
        </div>
        <button type="button" className={styles.primary} onClick={onStart}>
          {COPY.start}
        </button>
        <button type="button" className={styles.secondary} onClick={onOpenTutorial}>
          {COPY.howTo}
        </button>
      </div>
    );
  }

  if (screen === "result") {
    const medals = medalsFor(run, instance.earlyDoorCount());
    return (
      <div className={styles.screen} data-screen="result">
        <OrangeExpressResult
          stars={medals.stars}
          flawless={medals.flawless}
          reduced={reducedMotion}
          onReplay={begin}
          onTitle={goTitle}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.screen}
      data-screen="drive"
      data-testid="orange-express-drive"
      data-honked={honked}
      data-station-index={run.stationIndex}
      data-reduced={reducedMotion ? "true" : "false"}
    >
      <OrangeExpressWindshield run={run} reduced={reducedMotion} />
      <p className={styles.live} aria-live="polite">
        {liveText(run)}
      </p>
      <OrangeExpressCab
        run={run}
        shake={shake}
        onPower={setPower}
        onBrake={setBrake}
        onHorn={pressHorn}
        onDoor={tryDoors}
      />
      {status === "paused" ? (
        <div className={styles.paused}>
          <p>{COPY.paused}</p>
          <button type="button" className={styles.primary} onClick={onResume}>
            {COPY.resume}
          </button>
        </div>
      ) : null}
    </div>
  );
}
