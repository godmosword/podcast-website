import * as THREE from "three";
import type { Renderer } from "../core/Renderer";
import type { Input } from "../core/Input";
import type { AudioBus } from "../core/Audio";
import { getKart } from "../data/karts";
import { getTrack } from "../data/tracks";
import { PHYSICS } from "../data/config";
import { createKartState, kartRenderPose, simulateKart } from "../race/Kart";
import { createKartMesh } from "../race/KartMesh";
import { FollowCamera } from "../race/Camera";
import { Track } from "../race/Track";
import { Hud } from "../ui/Hud";
import { RaceDirector, type RaceFinish, type Racer } from "../race/RaceDirector";
import { driveAI } from "../race/AIDriver";
import { ParticleSystem } from "../fx/Particles";
import { ScreenFx } from "../fx/ScreenFx";
import { Minimap } from "../race/Minimap";
import { ItemSystem } from "../race/Items";
import type { GameScene } from "./SceneManager";

export type RaceSceneOptions = {
  trackId: string;
  kartId: string;
  kidsMode: boolean;
  onFinish: (result: RaceFinish) => void;
};

export class RaceScene implements GameScene {
  private track: Track;
  private director: RaceDirector;
  private meshes = new Map<string, THREE.Group>();
  private cameraCtrl = new FollowCamera();
  private hud: Hud;
  private minimap: Minimap;
  private particles: ParticleSystem;
  private screenFx: ScreenFx;
  private items: ItemSystem;
  private light: THREE.DirectionalLight;
  private lastCountdown = -1;
  private prevBoost = 0;
  private reducedMotion: boolean;
  private finished = false;
  private startPose: { x: number; z: number; yaw: number };

  constructor(
    private renderer: Renderer,
    private input: Input,
    private audio: AudioBus,
    private options: RaceSceneOptions,
  ) {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const trackDef = getTrack(options.trackId);
    this.track = new Track(trackDef);
    this.renderer.scene.add(this.track.group);

    const racers = this.buildRacers(trackDef.laps);
    this.director = new RaceDirector(this.track, racers);
    this.startPose = this.track.getPoseAtProgress(0);

    const hemi = new THREE.HemisphereLight(0xdff3ff, 0x3d5c3a, 0.9);
    this.renderer.scene.add(hemi);

    this.light = new THREE.DirectionalLight(0xffffff, 1.1);
    this.light.position.set(30, 50, 20);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(1024, 1024);
    this.light.shadow.camera.near = 1;
    this.light.shadow.camera.far = 120;
    this.light.shadow.camera.left = -60;
    this.light.shadow.camera.right = 60;
    this.light.shadow.camera.top = 60;
    this.light.shadow.camera.bottom = -60;
    this.renderer.scene.add(this.light);

    this.hud = new Hud();
    this.minimap = new Minimap();
    this.particles = new ParticleSystem(this.renderer.scene);
    this.screenFx = new ScreenFx();
    this.items = new ItemSystem(this.renderer.scene, [0.2, 0.45, 0.7]);
    this.items.placeOnTrack((t) => this.track.getPoseAtProgress(t));

    this.input.setTouchVisible(true);
    this.audio.startEngine();
    if (this.audio) this.audio.startBgm();
  }

  private buildRacers(_laps: number): Racer[] {
    const playerKart = getKart(this.options.kartId);
    const aiDefs = [
      { id: "ai-1", kartId: "monster-truck", name: "怪獸卡車 AI", skill: 0.62 },
      { id: "ai-2", kartId: "xiaohong", name: "小紅 AI", skill: 0.78 },
      { id: "ai-3", kartId: "xiaohuang", name: "小黃 AI", skill: 0.5 },
    ];

    const racers: Racer[] = [];
    const start = this.track.getPoseAtProgress(0);
    const offsets = [
      { x: 0, z: 0 },
      { x: -3, z: -2 },
      { x: 3, z: -2 },
      { x: 0, z: -4 },
    ];

    const player = createKartState(start.x + offsets[0].x, start.z + offsets[0].z, start.yaw);
    const playerMesh = createKartMesh(playerKart);
    this.renderer.scene.add(playerMesh);
    this.meshes.set("player", playerMesh);
    racers.push({
      id: "player",
      name: playerKart.name,
      isPlayer: true,
      state: player,
      stats: playerKart,
      meshId: "player",
      checkpoint: -1,
      prevProgress: 0,
      lap: 0,
      lapStartMs: 0,
      lapTimes: [],
      totalMs: 0,
      finished: false,
      finishPos: 0,
      aiSkill: 1,
    });

    aiDefs.forEach((ai, i) => {
      const stats = getKart(ai.kartId);
      const off = offsets[i + 1] ?? { x: (i - 1) * 3, z: -2 };
      const state = createKartState(start.x + off.x, start.z + off.z, start.yaw);
      const mesh = createKartMesh(stats);
      this.renderer.scene.add(mesh);
      this.meshes.set(ai.id, mesh);
      racers.push({
        id: ai.id,
        name: ai.name,
        isPlayer: false,
        state,
        stats,
        meshId: ai.id,
        checkpoint: -1,
        prevProgress: 0,
        lap: 0,
        lapStartMs: 0,
        lapTimes: [],
        totalMs: 0,
        finished: false,
        finishPos: 0,
        aiSkill: ai.skill,
      });
    });

    return racers;
  }

