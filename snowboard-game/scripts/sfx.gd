class_name SnowboardSfx
extends Node

const RATE := 22050

var snd_count: AudioStreamWAV
var snd_go: AudioStreamWAV
var snd_pickup: AudioStreamWAV
var snd_jump: AudioStreamWAV
var snd_land: AudioStreamWAV
var snd_bump: AudioStreamWAV
var snd_checkpoint: AudioStreamWAV
var snd_finish: AudioStreamWAV
var snd_click: AudioStreamWAV
var _players: Array[AudioStreamPlayer] = []
var _bgm: AudioStreamPlayer
var _unlocked := false
var master_volume := 1.0

func _ready() -> void:
	snd_count = _tone([[440.0, 0.13]], 0.45)
	snd_go = _tone([[660.0, 0.08], [990.0, 0.24]], 0.48)
	snd_pickup = _tone([[880.0, 0.06], [1175.0, 0.07], [1568.0, 0.11]], 0.43)
	snd_jump = _sweep(330.0, 780.0, 0.22, 0.38)
	snd_land = _tone([[150.0, 0.08]], 0.34, "triangle")
	snd_bump = _tone([[95.0, 0.18]], 0.5, "triangle")
	snd_checkpoint = _tone([[523.0, 0.08], [784.0, 0.14]], 0.38)
	snd_finish = _tone([[523.0, 0.14], [659.0, 0.14], [784.0, 0.14], [1046.0, 0.35]], 0.46)
	snd_click = _tone([[540.0, 0.05]], 0.3)
	for i in 7:
		var player := AudioStreamPlayer.new()
		add_child(player)
		_players.append(player)
	_bgm = AudioStreamPlayer.new()
	_bgm.volume_db = -12.0
	add_child(_bgm)

func unlock() -> void:
	if _unlocked:
		return
	_unlocked = true
	_start_bgm()

func play(stream: AudioStreamWAV, volume_db := 0.0) -> void:
	if not _unlocked or stream == null:
		return
	for player in _players:
		if not player.playing:
			player.stream = stream
			player.pitch_scale = 1.0
			player.volume_db = volume_db + linear_to_db(maxf(0.001, master_volume))
			player.play()
			return

func set_volume(value: float) -> void:
	master_volume = clampf(value, 0.0, 1.0)
	if _bgm:
		_bgm.volume_db = -12.0 + linear_to_db(maxf(0.001, master_volume))

func play_pickup(chain: int, volume := 1.0) -> void:
	if not _unlocked or snd_pickup == null:
		return
	for player in _players:
		if not player.playing:
			player.stream = snd_pickup
			player.pitch_scale = 1.0 + clampf(float(chain - 1) * 0.045, 0.0, 0.45)
			player.volume_db = linear_to_db(maxf(0.001, master_volume * volume))
			player.play()
			return

func set_bgm_paused(value: bool) -> void:
	if _bgm:
		_bgm.stream_paused = value

func _start_bgm() -> void:
	var step := 60.0 / 138.0 / 2.0
	var melody := [659.0, 784.0, 880.0, 784.0, 587.0, 659.0, 784.0, 0.0, 523.0, 659.0, 784.0, 1046.0, 880.0, 784.0, 659.0, 0.0]
	var notes: Array = []
	for frequency in melody:
		notes.append([frequency, step])
	_bgm.volume_db = -12.0 + linear_to_db(maxf(0.001, master_volume))
	_bgm.stream = _tone(notes, 0.13, "square", true)
	_bgm.play()

func _tone(notes: Array, gain: float, wave := "square", loop := false) -> AudioStreamWAV:
	var duration := 0.0
	for note in notes:
		duration += note[1]
	var frames := int(duration * RATE)
	var data := PackedByteArray()
	data.resize(frames * 2)
	var index := 0
	for note in notes:
		var frequency: float = note[0]
		var note_duration: float = note[1]
		var note_frames := int(note_duration * RATE)
		for i in note_frames:
			var t := float(i) / RATE
			var value := 0.0
			if frequency > 0.0:
				var phase := fmod(t * frequency, 1.0)
				value = 4.0 * absf(phase - 0.5) - 1.0 if wave == "triangle" else (1.0 if phase < 0.5 else -1.0)
				var envelope := minf(1.0, t / 0.006) * minf(1.0, maxf(0.0, note_duration - t) / 0.04)
				value *= gain * envelope
			data.encode_s16(index * 2, int(clampf(value, -1.0, 1.0) * 32000.0))
			index += 1
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = RATE
	stream.data = data
	if loop:
		stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
		stream.loop_begin = 0
		stream.loop_end = index
	return stream

func _sweep(start: float, finish: float, duration: float, gain: float) -> AudioStreamWAV:
	var frames := int(duration * RATE)
	var data := PackedByteArray()
	data.resize(frames * 2)
	var phase := 0.0
	for i in frames:
		var ratio := float(i) / frames
		phase += lerpf(start, finish, ratio) / RATE
		var value := (1.0 if fmod(phase, 1.0) < 0.5 else -1.0) * gain * (1.0 - ratio * 0.5)
		data.encode_s16(i * 2, int(value * 32000.0))
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = RATE
	stream.data = data
	return stream
