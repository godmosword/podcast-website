"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import Icon from "@/components/ui/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useModalLayer } from "@/hooks/useModalLayer";
import { EPISODE_BOARD_ANCHOR_ID } from "@/lib/episode-board-anchor";
import { isSafeInternalHref } from "@/lib/episode-board-href";
import { transitionLandingToAnchor } from "@/lib/landing-scroll";
import {
  boardClockPaused,
  createBoardSim,
  deltaSeconds,
  projectNorm,
  stepBoard,
  type BoardSimState,
  type BoardView,
} from "@/lib/episode-board-sim";
import { mapDepthZ } from "@/lib/universe-depth";
import type { EpisodeBoardActor } from "@/lib/episode-board-types";
import EpisodeBoardActorArt from "./EpisodeBoardActorArt";
import EpisodeBoardMap from "./EpisodeBoardMap";
import styles from "./EpisodeBoard.module.css";

type EpisodeBoardProps = {
  actors: EpisodeBoardActor[];
  nextAnchorId: string;
};

export default function EpisodeBoard({ actors, nextAnchorId }: EpisodeBoardProps) {
  const safeActors = useMemo(
    () => actors.filter((actor) => isSafeInternalHref(actor.href)),
    [actors],
  );
  const featured = safeActors.find((actor) => actor.featured) ?? safeActors[0];
  const initial = useMemo(() => createBoardSim(safeActors), [safeActors]);
  const [openId, setOpenId] = useState<string | null>(null);
  const openActor = safeActors.find((actor) => actor.id === openId) ?? null;

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const slotRefs = useRef(new Map<string, HTMLDivElement>());

  useFocusTrap(openActor !== null, dialogRef, {
    initialFocus: "first",
    returnFocus: false,
  });
  useModalLayer({
    open: openActor !== null,
    onClose: () => setOpenId(null),
    keepRefs: [dialogRef],
    returnFocusRef,
    extraScrollLockSelector: "[data-landing-scroll]",
  });

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    let stopped = false;
    let raf = 0;
    let last: number | null = null;
    let lastTs: number | null = null;
    let visible = false;
    let pageVisible = document.visibilityState !== "hidden";
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = Boolean(motionQuery?.matches);
    let sim: BoardSimState = createBoardSim(safeActors);
    let simAcc = 0;
    let wallAcc = 0;
    let samples = 0;

    const viewOf = (): BoardView => ({
      width: Math.max(1, stage.clientWidth),
      height: Math.max(1, stage.clientHeight),
    });

    const placeSlots = (state: BoardSimState) => {
      for (const actor of state.actors) {
        const slot = slotRefs.current.get(actor.id);
        if (!slot) continue;
        const norm = projectNorm(actor.x, actor.y);
        slot.style.setProperty("--u", `${norm.u * 100}%`);
        slot.style.setProperty("--v", `${norm.v * 100}%`);
        slot.style.zIndex = String(mapDepthZ(actor.y, "roamer"));
      }
    };

    const pausedNow = () => boardClockPaused({ reduced, visible, pageVisible });

    const applyFlags = () => {
      section.setAttribute("data-motion", reduced ? "reduced" : "full");
      section.setAttribute("data-paused", pausedNow() ? "true" : "false");
      section.dataset.ready = "true";
    };

    const publishFrame = (simMs: number, wallMs: number) => {
      simAcc += simMs;
      wallAcc += wallMs;
      samples += 1;
      if (samples < 12) return;
      section.dataset.simMs = (simAcc / samples).toFixed(2);
      section.dataset.frameMs = (wallAcc / samples).toFixed(2);
      section.dataset.frames = String(samples);
      simAcc = 0;
      wallAcc = 0;
      samples = 0;
    };

    const loop = (ts: number) => {
      if (stopped) return;
      const wall = lastTs === null ? 16 : ts - lastTs;
      lastTs = ts;
      const paused = pausedNow();
      const clock = deltaSeconds(ts, last, paused);
      last = clock.last;
      const started = performance.now();
      if (!paused && clock.dt > 0) sim = stepBoard(sim, clock.dt, viewOf());
      placeSlots(sim);
      publishFrame(performance.now() - started, wall);
      applyFlags();
      if (!paused) raf = window.requestAnimationFrame(loop);
    };

    const kick = () => {
      if (stopped) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
      last = null;
      if (reduced) sim = createBoardSim(safeActors);
      lastTs = null;
      placeSlots(sim);
      applyFlags();
      if (!pausedNow()) raf = window.requestAnimationFrame(loop);
    };

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          kick();
        },
        { threshold: 0.05 },
      );
      observer.observe(stage);
    } else {
      visible = true;
    }

    const onPage = () => {
      pageVisible = document.visibilityState !== "hidden";
      kick();
    };
    document.addEventListener("visibilitychange", onPage);

    const onMotion = () => {
      reduced = Boolean(motionQuery?.matches);
      kick();
    };
    motionQuery?.addEventListener?.("change", onMotion);

    let resize: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resize = new ResizeObserver(() => placeSlots(sim));
      resize.observe(stage);
    }

    kick();

    return () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
      resize?.disconnect();
      document.removeEventListener("visibilitychange", onPage);
      motionQuery?.removeEventListener?.("change", onMotion);
    };
  }, [safeActors]);

  function openFrom(actor: EpisodeBoardActor, button: HTMLButtonElement) {
    returnFocusRef.current = button;
    setOpenId(actor.id);
  }

  function onActorKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp"
    ) {
      return;
    }
    event.preventDefault();
    const dir = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = safeActors[(index + dir + safeActors.length) % safeActors.length];
    if (!next) return;
    slotRefs.current.get(next.id)?.querySelector("button")?.focus();
  }

  function onSkip(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    void transitionLandingToAnchor(nextAnchorId).then((ok) => {
      if (ok) return;
      document.getElementById(nextAnchorId)?.scrollIntoView({ block: "start" });
    });
  }

  return (
    <section
      ref={sectionRef}
      id={EPISODE_BOARD_ANCHOR_ID}
      className={styles.section}
      aria-labelledby="episode-board-title"
      data-episode-board=""
    >
      <header className={styles.header}>
        <h2 id="episode-board-title" className={styles.title}>
          這一集的車車
        </h2>
        <p className={styles.hint}>
          {featured
            ? `${featured.name}${featured.actionLabel}。點一輛車車，聽這一集。`
            : "車車還在路上，晚點再來找他們。"}
        </p>
      </header>
      <div ref={stageRef} className={styles.stage}>
        <EpisodeBoardMap>
          {safeActors.length === 0 ? (
            <p className={styles.empty}>車車還在路上，晚點再來找他們。</p>
          ) : null}
          {safeActors.map((actor, index) => {
            const spot = initial.actors.find((item) => item.id === actor.id);
            const norm = projectNorm(spot?.x ?? 40, spot?.y ?? 40);
            return (
              <div
                key={actor.id}
                className={styles.actorSlot}
                ref={(node) => {
                  if (node) slotRefs.current.set(actor.id, node);
                  else slotRefs.current.delete(actor.id);
                }}
                style={
                  {
                    "--u": `${norm.u * 100}%`,
                    "--v": `${norm.v * 100}%`,
                    zIndex: mapDepthZ(spot?.y ?? 40, "roamer"),
                  } as CSSProperties
                }
              >
                <button
                  type="button"
                  className={styles.hit}
                  aria-pressed={openId === actor.id}
                  aria-haspopup="dialog"
                  onClick={(event) => openFrom(actor, event.currentTarget)}
                  onKeyDown={(event) => onActorKeyDown(event, index)}
                >
                  <EpisodeBoardActorArt character={actor.character} action={actor.action} />
                  <span className="sr-only">
                    {actor.name}，{actor.actionLabel}。{actor.title}
                  </span>
                </button>
              </div>
            );
          })}
        </EpisodeBoardMap>
      </div>
      <div className={styles.dock}>
        <a
          href={`#${nextAnchorId}`}
          className={styles.skip}
          aria-label="捲動到下一個專區"
          onClick={onSkip}
        >
          <Icon name="chevron-down" size={18} />
        </a>
      </div>
      {openActor ? (
        <div
          ref={dialogRef}
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="episode-board-dialog-title"
        >
          {openActor.featured ? <p className={styles.chip}>這一集</p> : null}
          <h3 id="episode-board-dialog-title" className={styles.dialogTitle}>
            {openActor.title}
          </h3>
          <p className={styles.summary}>{openActor.summary}</p>
          <div className={styles.actions}>
            <Link href={openActor.href} className={styles.play}>
              <Icon name="play" size={18} />
              播放這一集
            </Link>
            <button type="button" className={styles.close} onClick={() => setOpenId(null)}>
              關掉
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
