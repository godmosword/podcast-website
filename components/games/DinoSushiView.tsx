"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import type { DinoSushiInstance } from "@/lib/gamekit/games/dino-sushi/adapter";
import { medalCount, medalFlags } from "@/lib/gamekit/progress/meta";
import { useDinoSushiClayPreload } from "@/lib/games/dino-sushi/art";
import {
  dayStarCount,
  flagsForDay,
  isDayCleared,
  isDayPlayable,
  isDayUnlocked,
  nextDayAfter,
  dayOpenedLine,
  suggestedDay,
} from "@/lib/games/dino-sushi/day-progress";
import { DAY_CARDS } from "@/lib/games/dino-sushi/days";
import { duoduoStickerSrc, useDuoDuoStickerPreload } from "@/lib/games/dino-sushi/duoduo-sticker";
import { roundMedals, type RoundMedals } from "@/lib/games/dino-sushi/medals";
import { SUSHI_SFX } from "@/lib/games/dino-sushi/sfx";
import type { Mode, RoundState } from "@/lib/games/dino-sushi/round";
import { DinoSushiKitchen } from "./DinoSushiKitchen";
import { DinoSushiResult } from "./DinoSushiResult";
import { DinoSushiStickerBook } from "./DinoSushiStickerBook";
import { DinoSushiTitle, type SushiDayFace } from "./DinoSushiTitle";
import { ROUND_SAVE_ERROR, storedClassicFlags, useDinoSushiDayProgress } from "./useDinoSushiDayProgress";
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
  /** 結算主鈕要前進到第幾天；沒有就是 null（留在再做一輪）。 */
  nextDay: number | null;
  /** 這一輪是第一次通關這一天：要宣布下一天開了。 */
  dayOpened: boolean;
  /** 下一天的朋友，第一次通關時站到多多旁邊。 */
  nextDayFace: string | null;
};

function dayFaceSrc(card: (typeof DAY_CARDS)[number]): string {
  if (card.duoduo) return duoduoStickerSrc(card.duoduo);
  return customerById(card.customerId!).sticker;
}

