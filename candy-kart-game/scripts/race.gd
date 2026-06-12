class_name Race
extends Node3D
## 單場賽事：建世界、生 8 台卡丁車、倒數起跑、圈數／名次、星星與加速帶、
## 玩家完賽 → 結算 standings 並發 signal。

signal race_finished(result: Dictionary)
signal countdown_tick(value: int)

const KART_COLORS := [
	Color8(255, 159, 183), Color8(141, 223, 240), Color8(255, 232, 137),
	Color8(157, 231, 184), Color8(201, 180, 255), Color8(255, 194, 138),
	Color8(157, 187, 255), Color8(255, 122, 156),
]
const AI_SKILLS := [0.93, 0.9, 0.87, 0.84, 0.97, 0.8, 0.95]
const PLAYER_NAME := "你"

enum State { COUNTDOWN, RUNNING, FINISHED }

var track: Dictionary
var curve: Curve3D
var karts: Array[Kart] = []
var player: Kart
var state := State.COUNTDOWN
var countdown_left := 3.6
var last_count_emitted := 4
var race_ms := 0.0
var stars_collected := 0
var star_nodes: Array = []
var _camera: Camera3D
var _sfx: Sfx
var _player_lap_seen := 1
var _player_lap_start := 0.0
var _finish_order: Array = []

func start(track_index: int, sfx: Sfx) -> void:
	_sfx = sfx
	track = TrackData.get_track(track_index)
	curve = TrackData.build_curve(track)
	add_child(TrackBuilder.build_world(track, curve))
	_spawn_karts()
	_spawn_stars()
	_camera = Camera3D.new()
	_camera.fov = 68.0
	add_child(_camera)
	_snap_camera(1.0)

func _spawn_karts() -> void:
	var ai_count := 4 if DisplayServer.is_touchscreen_available() else 7
	var total := ai_count + 1
	for i in total:
		var kart := Kart.new()
		add_child(kart)
		var is_player := i == 0
		var skill: float = 1.0 if is_player else AI_SKILLS[(i - 1) % AI_SKILLS.size()]
		var label := PLAYER_NAME if is_player else "AI %d" % i
		kart.setup(curve, KART_COLORS[i % KART_COLORS.size()], is_player, skill, label)
		# 起跑排位：兩列網格，玩家最後一排（贏了更有成就感）
		var row := total - 1 - i
		kart.progress = -8.0 - float(row / 2) * 7.0 + curve.get_baked_length()
		kart.progress = fposmod(kart.progress, curve.get_baked_length())
		kart.lateral = -3.5 if row % 2 == 0 else 3.5
		kart.lap = 1
		karts.append(kart)
		if is_player:
			player = kart

func _spawn_stars() -> void:
	var mesh := SphereMesh.new()
	mesh.radius = 1.0
	mesh.height = 2.0
	mesh.radial_segments = 12
	var mat := TrackBuilder.solid_material(Color8(255, 224, 102), 0.9)
	var length := curve.get_baked_length()
	for s in track["stars"]:
		var off: float = s[0] * length
		var lat: float = s[1]
		var pos := curve.sample_baked(off, true)
		var ahead := curve.sample_baked(fmod(off + 1.0, length), true)
		var tangent := (ahead - pos).normalized()
		var side := Vector3(-tangent.z, 0.0, tangent.x)
		var inst := MeshInstance3D.new()
		inst.mesh = mesh
		inst.material_override = mat
		inst.position = pos + side * lat + Vector3(0, 1.6, 0)
		add_child(inst)
		star_nodes.append({"node": inst, "frac": s[0], "lat": lat, "taken": false})

func stars_total() -> int:
	return star_nodes.size()

func _process(delta: float) -> void:
	match state:
		State.COUNTDOWN:
			countdown_left -= delta
			var n := int(ceil(countdown_left))
			if n != last_count_emitted:
				last_count_emitted = n
				countdown_tick.emit(n)
				if _sfx:
					_sfx.play(_sfx.snd_go if n <= 0 else _sfx.snd_count)
			if countdown_left <= 0.0:
				state = State.RUNNING
			_step_karts(delta, false)
		State.RUNNING:
			race_ms += delta * 1000.0
			_step_karts(delta, true)
			_collide_karts()
			_pickup(delta)
			_track_player_laps()
			_check_finish()
		State.FINISHED:
			_step_karts(delta, true)
	_animate_stars(delta)
	_update_camera(delta)

func _step_karts(delta: float, running: bool) -> void:
	for kart in karts:
		var rubber := 1.0
		if not kart.is_player and player:
			var gap := player.progress - kart.progress
			rubber = clampf(1.0 + gap / 600.0 * 0.22, 0.82, 1.2)
		kart.step(delta, running, rubber)

