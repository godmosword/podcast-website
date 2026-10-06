"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ColoringPage } from "@/data/coloring-pages";
import type { ColoringStage } from "@/lib/coloring/flow";
import { getColoringPage, listColoringPages } from "@/lib/coloring-query";
import { ColoringCanvas } from "./ColoringCanvas";
import { ColoringCover } from "./ColoringCover";
import { ColoringPagePicker } from "./ColoringPagePicker";
import { ColoringPageShell } from "./ColoringPageShell";
export default function ColoringBook() {
  const [stage, setStage] = useState<ColoringStage>("cover");
  const [active, setActive] = useState<ColoringPage | null>(null);
  const [message, setMessage] = useState("");
  const characters = useMemo(() => listColoringPages("character"), []),
    scenes = useMemo(() => listColoringPages("scene"), []);
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
    if (!id) return;
    const page = getColoringPage(id);
    if (page) select(page);
    else {
      setStage("picker");
      setMessage("這一頁暫時找不到，選另一頁來塗吧。");
    }
  }, [select]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage, active]);
  let body: ReactNode;
  if (stage === "canvas" && active)
    body = <ColoringCanvas key={active.id} page={active} onBack={back} />;
  else if (stage === "picker")
    body = (
      <ColoringPagePicker
        characters={characters}
        scenes={scenes}
        onSelect={select}
      />
    );
  else
    body = <ColoringCover onOpen={() => setStage("picker")} />;
  return (
    <ColoringPageShell title="繪本塗塗鴉">
      {message ? <p role="status">{message}</p> : null}
      {body}
    </ColoringPageShell>
  );
}
