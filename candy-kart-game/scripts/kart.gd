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
var progress := 0.0
var lateral := 0.0
var speed := 0.0
var steer := 0.0
var drifting := false
var drift_charge := 0.0
var boost_t := 0.0
var finished := false

var lap := 1
var cp_index := 0
var lap_start_ms := 0
var best_lap_ms := 0

var input_steer := 0.0
var input_drift := false
var input_brake := false

var _body: Node3D
var _wheels: Array[MeshInstance3D] = []
var _drift_dust: CPUParticles3D
var _wheel_spin := 0.0
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

func step(dt: float, race_running: bool, rubber_band: float) -> void:
	if finished or not race_running:
		_idle_roll(dt)
		_update_fx(dt)
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

	var curv := _curvature_at(fposmod(progress, track_length))
	var corner_cap := sqrt(GRIP / maxf(curv, 0.0008))
	if drifting:
		corner_cap *= 1.35
	var target_speed := minf(current_max_speed(), corner_cap)
	if not is_player:
		target_speed *= rubber_band
	if input_brake and is_player:
		target_speed = 0.0

	var on_grass := absf(lateral) > TrackData.ROAD_HALF - 0.8
	if on_grass:
		target_speed *= GRASS_FACTOR

	if speed < target_speed:
		speed = move_toward(speed, target_speed, ACCEL * dt * (1.6 if boost_t > 0.0 else 1.0))
	else:
		var decel := BRAKE_DECEL if (input_brake and is_player) else ACCEL * 1.4
		speed = move_toward(speed, target_speed, decel * dt)

	var lat_rate := STEER_LAT_SPEED * (DRIFT_LAT_MULT if drifting else 1.0)
	lateral += steer * lat_rate * dt * clampf(speed / MAX_SPEED, 0.35, 1.0)
	if speed > corner_cap and not drifting:
		lateral += _curve_side_sign(fposmod(progress, track_length)) * (speed - corner_cap) * 0.06 * dt * 60.0 * 0.016

	var wall := TrackData.BARRIER_LAT - 1.4
	if absf(lateral) > wall:
		lateral = clampf(lateral, -wall, wall)
		speed *= 0.86

	progress += speed * dt
	_update_lap()
	_apply_pose()
	_update_fx(dt)

func _idle_roll(dt: float) -> void:
	speed = move_toward(speed, 12.0 if finished else 0.0, ACCEL * dt)
	if speed > 0.0:
		progress += speed * dt
		lateral = move_toward(lateral, 0.0, dt * 2.0)
	_apply_pose()
	_update_fx(dt)

func _update_fx(dt: float) -> void:
	if _drift_dust:
		_drift_dust.emitting = drifting and speed > 6.0
		_drift_dust.amount = 6 if is_player else 3

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
	return 1.0 if (t1.x * t2.z - t1.z * t2.x) > 0.0 else -1.0

func _ai_steer(dt: float) -> float:
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
	var yaw := atan2(-tangent.x, -tangent.z)
	var visual_yaw := yaw - steer * 0.35 - (steer * 0.55 if drifting else 0.0)
	rotation = Vector3(0, visual_yaw, 0)
	if _body:
		_body.rotation.z = steer * (0.22 if drifting else 0.1)
	_wheel_spin += speed * 0.08
	for w in _wheels:
		w.rotation.x = _wheel_spin

func _build_body() -> void:
	_body = Node3D.new()
	add_child(_body)

	var body_mesh := BoxMesh.new()
	body_mesh.size = Vector3(1.75, 0.62, 2.5)
	var body_inst := MeshInstance3D.new()
	body_inst.mesh = body_mesh
	body_inst.material_override = TrackBuilder.solid_material(kart_color)
	body_inst.position.y = 0.42
	_body.add_child(body_inst)

	var cabin := BoxMesh.new()
	cabin.size = Vector3(1.2, 0.45, 1.1)
	var cabin_inst := MeshInstance3D.new()
	cabin_inst.mesh = cabin
	cabin_inst.material_override = TrackBuilder.solid_material(kart_color.lightened(0.18))
	cabin_inst.position = Vector3(0, 0.78, -0.15)
	_body.add_child(cabin_inst)

	var spoiler := BoxMesh.new()
	spoiler.size = Vector3(1.5, 0.12, 0.35)
	var spoiler_inst := MeshInstance3D.new()
	spoiler_inst.mesh = spoiler
	spoiler_inst.material_override = TrackBuilder.solid_material(kart_color.darkened(0.12))
	spoiler_inst.position = Vector3(0, 0.92, 1.05)
	_body.add_child(spoiler_inst)

	var bumper := SphereMesh.new()
	bumper.radius = 0.52
	bumper.height = 1.05
	var bumper_inst := MeshInstance3D.new()
	bumper_inst.mesh = bumper
	bumper_inst.material_override = TrackBuilder.solid_material(kart_color.lightened(0.25))
	bumper_inst.position = Vector3(0, 0.42, -1.28)
	_body.add_child(bumper_inst)

	var head := SphereMesh.new()
	head.radius = 0.42
	head.height = 0.88
	var head_inst := MeshInstance3D.new()
	head_inst.mesh = head
	head_inst.material_override = TrackBuilder.solid_material(Color(1.0, 0.92, 0.84))
	head_inst.position = Vector3(0, 1.02, 0.15)
	_body.add_child(head_inst)

	for ex in [-0.28, 0.28]:
		var eye := SphereMesh.new()
		eye.radius = 0.11
		eye.height = 0.22
		var eye_inst := MeshInstance3D.new()
		eye_inst.mesh = eye
		eye_inst.material_override = TrackBuilder.solid_material(Color(0.12, 0.1, 0.14))
		eye_inst.position = Vector3(ex, 1.08, -0.05)
		_body.add_child(eye_inst)

	var helmet := SphereMesh.new()
	helmet.radius = 0.48
	helmet.height = 0.52
	var helmet_inst := MeshInstance3D.new()
	helmet_inst.mesh = helmet
	helmet_inst.material_override = TrackBuilder.solid_material(kart_color.lightened(0.4))
	helmet_inst.position = Vector3(0, 1.26, 0.15)
	_body.add_child(helmet_inst)

	var wheel_mesh := SphereMesh.new()
	wheel_mesh.radius = 0.4
	wheel_mesh.height = 0.8
	var wheel_mat := TrackBuilder.solid_material(Color(0.32, 0.26, 0.34))
	for wx in [-0.88, 0.88]:
		for wz in [-0.92, 0.92]:
			var w := MeshInstance3D.new()
			w.mesh = wheel_mesh
			w.material_override = wheel_mat
			w.position = Vector3(wx, 0.24, wz)
			_body.add_child(w)
			_wheels.append(w)

	_drift_dust = CPUParticles3D.new()
	_drift_dust.emitting = false
	_drift_dust.amount = 8
	_drift_dust.lifetime = 0.45
	_drift_dust.explosiveness = 0.2
	_drift_dust.direction = Vector3(0, 1, 0)
	_drift_dust.spread = 35.0
	_drift_dust.gravity = Vector3(0, -2, 0)
	_drift_dust.initial_velocity_min = 1.0
	_drift_dust.initial_velocity_max = 3.0
	_drift_dust.scale_amount_min = 0.25
	_drift_dust.scale_amount_max = 0.55
	_drift_dust.color = kart_color.lightened(0.35)
	_drift_dust.position = Vector3(0, 0.15, 0.6)
	add_child(_drift_dust)
