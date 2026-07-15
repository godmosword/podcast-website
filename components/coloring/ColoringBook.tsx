"use client";

import { useState } from "react";
import type { ColoringPage } from "@/data/coloring-pages";
import { listColoringPages } from "@/lib/coloring-query";
import { ColoringCanvas } from "./ColoringCanvas";
import { ColoringPagePicker } from "./ColoringPagePicker";

export default function ColoringBook() {
  const [active, setActive] = useState<ColoringPage | null>(null);
  const characters = listColoringPages("character");
  const scenes = listColoringPages("scene");

  if (active) {
    return <ColoringCanvas page={active} onBack={() => setActive(null)} />;
  }

  return (
    <ColoringPagePicker
      characters={characters}
      scenes={scenes}
      onSelect={setActive}
    />
  );
}
