class_name Sfx
extends Node
## 程序合成音效＋BGM（無外部音檔）。Web 端需 user gesture 後才有聲音，
## 由 main.gd 在第一次輸入時呼叫 unlock()。

const RATE := 22050

var _players: Array[AudioStreamPlayer] = []
var _bgm: AudioStreamPlayer
var _unlocked := false

var snd_count: AudioStreamWAV
var snd_go: AudioStreamWAV
var snd_star: AudioStreamWAV
var snd_boost: AudioStreamWAV
var snd_bump: AudioStreamWAV
var snd_lap: AudioStreamWAV
var snd_finish: AudioStreamWAV
var snd_click: AudioStreamWAV

func _ready() -> void:
	snd_count = _tone([[440.0, 0.14]], 0.5)
	snd_go = _tone([[880.0, 0.3]], 0.55)
	snd_star = _tone([[880.0, 0.07], [1175.0, 0.07], [1568.0, 0.1]], 0.5)
	snd_boost = _sweep(300.0, 1100.0, 0.32, 0.45)
	snd_bump = _tone([[160.0, 0.09]], 0.5, "triangle")
	snd_lap = _tone([[660.0, 0.1], [880.0, 0.14]], 0.5)
	snd_finish = _tone(
		[[523.0, 0.16], [659.0, 0.16], [784.0, 0.16], [1046.0, 0.34]], 0.5
	)
	snd_click = _tone([[520.0, 0.05]], 0.35)
	for i in 6:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_players.append(p)
	_bgm = AudioStreamPlayer.new()
	_bgm.volume_db = -10.0
	add_child(_bgm)

func unlock() -> void:
	if _unlocked:
		return
	_unlocked = true
	_start_bgm()

func play(stream: AudioStreamWAV, volume_db := 0.0) -> void:
	if not _unlocked or stream == null:
		return
	for p in _players:
		if not p.playing:
			p.stream = stream
			p.volume_db = volume_db
			p.play()
			return

func _start_bgm() -> void:
	# 與站內 candy-kart chiptune 主題同曲（lib/gamekit/chiptune-bgm.ts）
	var c5 := 523.0
	var d5 := 587.0
	var e5 := 659.0
	var g5 := 784.0
	var a5 := 880.0
	var b4 := 494.0
	var g4 := 392.0
	var r := 0.0
	var step := 60.0 / 132.0 / 2.0
	var melody := [
		c5, e5, g5, e5, a5, g5, e5, c5, d5, e5, d5, c5, b4, c5, d5, r,
		e5, g5, a5, g5, c5, d5, e5, g5, a5, g5, e5, d5, c5, r, g4, c5,
	]
	var notes: Array = []
	for f in melody:
		notes.append([f, step])
	var loop_wav := _tone(notes, 0.16, "square", true)
	_bgm.stream = loop_wav
	_bgm.play()

func set_bgm_paused(paused: bool) -> void:
	if _bgm:
		_bgm.stream_paused = paused

## notes: [[freq, dur], ...]；freq 0 = 休止。
func _tone(notes: Array, gain: float, wave := "square", loop := false) -> AudioStreamWAV:
	var total := 0.0
	for n in notes:
		total += n[1]
	var frames := int(total * RATE)
	var data := PackedByteArray()
	data.resize(frames * 2)
	var idx := 0
	for n in notes:
		var freq: float = n[0]
		var dur: float = n[1]
		var nframes := int(dur * RATE)
		for i in nframes:
			var t := float(i) / RATE
			var v := 0.0
			if freq > 0.0:
				var phase := fmod(t * freq, 1.0)
				match wave:
					"triangle":
						v = 4.0 * absf(phase - 0.5) - 1.0
					_:
						v = 1.0 if phase < 0.5 else -1.0
				var env := 1.0
				var attack := 0.005
				if t < attack:
					env = t / attack
				var release := 0.04
				if dur - t < release:
					env = maxf(0.0, (dur - t) / release)
				v *= gain * env
			var s := int(clampf(v, -1.0, 1.0) * 32000.0)
			data.encode_s16(idx * 2, s)
			idx += 1
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = RATE
	wav.stereo = false
	wav.data = data
	if loop:
		wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
		wav.loop_begin = 0
		wav.loop_end = idx
	return wav

func _sweep(f0: float, f1: float, dur: float, gain: float) -> AudioStreamWAV:
	var frames := int(dur * RATE)
	var data := PackedByteArray()
	data.resize(frames * 2)
	var phase := 0.0
	for i in frames:
		var t := float(i) / frames
		var freq := lerpf(f0, f1, t)
		phase += freq / RATE
		var v := (1.0 if fmod(phase, 1.0) < 0.5 else -1.0) * gain * (1.0 - t * 0.6)
		data.encode_s16(i * 2, int(clampf(v, -1.0, 1.0) * 32000.0))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = RATE
	wav.stereo = false
	wav.data = data
	return wav
