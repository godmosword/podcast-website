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
import { useOrangeExpressDisplay } from "@/components/games/OrangeExpressSettings";
import { OrangeExpressWindshield } from "@/components/games/OrangeExpressWindshield";
import type { OrangeExpressInstance } from "@/lib/gamekit/games/orange-express/adapter";
import {
  ARRIVE_CHIME,
  DOOR_CHIME,
  EMERGENCY_CLICK,
  HORN,
  NOTCH_CLICK,
  jointClack,
} from "@/lib/games/orange-express/chime";
import { COPY, GRADE_TEXT } from "@/lib/games/orange-express/copy";
import { medalsFor } from "@/lib/games/orange-express/medals";
import {
  clampBrake,
  clampPower,
  createRun,
  honk,
  powerCap,
  step,
  withHook,
} from "@/lib/games/orange-express/reducer";
import { DriveSound, driveMix, jointsCrossed } from "@/lib/games/orange-express/sound";
import { NO_SWAY, decayBump, swayAt } from "@/lib/games/orange-express/sway";
import { EMERGENCY, type LevelId, type RunState } from "@/lib/games/orange-express/types";
import styles from "./orange-express.module.css";

type Screen = "title" | "drive" | "result";

const LEVELS: readonly LevelId[] = ["look", "drive", "captain"];
const SOUND_RETRY_MS = 1000;

