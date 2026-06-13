class_name Kart
extends Node3D
## Arcade 卡丁車：沿賽道曲線以 progress（前進量）＋ lateral（橫向偏移）模擬。
## 無物理引擎依賴——行動端效能穩定、不可能抄捷徑；玩家與 AI 共用同一套模型。

const MAX_SPEED := 30.0
const ACCEL := 14.0
const BRAKE_DECEL := 26.0
const STEER_LAT_SPEED := 15.0
const DRIFT_LAT_MULT := 1.7
const GRASS_FACTOR := 0.42
const GRIP := 36.0
const BOOST_MULT := 1.32
const DRIFT_CHARGE_TIME := 1.1

var curve: Curve3D
var track_length := 1.0
var is_player := false
var ai_skill := 1.0
var kart_color := Color(1, 0.7, 0.8)
var display_name := ""

# 模擬狀態
var progress := 0.0          # 累積前進量（公尺，跨圈累加，排名用）
var lateral := 0.0
var speed := 0.0
var steer := 0.0             # -1..1（平滑後）
var drifting := false
var drift_charge := 0.0
var boost_t := 0.0
var finished := false

# 圈數／ordered checkpoints（8 段，依序通過才計圈）
var lap := 1
var cp_index := 0
var lap_start_ms := 0
var best_lap_ms := 0

# 玩家輸入（由 race.gd 餵入）
var input_steer := 0.0
var input_drift := false
var input_brake := false

var _body: Node3D
var _rng := RandomNumberGenerator.new()
var _ai_wobble := 0.0

func setup(p_curve: Curve3D, color: Color, player: bool, skill: float, name_text: String) -> void:
	curve = p_curve
	track_length = curve.get_baked_length()
	kart_color = color
	is_player = player
	ai_skill = skill
	display_name = name_text
	_rng.seed = hash(name_text) + int(skill * 1000.0)
	_ai_wobble = _rng.randf_range(0.0, TAU)
	_build_body()
	_apply_pose()

func lap_fraction() -> float:
	return fposmod(progress, track_length) / track_length

func current_max_speed() -> float:
	var m := MAX_SPEED * ai_skill
	if boost_t > 0.0:
		m *= BOOST_MULT
	return m

## 主模擬步進。rubber_band：AI 依與玩家差距調速（落後加速、領先收斂）。
func step(dt: float, race_running: bool, rubber_band: float) -> void:
	if finished or not race_running:
		_idle_roll(dt)
		return

	var target_steer := input_steer
	if not is_player:
		target_steer = _ai_steer(dt)
	steer = move_toward(steer, clampf(target_steer, -1.0, 1.0), dt * 9.0)

	drifting = (input_drift if is_player else absf(steer) > 0.55) and speed > 8.0
	if drifting and absf(steer) > 0.3:
		drift_charge += dt
	elif drift_charge > 0.0:
		if drift_charge >= DRIFT_CHARGE_TIME:
			boost_t = maxf(boost_t, 1.1)
		drift_charge = 0.0
	boost_t = maxf(0.0, boost_t - dt)

	# 彎道速度上限（曲率），漂移可提高過彎容忍
	var curv := _curvature_at(fposmod(progress, track_length))
	var corner_cap := sqrt(GRIP / maxf(curv, 0.0008))
	if drifting:
		corner_cap *= 1.35
	var target_speed := minf(current_max_speed(), corner_cap)
	if not is_player:
		target_speed *= rubber_band
	if input_brake and is_player:
		target_speed = 0.0

	# 草地減速
	var on_grass := absf(lateral) > TrackData.ROAD_HALF - 0.8
	if on_grass:
		target_speed *= GRASS_FACTOR

	if speed < target_speed:
		speed = move_toward(speed, target_speed, ACCEL * dt * (1.6 if boost_t > 0.0 else 1.0))
	else:
		var decel := BRAKE_DECEL if (input_brake and is_player) else ACCEL * 1.4
		speed = move_toward(speed, target_speed, decel * dt)

	# 橫向移動：轉向 ＋ 過快外拋（鼓勵漂移）
	var lat_rate := STEER_LAT_SPEED * (DRIFT_LAT_MULT if drifting else 1.0)
	lateral += steer * lat_rate * dt * clampf(speed / MAX_SPEED, 0.35, 1.0)
	if speed > corner_cap and not drifting:
		lateral += _curve_side_sign(fposmod(progress, track_length)) * (speed - corner_cap) * 0.06 * dt * 60.0 * 0.016

	# 護欄
	var wall := TrackData.BARRIER_LAT - 1.4
	if absf(lateral) > wall:
		lateral = clampf(lateral, -wall, wall)
		speed *= 0.86

	progress += speed * dt
	_update_lap()
	_apply_pose()

