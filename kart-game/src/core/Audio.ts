/** Web Audio 合成 BGM/SFX（免音檔依賴，Phase 4）。 */
export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private soundOn = true;
  private musicOn = true;
  private unlocked = false;

  ensure(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.music = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.music.connect(this.master);
    this.sfx.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.applyVolumes();
  }

  unlock(): void {
    this.ensure();
    if (!this.ctx || this.unlocked) return;
    void this.ctx.resume();
    this.unlocked = true;
  }

  setSound(on: boolean): void {
    this.soundOn = on;
    this.applyVolumes();
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (on && this.unlocked) this.startBgm();
    else this.stopBgm();
  }

  private applyVolumes(): void {
    if (!this.master || !this.music || !this.sfx) return;
    this.master.gain.value = this.soundOn ? 0.9 : 0;
    this.music.gain.value = this.musicOn ? 0.22 : 0;
    this.sfx.gain.value = this.soundOn ? 0.45 : 0;
  }

  startBgm(): void {
    this.ensure();
    this.unlock();
    if (!this.ctx || !this.musicOn || this.musicTimer) return;
    const notes = [261.6, 329.6, 392, 523.3];
    let i = 0;
    this.musicTimer = setInterval(() => {
      this.tone(notes[i % notes.length], 0.18, "triangle", 0.08, true);
      i++;
    }, 420);
  }

  stopBgm(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.stopEngine();
  }

  startEngine(): void {
    this.ensure();
    this.unlock();
    if (!this.ctx || this.engineOsc) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 80;
    this.engineGain.gain.value = 0.02;
    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.sfx!);
    this.engineOsc.start();
  }

  updateEngine(speedKmh: number): void {
    if (!this.engineOsc || !this.engineGain) return;
    this.engineOsc.frequency.value = 70 + speedKmh * 1.8;
    this.engineGain.gain.value = 0.015 + Math.min(0.04, speedKmh * 0.0004);
  }

  stopEngine(): void {
    this.engineOsc?.stop();
    this.engineOsc = null;
    this.engineGain = null;
  }

  tone(
    freq: number,
    dur: number,
    type: OscillatorType = "square",
    vol = 0.12,
    toMusic = false,
  ): void {
    if (!this.soundOn || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = vol;
    osc.connect(g);
    g.connect(toMusic ? this.music! : this.sfx!);
    const t = this.ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  sfxBoost(): void {
    [440, 554, 659].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, "triangle", 0.1), i * 70));
  }

  sfxDrift(): void {
    this.tone(180, 0.06, "sawtooth", 0.04);
  }

  sfxCountdown(n: number): void {
    this.tone(n === 0 ? 880 : 520, 0.15, "square", 0.12);
  }

  sfxFinish(): void {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, "triangle", 0.1), i * 100));
  }
}
