import { Loop } from "./Loop";
import { Renderer } from "./Renderer";
import { Input } from "./Input";
import { Assets } from "./Assets";
import { AudioBus } from "./Audio";
import { loadSave, writeSave, recordRaceResult, medalForLapMs, type KartSave } from "./Save";
import { SceneManager } from "../scenes/SceneManager";
import { RaceScene } from "../scenes/RaceScene";
import { Menus } from "../ui/Menus";
import { getTrack } from "../data/tracks";
import { Net } from "../net/Net";

export class Game {
  private renderer: Renderer;
  private input = new Input();
  private loop = new Loop();
  private scenes = new SceneManager();
  private assets = new Assets();
  private audio = new AudioBus();
  private net = new Net();
  private save: KartSave;
  private menus: Menus;
  private started = false;

  constructor(private mount: HTMLElement) {
    this.renderer = new Renderer(mount);
    this.save = loadSave();
    this.menus = new Menus(
      () => this.save,
      {
        onStartRace: () => this.startRace(),
        onOpenGarage: () => this.menus.showGarage(),
        onSelectKart: (id) => {
          this.save = { ...this.save, selectedKart: id };
          writeSave(this.save);
        },
        onBackTitle: () => {
          this.scenes.dispose();
          this.menus.showTitle();
        },
        onToggleSound: (on) => {
          this.save = { ...this.save, soundOn: on };
          writeSave(this.save);
          this.audio.setSound(on);
        },
        onToggleMusic: (on) => {
          this.save = { ...this.save, musicOn: on };
          writeSave(this.save);
          this.audio.setMusic(on);
        },
        onRematch: () => this.startRace(),
      },
    );

    void this.boot();
  }

  private async boot(): Promise<void> {
    await this.assets.load([
      { label: "初始化引擎…", run: () => this.input.attach() },
      { label: "載入音效…", run: () => {
        this.audio.setSound(this.save.soundOn);
        this.audio.setMusic(this.save.musicOn);
      }},
      { label: "檢查多人模組…", run: async () => {
        if (Net.MULTIPLAYER_ENABLED) await this.net.connect();
      }},
      { label: "準備賽道…", run: () => getTrack(this.save.selectedTrack) },
    ]);

    this.loop.start({
      fixedUpdate: (dt) => this.scenes.fixedUpdate(dt),
      render: (alpha) => this.scenes.render(alpha),
    });

    this.menus.showTitle();
    this.started = true;

    const unlock = () => {
      this.audio.unlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  private startRace(): void {
    this.audio.unlock();
    this.scenes.set(
      new RaceScene(this.renderer, this.input, this.audio, {
        trackId: this.save.selectedTrack,
        kartId: this.save.selectedKart,
        kidsMode: this.save.kidsMode,
        onFinish: (finish) => this.onRaceFinish(finish),
      }),
    );
  }

  private onRaceFinish(finish: import("../race/RaceDirector").RaceFinish): void {
    const track = getTrack(this.save.selectedTrack);
    this.save = recordRaceResult(
      this.save,
      track.id,
      finish.totalMs,
      finish.bestLapMs,
      track.medals,
    );
    writeSave(this.save);
    const medal = medalForLapMs(finish.bestLapMs, track.medals.gold, track.medals.silver);
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        {
          source: "cheche-kart",
          type: "race-finish",
          playerPos: finish.playerPos,
          totalMs: finish.totalMs,
          bestLapMs: finish.bestLapMs,
          trackId: track.id,
        },
        window.location.origin,
      );
    }
    this.scenes.dispose();
    this.menus.showResults(finish, medal, track.name);
  }

  dispose(): void {
    if (!this.started) return;
    this.loop.stop();
    this.scenes.dispose();
    this.menus.dispose();
    this.input.detach();
    this.audio.stopBgm();
    this.net.disconnect();
    this.renderer.dispose();
  }
}
