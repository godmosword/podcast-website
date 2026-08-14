import type { PlaygroundType } from "@/data/playgrounds";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import styles from "./PlayMap.module.css";
import { FarmScene } from "./type-scenes/FarmScene";
import { IndoorParkScene } from "./type-scenes/IndoorParkScene";
import { MuseumScene } from "./type-scenes/MuseumScene";
import { OtherScene } from "./type-scenes/OtherScene";
import { ParkScene } from "./type-scenes/ParkScene";
import { ThemeParkScene } from "./type-scenes/ThemeParkScene";
import { ZooScene } from "./type-scenes/ZooScene";

type PlaygroundTypeMarkProps = {
  type: PlaygroundType;
};

function Scene({ type }: { type: PlaygroundType }) {
  switch (type) {
    case "公園":
      return <ParkScene />;
    case "室內樂園":
      return <IndoorParkScene />;
    case "主題樂園":
      return <ThemeParkScene />;
    case "博物館":
      return <MuseumScene />;
    case "動物園":
      return <ZooScene />;
    case "農場":
      return <FarmScene />;
    case "其他":
      return <OtherScene />;
  }
}

/** 類型 1:1 plate，純裝飾。 */
export function PlaygroundTypeMark({ type }: PlaygroundTypeMarkProps) {
  return (
    <span
      className={styles.typeScene}
      data-type={playgroundTypeVisualKey(type)}
      data-scene=""
      aria-hidden
    >
      <Scene type={type} />
    </span>
  );
}