func _idle_roll(dt: float) -> void:
	# 結束後緩停＋繼續沿線滑行（讓畫面自然）
	speed = move_toward(speed, 12.0 if finished else 0.0, ACCEL * dt)
	if speed > 0.0:
		progress += speed * dt
		lateral = move_toward(lateral, 0.0, dt * 2.0)
	_apply_pose()

## ordered checkpoints：8 段依序通過，全收集並繞回起點才算完成一圈。
func _update_lap() -> void:
	var frac := lap_fraction()
	var zone := int(frac * 8.0)
	if zone == cp_index:
		cp_index += 1
	if cp_index >= 8 and zone == 0:
		cp_index = 0
		lap += 1

func _curvature_at(off: float) -> float:
	var ds := 6.0
	var p0 := curve.sample_baked(fposmod(off - ds, track_length), true)
	var p1 := curve.sample_baked(off, true)
	var p2 := curve.sample_baked(fposmod(off + ds, track_length), true)
	var t1 := (p1 - p0).normalized()
	var t2 := (p2 - p1).normalized()
	return t1.angle_to(t2) / ds

func _curve_side_sign(off: float) -> float:
	var ds := 6.0
	var p0 := curve.sample_baked(fposmod(off - ds, track_length), true)
	var p1 := curve.sample_baked(off, true)
	var p2 := curve.sample_baked(fposmod(off + ds, track_length), true)
	var t1 := p1 - p0
	var t2 := p2 - p1
	# 轉彎方向的外側（y 分量叉積）
	return 1.0 if (t1.x * t2.z - t1.z * t2.x) > 0.0 else -1.0

func _ai_steer(dt: float) -> float:
	# 賽車線：朝彎內側偏，加一點擺動讓 AI 有個性
	_ai_wobble += dt * 0.7
	var off := fposmod(progress + 18.0, track_length)
	var side := _curve_side_sign(off)
	var curv := _curvature_at(off)
	var target_lat := -side * clampf(curv * 220.0, 0.0, 5.0) + sin(_ai_wobble) * 1.2
	target_lat = clampf(target_lat, -6.5, 6.5)
	return clampf((target_lat - lateral) * 0.5, -1.0, 1.0)

func _apply_pose() -> void:
	var off := fposmod(progress, track_length)
	var pos := curve.sample_baked(off, true)
	var ahead := curve.sample_baked(fposmod(off + 1.5, track_length), true)
	var tangent := (ahead - pos).normalized()
	var side := Vector3(-tangent.z, 0.0, tangent.x)
	position = pos + side * lateral + Vector3(0, 0.5, 0)
	# -Z（Godot 前方）對齊切線方向；轉向時車頭朝彎內擺
	var yaw := atan2(-tangent.x, -tangent.z)
	var visual_yaw := yaw - steer * 0.35 - (steer * 0.5 if drifting else 0.0)
	rotation = Vector3(0, visual_yaw, 0)
	if _body:
		_body.rotation.z = steer * (0.18 if drifting else 0.08)

func _build_body() -> void:
	_body = Node3D.new()
	add_child(_body)

	var body_mesh := BoxMesh.new()
	body_mesh.size = Vector3(1.7, 0.7, 2.6)
	var body_inst := MeshInstance3D.new()
	body_inst.mesh = body_mesh
	body_inst.material_override = TrackBuilder.solid_material(kart_color)
	body_inst.position.y = 0.45
	_body.add_child(body_inst)

	var bumper := SphereMesh.new()
	bumper.radius = 0.55
	bumper.height = 1.1
	var bumper_inst := MeshInstance3D.new()
	bumper_inst.mesh = bumper
	bumper_inst.material_override = TrackBuilder.solid_material(kart_color.lightened(0.25))
	bumper_inst.position = Vector3(0, 0.45, -1.25)
	_body.add_child(bumper_inst)

	var head := SphereMesh.new()
	head.radius = 0.45
	head.height = 0.9
	var head_inst := MeshInstance3D.new()
	head_inst.mesh = head
	head_inst.material_override = TrackBuilder.solid_material(Color(1.0, 0.92, 0.84))
	head_inst.position = Vector3(0, 1.05, 0.2)
	_body.add_child(head_inst)

	var helmet := SphereMesh.new()
	helmet.radius = 0.5
	helmet.height = 0.55
	var helmet_inst := MeshInstance3D.new()
	helmet_inst.mesh = helmet
	helmet_inst.material_override = TrackBuilder.solid_material(kart_color.lightened(0.4))
	helmet_inst.position = Vector3(0, 1.28, 0.2)
	_body.add_child(helmet_inst)

	var wheel := SphereMesh.new()
	wheel.radius = 0.42
	wheel.height = 0.84
	var wheel_mat := TrackBuilder.solid_material(Color(0.32, 0.26, 0.34))
	for wx in [-0.85, 0.85]:
		for wz in [-0.95, 0.95]:
			var w := MeshInstance3D.new()
			w.mesh = wheel
			w.material_override = wheel_mat
			w.position = Vector3(wx, 0.25, wz)
			_body.add_child(w)
