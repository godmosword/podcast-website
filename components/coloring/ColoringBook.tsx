"use client";

import { useState, type ReactNode } from "react";
import type { ColoringPage } from "@/data/coloring-pages";
import {
  coloringShellShowsTitle,
  type ColoringStage,
} from "@/lib/coloring/flow";
import { listColoringPages } from "@/lib/coloring-query";
import { ColoringCanvas } from "./ColoringCanvas";
import { ColoringCover } from "./ColoringCover";
import { ColoringPagePicker } from "./ColoringPagePicker";
import { ColoringPageShell } from "./ColoringPageShell";

export default function ColoringBook() {
  const [stage, setStage] = useState<ColoringStage>("cover");
  const [active, setActive] = useState<ColoringPage | null>(null);
  const characters = listColoringPages("character");
  const scenes = listColoringPages("scene");

  let body: ReactNode;
  if (stage === "canvas" && active) {
    body = (
      <ColoringCanvas
        page={active}
        onBack={() => {
          setActive(null);
          setStage("picker");
        }}
      />
    );
  } else if (stage === "picker") {
    body = (
      <ColoringPagePicker
        characters={characters}
        scenes={scenes}
        onSelect={(page) => {
          setActive(page);
          setStage("canvas");
        }}
        onBackToCover={() => setStage("cover")}
      />
    );
  } else {
    body = <ColoringCover onOpen={() => setStage("picker")} />;
  }

  return (
    <ColoringPageShell
      title="繪本著色"
      showTitle={coloringShellShowsTitle(stage)}
    >
      {body}
    </ColoringPageShell>
  );
}