function liveText(run: RunState): string {
  if (run.phase === "reversing") return COPY.reversing;
  if (run.phase === "doors-open") return COPY.boarding;
  if (run.phase === "stopped") {
    const grade = run.grades[run.stationIndex];
    return grade ? `${COPY.atStation}，${GRADE_TEXT[grade]}` : COPY.atStation;
  }
  if (run.misses > 0 && run.phase === "running" && run.speed === 0) return COPY.tryStopAgain;
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
  const [display] = useOrangeExpressDisplay();
  const runRef = useRef<RunState | null>(null);
  const levelRef = useRef(level);
  const screenRef = useRef(screen);
  const phaseRef = useRef<RunState["phase"] | null>(null);
  const picked = useRef(false);
  const frozen = useRef(false);
  const swayRef = useRef<HTMLDivElement | null>(null);
  const swayClock = useRef(0);
  const bump = useRef(0);
  const sound = useRef<DriveSound | null>(null);
  const soundTriedAt = useRef(0);
  levelRef.current = level;
  screenRef.current = screen;

  const swayOn = display.sway && !reducedMotion;

  const apply = useCallback((next: RunState) => {
    runRef.current = next;
    setRun(next);
  }, []);

  const stopSound = useCallback(() => {
    sound.current?.stop();
    sound.current = null;
  }, []);

  const begin = useCallback(() => {
    const nextLevel = levelRef.current;
    saveOrangeExpressLevel(nextLevel);
    const hook = typeof window === "undefined" ? undefined : window.__orangeExpress;
    frozen.current = hook?.freeze === true;
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
    stopSound();
    instance.notifyReady();
    syncHost();
  }, [instance, stopSound, syncHost]);

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
      if (cur.phase === "running" || cur.phase === "in-window" || cur.phase === "reversing") {
        instance.noteEarlyDoor();
        setShake(true);
      }
      return;
    }
    apply(next);
  }, [apply, instance]);

  const setPower = useCallback(
    (notch: number) => {
      const cur = runRef.current;
      if (!cur) return;
      const target = clampPower(notch);
      const next = step(cur, { type: "set-power", notch: target });
      if (next === cur) {
        if (target > cur.power) setShake(true);
        return;
      }
      audio?.ensureAudio();
      audio?.voices?.(NOTCH_CLICK);
      apply(next);
    },
    [apply, audio],
  );

  const setBrake = useCallback(
    (notch: number) => {
      const cur = runRef.current;
      if (!cur) return;
      const next = step(cur, { type: "set-brake", notch: clampBrake(notch) });
      if (next === cur) return;
      audio?.ensureAudio();
      audio?.voices?.(next.brake === EMERGENCY ? EMERGENCY_CLICK : NOTCH_CLICK);
      apply(next);
    },
    [apply, audio],
  );

  const pressHorn = useCallback(() => {
    if (runRef.current) honk(runRef.current);
    audio?.ensureAudio();
    audio?.voices?.(HORN);
    setHonked((count) => count + 1);
  }, [audio]);

  const onAction = useCallback(
    (action: GameAction) => {
      const cur = runRef.current;
      if (!cur || instance.isInputPaused()) return;
      if (action === "move-up" || action === "move-down") {
        setPower(Math.min(powerCap(cur.level), cur.power + (action === "move-up" ? 1 : -1)));
        return;
      }
      if (action === "move-left" || action === "move-right") {
        setBrake(cur.brake + (action === "move-left" ? 1 : -1));
        return;
      }
      if (action === "dash") {
        pressHorn();
        return;
      }
      if (action === "action") tryDoors();
    },
    [instance, pressHorn, setBrake, setPower, tryDoors],
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
      if (typeof patch.freeze === "boolean") frozen.current = patch.freeze;
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
    if (prev !== "in-window" && prev !== "stopped" && run.phase === "in-window") {
      audio?.voices?.(ARRIVE_CHIME);
    }
    if (prev !== "doors-open" && run.phase === "doors-open") audio?.voices?.(DOOR_CHIME);
    phaseRef.current = run.phase;
    if (run.phase === "route-done") {
      stopSound();
      instance.notifyWon(run);
      setScreen("result");
      syncHost();
    }
  }, [audio, instance, run, screen, stopSound, syncHost]);

  const driving = status === "playing" && screen === "drive" && run?.phase !== "route-done";

  useEffect(() => {
    if (!driving) stopSound();
  }, [driving, stopSound]);

  useEffect(() => stopSound, [stopSound]);

  useEffect(() => {
    if (swayOn || !swayRef.current) return;
    swayRef.current.style.transform = "";
  }, [swayOn, screen]);

  useGameLoop({
    enabled: driving,
    onFrame: (dtMs) => {
      const cur = runRef.current;
      if (!cur || instance.isInputPaused() || cur.phase === "route-done") return;
      const dt = dtMs / 1000;
      const next = frozen.current ? cur : step(cur, { type: "tick", dt });
      if (next !== cur) apply(next);

      if (!sound.current) {
        const now = performance.now();
        if (now - soundTriedAt.current > SOUND_RETRY_MS) {
          soundTriedAt.current = now;
          const bed = audio?.bedOutput?.();
          if (bed) {
            sound.current = new DriveSound(bed.ctx, bed.out);
            sound.current.start();
          }
        }
      }
      sound.current?.update(driveMix(next.speed, next.power, next.brake));

      const sameStation = next.stationIndex === cur.stationIndex;
      if (sameStation && jointsCrossed(cur.progress, next.progress) > 0 && next.speed > 0.02) {
        audio?.voices?.(jointClack(next.speed));
        bump.current = 1;
      }

      const el = swayRef.current;
      if (!el || !swayOn) return;
      swayClock.current += dt;
      bump.current = decayBump(bump.current, dt);
      const sway = next.phase === "reversing" ? NO_SWAY : swayAt(swayClock.current, next.speed, bump.current);
      el.style.transform = `translate3d(${sway.x}px, ${sway.y}px, 0) rotate(${sway.rot}deg) scale(1.03)`;
    },
  });

  const choose = (next: LevelId) => {
    picked.current = true;
    setLevel(next);
    saveOrangeExpressLevel(next);
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
          stations={run.stations}
          grades={run.grades}
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
      data-phase={run.phase}
      data-reduced={reducedMotion ? "true" : "false"}
      data-sway={swayOn ? "true" : "false"}
    >
      <OrangeExpressWindshield
        run={run}
        reduced={reducedMotion}
        numbers={display.gaugeNumbers}
        swayRef={swayRef}
      />
      <p className={styles.live} aria-live="polite">
        {liveText(run)}
      </p>
      <OrangeExpressCab
        run={run}
        shake={shake}
        numbers={display.gaugeNumbers}
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
