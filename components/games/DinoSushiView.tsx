"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import type { DinoSushiInstance } from "@/lib/gamekit/games/dino-sushi/adapter";
import { loadDinoSushiDays, saveDinoSushiDayFlags } from "@/lib/gamekit/progress/dino-sushi-days";
import { medalCount, medalFlags } from "@/lib/gamekit/progress/meta";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import { useDinoSushiClayPreload } from "@/lib/games/dino-sushi/art";
import {
  dayStarCount,
  emptyDayFlags,
  flagsForDay,
  isDayCleared,
  isDayPlayable,
  isDayUnlocked,
  suggestedDay,
} from "@/lib/games/dino-sushi/day-progress";
import { DAY_CARDS } from "@/lib/games/dino-sushi/days";
import { duoduoStickerSrc, useDuoDuoStickerPreload } from "@/lib/games/dino-sushi/duoduo-sticker";
import { DINO_SUSHI_LEVEL_INDEX, roundMedals, type RoundMedals } from "@/lib/games/dino-sushi/medals";
import { SUSHI_SFX } from "@/lib/games/dino-sushi/sfx";
import type { Mode, RoundState } from "@/lib/games/dino-sushi/round";
import { PROGRESS_CHANGE_EVENT } from "@/lib/progress-keys";
import { DinoSushiKitchen } from "./DinoSushiKitchen";
import { DinoSushiResult } from "./DinoSushiResult";
import { DinoSushiStickerBook } from "./DinoSushiStickerBook";
import { DinoSushiTitle, type SushiDayFace } from "./DinoSushiTitle";
import { playVoices, useDinoSushiPlay } from "./useDinoSushiPlay";
import { useDinoSushiStickers } from "./useDinoSushiStickers";
import { DINO_SUSHI_STICKER_TOTAL } from "@/lib/games/dino-sushi/stickers";
import { readRoundSeed, type RoundVariety } from "@/lib/games/dino-sushi/variety";
import { customerById } from "@/lib/games/dino-sushi/customers";
import styles from "./DinoSushiView.module.css";

type Screen = "title" | "kitchen" | "result";

export type DinoSushiViewProps = OverlayProps & {
  audio?: GameAudioBus;
  instance: DinoSushiInstance;
};

export type DinoSushiOutcome = {
  mode: Mode;
  plates: RoundState["plates"];
  medals: RoundMedals | null;
  seed: number;
  /** 點餐是第幾天；自由做是 0。再做一輪回到同一天。 */
  day: number;
  variety: RoundVariety;
};

function storedClassicFlags(): number {
  return loadPlayerProfile().medals["dino-sushi"]?.[DINO_SUSHI_LEVEL_INDEX] ?? 0;
}

function dayFaceSrc(card: (typeof DAY_CARDS)[number]): string {
  if (card.duoduo) return duoduoStickerSrc(card.duoduo);
  return customerById(card.customerId!).sticker;
}