  fixedUpdate(dt: number): void {
    const now = performance.now();
    const snap = this.director.snapshot(now);

    if (snap.phase === "countdown") {
      const c = Math.ceil(this.director.countdown);
      if (c !== this.lastCountdown) {
        this.audio.sfxCountdown(c);
        this.lastCountdown = c;
      }
    }

    const finish = this.director.fixedUpdate(dt, now);
    if (finish && !this.finished) {
      this.finished = true;
      this.audio.sfxFinish();
      this.options.onFinish(finish);
    }

    const player = this.director.racers.find((r) => r.isPlayer)!;
    const playerPos = this.director.getPosition(player);

    for (const racer of this.director.racers) {
      if (snap.phase === "countdown") continue;
      if (racer.finished && snap.phase === "racing") continue;

      let inp = this.input.poll();
      if (!racer.isPlayer) {
        const band = (playerPos - this.director.getPosition(racer)) / this.director.racers.length;
        inp = driveAI(racer.state, this.track, {
          skill: racer.aiSkill,
          aggression: 0.7,
          name: racer.name,
        }, band, dt);
      }

      const off = this.track.isOffTrack(racer.state.pos.x, racer.state.pos.z);
      const prevBoost = racer.state.boost;
      simulateKart(racer.state, inp, racer.stats, dt, off);

      if (off) {
        const pushed = this.track.pushInside(racer.state.pos.x, racer.state.pos.z);
        racer.state.pos.x = pushed.x;
        racer.state.pos.z = pushed.y;
        racer.state.speed *= 1 - PHYSICS.wallSpeedLoss * 0.15;
      }

      if (racer.isPlayer && snap.phase === "racing") {
        const { progress } = this.track.getProgress(racer.state.pos.x, racer.state.pos.z);
        const item = this.items.tryPickup(racer.state, progress);
        if (item) {
          this.items.applyItem(item, racer.state);
          this.audio.sfxBoost();
          this.screenFx.bump(0.2);
        }
        if (inp.item && racer.state.boost <= 0) {
          racer.state.boost = 0.9;
        }
      }

      if (racer.isPlayer) {
        if (racer.state.drift.active) this.audio.sfxDrift();
        if (prevBoost <= 0 && racer.state.boost > 0) {
          this.audio.sfxBoost();
          this.screenFx.bump(0.18);
        }
      }
    }
  }

  render(alpha: number): void {
    const now = performance.now();
    const snap = this.director.snapshot(now);
    const player = this.director.racers.find((r) => r.isPlayer)!;

    for (const racer of this.director.racers) {
      const pose = kartRenderPose(racer.state, alpha);
      const mesh = this.meshes.get(racer.meshId);
      if (!mesh) continue;
      mesh.position.copy(pose.pos);
      mesh.rotation.y = pose.yaw;
      if (racer.state.drift.active) {
        mesh.rotation.z = racer.state.drift.dir * 0.08;
      } else {
        mesh.rotation.z = 0;
      }
    }

    const shake = this.screenFx.update(1 / 60);
    this.cameraCtrl.update(this.renderer.camera, player.state, alpha, shake);

    const pose = kartRenderPose(player.state, alpha);
    this.light.position.set(pose.pos.x + 25, 45, pose.pos.z + 15);
    this.light.target.position.copy(pose.pos);
    this.light.target.updateMatrixWorld();

    const speedKmh = Math.abs(player.state.speed) * 3.6;
    this.audio.updateEngine(speedKmh);
    this.screenFx.setBoost(player.state.boost > 0, Math.min(1, speedKmh / 55));

    if (player.state.drift.active) {
      this.particles.emitSmoke(
        pose.pos.x,
        pose.pos.y,
        pose.pos.z,
        Math.min(1, player.state.drift.charge),
        this.reducedMotion || this.options.kidsMode,
      );
    }
    this.particles.update(1 / 60, this.renderer.camera);

    this.hud.update({
      speedKmh,
      boost: player.state.boost,
      drifting: player.state.drift.active,
      offTrack: player.state.offTrack,
      phase: snap.phase,
      countdown: snap.countdown,
      lap: player.lap,
      totalLaps: snap.totalLaps,
      position: snap.playerPosition,
      racerCount: snap.racers.length,
      lapMs: snap.currentLapMs,
      raceMs: snap.raceMs,
    });
    this.minimap.update(this.track, snap.racers);

    this.renderer.render();
  }

  dispose(): void {
    this.hud.dispose();
    this.minimap.dispose();
    this.particles.dispose();
    this.screenFx.dispose();
    this.items.dispose();
    this.input.setTouchVisible(false);
    this.audio.stopEngine();
    for (const mesh of this.meshes.values()) {
      this.renderer.scene.remove(mesh);
    }
    this.meshes.clear();
    this.renderer.scene.remove(this.track.group);
  }
}