func _collide_karts() -> void:
	for i in karts.size():
		for j in range(i + 1, karts.size()):
			var a := karts[i]
			var b := karts[j]
			var dp := a.progress - b.progress
			var dl := a.lateral - b.lateral
			if absf(dp) < 2.6 and absf(dl) < 1.6:
				var push := signf(dl) if dl != 0.0 else 1.0
				a.lateral += push * 0.5
				b.lateral -= push * 0.5
				var rear := b if dp > 0.0 else a
				rear.speed *= 0.93
				if (a.is_player or b.is_player) and _sfx:
					_sfx.play(_sfx.snd_bump, -6.0)

func _pickup(_delta: float) -> void:
	if player.finished:
		return
	var frac := player.lap_fraction()
	var length := curve.get_baked_length()
	# 彩虹星星
	for s in star_nodes:
		if s["taken"]:
			continue
		var d := absf(frac - s["frac"]) * length
		d = minf(d, length - d)
		if d < 3.0 and absf(player.lateral - s["lat"]) < 2.0:
			s["taken"] = true
			(s["node"] as MeshInstance3D).visible = false
			stars_collected += 1
			if _sfx:
				_sfx.play(_sfx.snd_star)
	# 加速帶（所有車都吃，AI 也會衝）
	for kart in karts:
		var kfrac := kart.lap_fraction()
		for bf in track["boosts"]:
			var bd := absf(kfrac - bf) * length
			bd = minf(bd, length - bd)
			if bd < 3.5 and absf(kart.lateral) < 5.5 and kart.boost_t < 0.4:
				kart.boost_t = 1.4
				if kart.is_player and _sfx:
					_sfx.play(_sfx.snd_boost, -3.0)

func _track_player_laps() -> void:
	if player.lap > _player_lap_seen:
		_player_lap_seen = player.lap
		var lap_ms := race_ms - _player_lap_start
		_player_lap_start = race_ms
		if player.best_lap_ms == 0 or lap_ms < player.best_lap_ms:
			player.best_lap_ms = int(lap_ms)
		if _sfx and player.lap <= track["laps"]:
			_sfx.play(_sfx.snd_lap)

func _check_finish() -> void:
	var laps: int = track["laps"]
	for kart in karts:
		if not kart.finished and kart.lap > laps:
			kart.finished = true
			_finish_order.append(kart)
	if player.finished:
		state = State.FINISHED
		if _sfx:
			_sfx.play(_sfx.snd_finish)
		race_finished.emit(_build_result())

func position_of(target: Kart) -> int:
	var ahead := 0
	for kart in karts:
		if kart == target:
			continue
		if kart.finished and not target.finished:
			ahead += 1
		elif kart.finished == target.finished and kart.progress > target.progress:
			ahead += 1
	# 已完賽者依完賽順序
	if target.finished:
		return _finish_order.find(target) + 1
	return ahead + 1

func _build_result() -> Dictionary:
	var standings: Array = []
	var ranked := karts.duplicate()
	ranked.sort_custom(func(a: Kart, b: Kart) -> bool:
		var pa := position_of(a)
		var pb := position_of(b)
		return pa < pb
	)
	for kart in ranked:
		standings.append({
			"name": kart.display_name,
			"color": kart.kart_color,
			"is_player": kart.is_player,
		})
	return {
		"track_id": track["id"],
		"track_name": track["name"],
		"player_pos": position_of(player),
		"total_ms": int(race_ms),
		"best_lap_ms": player.best_lap_ms if player.best_lap_ms > 0 else int(race_ms),
		"stars": stars_collected,
		"stars_total": stars_total(),
		"par_ms": track["par_ms"],
		"standings": standings,
	}

func _animate_stars(delta: float) -> void:
	for s in star_nodes:
		if not s["taken"]:
			var node := s["node"] as MeshInstance3D
			node.rotate_y(delta * 2.2)
			node.position.y = 1.6 + sin(Time.get_ticks_msec() / 320.0 + s["frac"] * 20.0) * 0.25

func _update_camera(delta: float) -> void:
	if not player:
		return
	_snap_camera(clampf(delta * 5.0, 0.0, 1.0))

func _snap_camera(weight: float) -> void:
	var forward := -player.global_transform.basis.z
	var target_pos := player.position - forward * 10.0 + Vector3(0, 5.0, 0)
	_camera.position = _camera.position.lerp(target_pos, weight)
	var look := player.position + forward * 6.0 + Vector3(0, 1.2, 0)
	_camera.look_at(look)