export function DinoSushiView({
  reducedMotion,
  status,
  syncHost,
  audio,
  instance,
  soundOn,
  gameVolume,
  voiceEnabled,
}: DinoSushiViewProps) {
  useDuoDuoStickerPreload();
  useDinoSushiClayPreload();
  const [screen, setScreen] = useState<Screen>("title");
  const [mode, setMode] = useState<Mode>("order");
  const [dayFlags, setDayFlags] = useState<number[]>(() =>
    typeof window === "undefined" ? emptyDayFlags() : loadDinoSushiDays(),
  );
  const [classicFlags, setClassicFlags] = useState(() => (typeof window === "undefined" ? 0 : storedClassicFlags()));
  const [outcome, setOutcome] = useState<DinoSushiOutcome | null>(null);
  const inputPaused = instance.isInputPaused() || status === "paused";

  const refreshDays = useCallback(() => {
    setDayFlags(loadDinoSushiDays());
    setClassicFlags(storedClassicFlags());
  }, []);
  useEffect(() => {
    refreshDays();
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, refreshDays);
    window.addEventListener(PROGRESS_CHANGE_EVENT, refreshDays);
    return () => {
      window.removeEventListener(GAMEKIT_PROGRESS_EVENT, refreshDays);
      window.removeEventListener(PROGRESS_CHANGE_EVENT, refreshDays);
    };
  }, [refreshDays]);

  const onServed = useCallback(() => {
    instance.notifyServed();
  }, [instance]);

  const onDone = useCallback(
    (round: RoundState) => {
      if (round.mode === "order") {
        const medals = roundMedals(round.firstTries);
        const flags = medalFlags(medals.cleared, medals.flawless, medals.collectedAll);
        /* 第 1–3 天只記在壽司屋。第 4 天仍走舊獎牌，已經有的星不會再發。 */
        if (round.day >= 1 && round.day <= 3) {
          setDayFlags(saveDinoSushiDayFlags(round.day, flags));
          instance.notifyDayCleared(medals);
        } else {
          instance.notifyWon(medals);
        }
        setOutcome({
          mode: "order",
          plates: round.plates,
          medals,
          seed: round.seed,
          day: round.day,
          variety: round.variety,
        });
      } else {
        instance.notifyFinished();
        setOutcome({
          mode: "free",
          plates: round.plates,
          medals: null,
          seed: round.seed,
          day: 0,
          variety: round.variety,
        });
      }
      setScreen("result");
      syncHost();
    },
    [instance, syncHost],
  );

  const play = useDinoSushiPlay({ audio, reducedMotion, inputPaused, onServed, onDone });
  const { actions } = play;
  const voiceOn = soundOn && voiceEnabled && gameVolume > 0;
  const stickers = useDinoSushiStickers(play.round, { on: voiceOn, volume: gameVolume });
  const [book, setBook] = useState(false);
  const [queuedSeed, setQueuedSeed] = useState<number | null>(null);
  useEffect(() => {
    setQueuedSeed((current) => current ?? readRoundSeed());
  }, []);
  const unseen = stickers.state.unlocked.filter((id) => !stickers.state.seen.includes(id));
  const nextDay = suggestedDay(dayFlags, classicFlags);
  const sessionRef = useRef({ mode: "order" as Mode, day: 0 });
  const titleDays: SushiDayFace[] = DAY_CARDS.map((card) => ({
    day: card.day,
    name: card.name,
    src: dayFaceSrc(card),
    stars: dayStarCount(flagsForDay(card.day, dayFlags, classicFlags)),
    unlocked: isDayUnlocked(card.day, dayFlags, classicFlags),
    playable: isDayPlayable(card.day),
    current: card.day === nextDay,
  }));

  const begin = useCallback(
    (next: Mode, explicitDay?: number) => {
      audio?.ensureAudio();
      playVoices(audio, SUSHI_SFX.welcome);
      stickers.beginRound();
      setBook(false);
      setMode(next);
      setOutcome(null);
      const seed = queuedSeed ?? readRoundSeed();
      let day = 0;
      if (next === "order") {
        day = explicitDay ?? suggestedDay(dayFlags, classicFlags);
        const teach = !isDayCleared(flagsForDay(day, dayFlags, classicFlags));
        actions.start(next, seed, { day, teach });
      } else {
        actions.start(next, seed, "normal");
      }
      sessionRef.current = { mode: next, day };
      setQueuedSeed(readRoundSeed());
      setScreen("kitchen");
      instance.notifyPlaying(next);
      syncHost();
    },
    [actions, audio, classicFlags, dayFlags, instance, queuedSeed, stickers, syncHost],
  );

  const goToTitle = useCallback(() => {
    actions.leave();
    setBook(false);
    setOutcome(null);
    setScreen("title");
    instance.notifyReady();
    syncHost();
  }, [actions, instance, syncHost]);

  const closeBook = useCallback(() => {
    stickers.markSeen();
    setBook(false);
  }, [stickers]);

  /* 標題鈕若在摺線下面，點下去的捲動會留著，雨棚上的排隊就被黏住的抬頭切掉。進廚房回到頂。 */
  useEffect(() => {
    if (screen !== "kitchen") return;
    window.scrollTo(0, 0);
  }, [screen]);

  /* controller 經 ref 轉呼叫、只在 mount 註冊一次（同消消樂 G-C1：避免 paused 連鎖重註冊把狀態打回 ready）。 */
  const controllerRef = useRef({ begin, goToTitle, mode });
  controllerRef.current = { begin, goToTitle, mode };
  const syncHostRef = useRef(syncHost);
  syncHostRef.current = syncHost;

  useEffect(() => {
    instance.registerController({
      startOrder: () => controllerRef.current.begin("order"),
      startFree: () => controllerRef.current.begin("free"),
      restart: () => {
        const playing = sessionRef.current;
        controllerRef.current.begin(
          controllerRef.current.mode,
          playing.mode === "order" && playing.day >= 1 ? playing.day : undefined,
        );
      },
      goToTitle: () => controllerRef.current.goToTitle(),
    });
    instance.notifyReady();
    syncHostRef.current();
  }, [instance]);

  return (
    <div
      className={styles.surface}
      data-screen={screen}
      data-mode={screen === "kitchen" ? mode : undefined}
      data-testid="dino-sushi"
      data-reduced={reducedMotion ? "true" : undefined}
      /* 外框的操作提示只在廚房顯示；標題與結算沒有可操作的砧板 */
      data-play-hints={screen === "kitchen" ? undefined : "off"}
    >
      <div className={styles.stage} inert={book} aria-hidden={book ? true : undefined}>
        {screen === "title" ? (
          <DinoSushiTitle
            days={titleDays}
            stickerCount={stickers.state.unlocked.length}
            stickerTotal={DINO_SUSHI_STICKER_TOTAL}
            stickerNew={unseen.length > 0}
            onStart={() => begin("order")}
            onPickDay={(day) => begin("order", day)}
            onFree={() => begin("free")}
            onBook={() => setBook(true)}
          />
        ) : null}

        {screen !== "title" && play.round ? (
          <DinoSushiKitchen
            play={play}
            reducedMotion={reducedMotion}
            inputPaused={inputPaused}
            soundOn={soundOn}
            gameVolume={gameVolume}
            voiceEnabled={voiceEnabled}
            ownedStickers={stickers.state.unlocked}
          />
        ) : null}

        {screen === "result" && outcome && !book ? (
          <DinoSushiResult
            outcome={outcome}
            stars={outcome.medals ? medalCount(medalFlags(outcome.medals.cleared, outcome.medals.flawless, outcome.medals.collectedAll)) : null}
            fresh={stickers.state.fresh}
            gift={stickers.state.gift}
            reducedMotion={reducedMotion}
            onReplay={() => begin(outcome.mode, outcome.day >= 1 ? outcome.day : undefined)}
            onTitle={goToTitle}
            onBook={() => setBook(true)}
          />
        ) : null}
      </div>

      {book ? (
        <DinoSushiStickerBook
          unlocked={stickers.state.unlocked}
          seen={stickers.state.seen}
          reducedMotion={reducedMotion}
          onClose={closeBook}
          onSpeak={stickers.speak}
        />
      ) : null}

      {stickers.saveError ? (
        <p className={styles.saveError} role="alert">
          <span>{stickers.saveError}</span>
          <button type="button" className={styles.saveRetry} onClick={stickers.retrySave}>
            再存一次
          </button>
        </p>
      ) : null}

      {/* 單一常駐 live 區：新訂單、多多的字卡 */}
      <p className={styles.visuallyHidden} aria-live="polite">
        {play.message}
      </p>
    </div>
  );
}
