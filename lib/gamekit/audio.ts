/**
 * 音訊模組橋接說明（Phase 0）。
 *
 * 現有遊戲使用 `hooks/useGameAudio.ts`（WebAudio 即時合成 SFX）。
 * Phase 3 在此擴充：
 * - BGM 循環（HTMLAudioElement 或 WebAudio buffer）
 * - music/sfx 分軌音量
 * - 使用者手勢解鎖（autoplay policy）
 *
 * 用法：各遊戲 Game 元件繼續用 useGameAudio；新外框場景用 GameKitAudioBus。
 */

export type AudioBusConfig = {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
};

export class GameKitAudioBus {
  private config: AudioBusConfig = {
    musicVolume: 0.6,
    sfxVolume: 0.8,
    muted: false,
  };

  get volume(): AudioBusConfig {
    return { ...this.config };
  }

  setMusicVolume(v: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, v));
  }

  setSfxVolume(v: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, v));
  }

  setMuted(muted: boolean): void {
    this.config.muted = muted;
  }

  /** Phase 3：播放 BGM loop。 */
  playBgm(_url: string): void {
    // stub
  }

  stopBgm(): void {
    // stub
  }
}
