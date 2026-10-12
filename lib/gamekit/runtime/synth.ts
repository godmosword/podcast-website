/**
 * 宣告式合成音色：音效（sfx 分軌）與店內環境音（music 分軌）共用同一套排程。
 */

/**
 * 一個合成音色：振盪器或白噪音 → 可選濾波 → 快起慢落包絡 → 指定的分軌。
 * 用來做 tone() 做不到的質感音：啵（滑音）、咚（低通噪音）、沙沙（帶通噪音）、叮（高頻正弦疊泛音）。
 * 時間都以 AudioContext 時鐘排程，比 setTimeout 準，整組聲音不會被主執行緒卡頓拆散。
 */
export type SynthVoice = {
  wave: OscillatorType | "noise";
  /** 起始頻率（Hz）；noise 不用。 */
  freq?: number;
  /** 結束頻率：在 glide 秒內指數滑到這裡（啵、咻、問號音）。 */
  freqEnd?: number;
  /** 滑音秒數，預設整段 dur。 */
  glide?: number;
  /** 相對這組聲音起點的延遲（秒）。 */
  at?: number;
  /** 長度（秒），含收尾。 */
  dur: number;
  /** 峰值音量（0–1，會再乘分軌音量）。 */
  vol: number;
  /** 起音秒數，預設 5ms；拉長就是柔和的淡入。 */
  attack?: number;
  filter?: { type: BiquadFilterType; freq: number; freqEnd?: number; q?: number };
};

const noiseByContext = new WeakMap<BaseAudioContext, AudioBuffer>();

/** 1 秒白噪音，每個 AudioContext 建一次重複用（每次從隨機位置開始播，聽起來不會一樣）。 */
export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseByContext.get(ctx);
  if (cached) return cached;
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseByContext.set(ctx, buf);
  return buf;
}

/** 在 start（AudioContext 時間）播一個音色到 dest；不處理靜音，呼叫端負責。 */
export function scheduleVoice(ctx: BaseAudioContext, dest: AudioNode, v: SynthVoice, start: number): void {
  const dur = Math.max(0.02, v.dur);
  const attack = Math.min(Math.max(0.002, v.attack ?? 0.005), dur / 2);
  let src: AudioScheduledSourceNode;
  let begin: () => void;
  if (v.wave === "noise") {
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(ctx);
    n.loop = true;
    begin = () => n.start(start, Math.random() * 0.5);
    src = n;
  } else {
    const osc = ctx.createOscillator();
    osc.type = v.wave;
    const f0 = Math.max(20, v.freq ?? 440);
    osc.frequency.setValueAtTime(f0, start);
    if (v.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, v.freqEnd), start + Math.min(dur, v.glide ?? dur));
    begin = () => osc.start(start);
    src = osc;
  }
  let out: AudioNode = src;
  if (v.filter) {
    const f = ctx.createBiquadFilter();
    f.type = v.filter.type;
    f.frequency.setValueAtTime(v.filter.freq, start);
    if (v.filter.freqEnd) f.frequency.exponentialRampToValueAtTime(v.filter.freqEnd, start + dur);
    f.Q.value = v.filter.q ?? 1;
    out.connect(f);
    out = f;
  }
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, Math.min(1, v.vol)), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  out.connect(gain);
  gain.connect(dest);
  begin();
  src.stop(start + dur + 0.03);
}
