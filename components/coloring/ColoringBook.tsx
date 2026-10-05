"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ColoringPage } from "@/data/coloring-pages";
import type { ColoringStage } from "@/lib/coloring/flow";
import { getColoringPage, listColoringPages } from "@/lib/coloring-query";
import { catalogColoringDrafts } from "@/lib/coloring/catalog-drafts";
import { ColoringCanvas } from "./ColoringCanvas";
import { ColoringCover } from "./ColoringCover";
import { ColoringPagePicker } from "./ColoringPagePicker";
import { ColoringPageShell } from "./ColoringPageShell";
export default function ColoringBook() {
  const router = useRouter();
  const [stage, setStage] = useState<ColoringStage>("cover");
  const [active, setActive] = useState<ColoringPage | null>(null);
  const [recent, setRecent] = useState<{
    page: ColoringPage;
    src: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const characters = useMemo(() => listColoringPages("character"), []),
    scenes = useMemo(() => listColoringPages("scene"), []);
  const leave = useRef<(() => Promise<boolean>) | null>(null);
  const registerLeave = useCallback((fn: (() => Promise<boolean>) | null) => {
    leave.current = fn;
  }, []);
  const select = useCallback((page: ColoringPage) => {
    setActive(page);
    setStage("canvas");
    const url = new URL(location.href);
    url.searchParams.set("page", page.id);
    history.replaceState(null, "", url);
  }, []);
  const back = () => {
    setActive(null);
    setStage("picker");
    const url = new URL(location.href);
    url.searchParams.delete("page");
    history.replaceState(null, "", url);
  };
  useEffect(() => {
    const id = new URL(location.href).searchParams.get("page");
    if (id) {
      const page = getColoringPage(id);
      if (page) select(page);
      else {
        setStage("picker");
        setMessage("這一頁暫時找不到，選另一頁來塗吧。");
      }
    }
    let cancelled = false,
      url = "";
    void catalogColoringDrafts([...characters, ...scenes])
      .then((entries) => {
        if (cancelled) return;
        const r = entries.find(
          (r) =>
            getColoringPage(r.pageId)?.lineArtRevision === r.lineArtRevision &&
            r.thumbnailBlob,
        );
        if (r?.thumbnailBlob) {
          url = URL.createObjectURL(r.thumbnailBlob);
          setRecent({ page: getColoringPage(r.pageId)!, src: url });
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("草稿暫時讀不到，請重新整理後再試。");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [characters, scenes, select]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage, active]);
  let body: ReactNode;
  if (stage === "canvas" && active)
    body = (
      <ColoringCanvas
        key={active.id}
        page={active}
        onBack={back}
        registerLeave={registerLeave}
      />
    );
  else if (stage === "picker")
    body = (
      <ColoringPagePicker
        characters={characters}
        scenes={scenes}
        onSelect={select}
      />
    );
  else
    body = (
      <ColoringCover
        onOpen={() => setStage("picker")}
        recent={
          recent
            ? {
                title: recent.page.title,
                src: recent.src,
                onContinue: () => select(recent.page),
              }
            : undefined
        }
      />
    );
  return (
    <div
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        const link = target.closest<HTMLAnchorElement>("a[href]");
        if (
          !link ||
          !leave.current ||
          e.ctrlKey ||
          e.metaKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0 ||
          link.origin !== location.origin ||
          link.target === "_blank" ||
          link.pathname === location.pathname
        )
          return;
        e.preventDefault();
        e.stopPropagation();
        const href = link.pathname + link.search + link.hash;
        void leave.current().then((saved) => {
          if (saved) router.push(href);
        });
      }}
    >
      <ColoringPageShell title="繪本著色">
        {message ? <p role="status">{message}</p> : null}
        {body}
      </ColoringPageShell>
    </div>
  );
}