function faceForDay(day: number | null): string | null {
  const card = DAY_CARDS.find((item) => item.day === day);
  return card ? dayFaceSrc(card) : null;
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
  const { dayFlags, classicFlags, saveFailed, recordDay, noteReport, retry: retryProgress } =
    useDinoSushiDayProgress(instance);
  const [outcome, setOutcome] = useState<DinoSushiOutcome | null>(null);
  const sessionRef = useRef({ mode: "order" as Mode, day: 0, firstClear: false });
  const inputPaused = instance.isInputPaused() || status === "paused";

  const onServed = useCallback(() => {
    instance.notifyServed();
  }, [instance]);

  const onDone = useCallback(
    (round: RoundState) => {
      if (round.mode === "order") {
        const medals = roundMedals(round.firstTries);
        const flags = medalFlags(medals.cleared, medals.flawless, medals.collectedAll);
        /* 第 1–3 天只記在壽司屋。第 4 天仍走舊獎牌，已經有的星不會再發。 */
        const days = recordDay(round.day, flags);
        noteReport(round.day >= 1 && round.day <= 3 ? instance.notifyDayCleared(medals) : instance.notifyWon(medals));
        const nextDay = nextDayAfter(round.day, days, storedClassicFlags());
        setOutcome({
          mode: "order",
          plates: round.plates,
          medals,
          seed: round.seed,
          day: round.day,
          variety: round.variety,
          nextDay,
          dayOpened: nextDay !== null && sessionRef.current.firstClear,
          nextDayFace: faceForDay(nextDay),
        });
      } else {
        noteReport(instance.notifyFinished());
        setOutcome({
          mode: "free",
          plates: round.plates,
          medals: null,
          seed: round.seed,
          day: 0,
          variety: round.variety,
          nextDay: null,
          dayOpened: false,
          nextDayFace: null,
        });
      }
      setScreen("result");
      syncHost();
    },
    [instance, noteReport, recordDay, syncHost],
  );

  const play = useDinoSushiPlay({ audio, reducedMotion, inputPaused, onServed, onDone });
  const { actions } = play;
  const voiceOn = soundOn && voiceEnabled && gameVolume > 0;
  const openedDay =
    play.round?.done && sessionRef.current.firstClear ? nextDayAfter(play.round.day, dayFlags, classicFlags) : null;
  const stickers = useDinoSushiStickers(play.round, {
    on: voiceOn,
    volume: gameVolume,
    closing: openedDay !== null ? dayOpenedLine(openedDay) : "",
  });
  const [book, setBook] = useState(false);
  const [queuedSeed, setQueuedSeed] = useState<number | null>(null);
  useEffect(() => {
    setQueuedSeed((current) => current ?? readRoundSeed());
  }, []);
  const unseen = stickers.state.unlocked.filter((id) => !stickers.state.seen.includes(id));
  const nextDay = suggestedDay(dayFlags, classicFlags);
  /* 第 5–8 天還沒做，先不顯示：鎖頭會讓孩子以為是自己沒達標。 */
  const titleDays: SushiDayFace[] = DAY_CARDS.filter((card) => isDayPlayable(card.day)).map((card) => ({
    day: card.day,
    name: card.name,
    src: dayFaceSrc(card),
    stars: dayStarCount(flagsForDay(card.day, dayFlags, classicFlags)),
    unlocked: isDayUnlocked(card.day, dayFlags, classicFlags),
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
      let firstClear = false;
      if (next === "order") {
        day = explicitDay ?? suggestedDay(dayFlags, classicFlags);
        firstClear = !isDayCleared(flagsForDay(day, dayFlags, classicFlags));
        actions.start(next, seed, { day, teach: firstClear });
      } else {
        actions.start(next, seed, "normal");
      }
      sessionRef.current = { mode: next, day, firstClear };
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
  const resultNextDay = screen === "result" ? (outcome?.nextDay ?? null) : null;
  const controllerRef = useRef({ begin, goToTitle, mode, resultNextDay });
  controllerRef.current = { begin, goToTitle, mode, resultNextDay };
  const syncHostRef = useRef(syncHost);
  syncHostRef.current = syncHost;

  useEffect(() => {
    instance.registerController({
      startOrder: () => controllerRef.current.begin("order"),
      startFree: () => controllerRef.current.begin("free"),
      restart: () => {
        /* 外框的 Enter 跟結算主鈕走同一天 */
        const { begin: run, mode: current, resultNextDay: next } = controllerRef.current;
        if (next !== null) {
          run("order", next);
          return;
        }
        const playing = sessionRef.current;
        run(current, playing.mode === "order" && playing.day >= 1 ? playing.day : undefined);
      },
      goToTitle: () => controllerRef.current.goToTitle(),
    });
    instance.notifyReady();
    syncHostRef.current();
  }, [instance]);

  const resultShown = screen === "result" && outcome !== null && !book;
  const saveError = saveFailed ? ROUND_SAVE_ERROR : stickers.saveError;
  const saveNotice = saveError ? (
    <p className={styles.saveError} role="alert">
      <span>{saveError}</span>
      <button
        type="button"
        className={styles.saveRetry}
        onClick={() => {
          retryProgress();
          if (stickers.saveError) stickers.retrySave();
        }}
      >
        再存一次
      </button>
    </p>
  ) : null;

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

        {resultShown ? (
          <DinoSushiResult
            outcome={outcome}
            notice={saveNotice}
            stars={outcome.medals ? medalCount(medalFlags(outcome.medals.cleared, outcome.medals.flawless, outcome.medals.collectedAll)) : null}
            fresh={stickers.state.fresh}
            gift={stickers.state.gift}
            reducedMotion={reducedMotion}
            onReplay={() => begin(outcome.mode, outcome.day >= 1 ? outcome.day : undefined)}
            onNextDay={() => begin("order", outcome.nextDay ?? undefined)}
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

      {/* 結算蓋住整個卡面，而且是圈住焦點的對話框，提示要放進去才看得到、按得到 */}
      {resultShown ? null : saveNotice}

      {/* 單一常駐 live 區：新訂單、多多的字卡 */}
      <p className={styles.visuallyHidden} aria-live="polite">
        {play.message}
      </p>
    </div>
  );
}
