class_name SnowboardRider
extends CharacterBody3D

const Course = preload("res://scripts/course.gd")
const SnowMaterials = preload("res://scripts/materials.gd")
const SnowVisualProfile = preload("res://scripts/visual_profile.gd")

signal wiped_out
signal jumped
signal landed

const START_SPEED := 8.0
const MAX_SPEED := 28.0
const SLOPE_ACCEL := 28.0
const AIR_GRAVITY := 24.0
const TURN_SPEED := 1.6
const JUMP_SPEED := 7.5
const JUMP_BUFFER := 0.2
const COYOTE_TIME := 0.15

var visual_profile: SnowVisualProfile
var visual_preview := false
var input_steer := 0.0
var input_jump := false
var enabled := false
var invulnerable_time := 0.0
var speed := START_SPEED
var carve_strength := 0.0
var air_height := 0.0
var landing_impact := 0.0
var _jump_buffer_time := 0.0
var _coyote_time := 0.0
var _was_grounded := false
var _previous_vertical_speed := 0.0
var _landing_compression := 0.0
var _model: Node3D
var _body_root: Node3D
var _hips: Node3D
var _torso: Node3D
var _left_leg: Node3D
var _right_leg: Node3D
var _left_arm: Node3D
var _right_arm: Node3D
var _board: Node3D
var _shadow: MeshInstance3D
var _snow: CPUParticles3D
var _snow_mist: CPUParticles3D
var _landing_burst: CPUParticles3D

func _ready() -> void:
	if visual_profile == null:
		visual_profile = SnowVisualProfile.create(false, DisplayServer.is_touchscreen_available())
	add_to_group("snowboard_rider")
	collision_layer = 1
	collision_mask = 1 | 2 | 4
	floor_snap_length = 1.2
	floor_stop_on_slope = false
	floor_max_angle = deg_to_rad(70.0)
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.5
	capsule.height = 1.75
	collision.shape = capsule
	collision.position.y = 0.76
	add_child(collision)
	if DisplayServer.get_name() == "headless":
		_build_headless_rig()
	else:
		_build_bonbon()
	velocity = Course.tangent_at(0.0) * START_SPEED

func _physics_process(delta: float) -> void:
	invulnerable_time = maxf(0.0, invulnerable_time - delta)
	if not enabled:
		if not visual_preview:
			_set_snow_emitting(false)
		_update_shadow()
		return
	if input_jump:
		_jump_buffer_time = JUMP_BUFFER
	else:
		_jump_buffer_time = maxf(0.0, _jump_buffer_time - delta)
	var grounded := is_on_floor()
	var progress := Course.progress_of(position)
	if grounded:
		_coyote_time = COYOTE_TIME
		var normal := get_floor_normal()
		var downhill := Vector3.DOWN.slide(normal)
		var planar := velocity.slide(normal)
		speed = clampf(speed + downhill.length() * SLOPE_ACCEL * delta, START_SPEED, MAX_SPEED)
		if planar.length() < 0.1:
			planar = Course.tangent_at(progress)
		planar = planar.normalized() * speed
		var ratio := clampf(speed / MAX_SPEED, 0.0, 1.0)
		planar = planar.rotated(normal, -input_steer * TURN_SPEED * lerpf(0.82, 0.42, ratio) * delta)
		var course_forward := Course.tangent_at(progress).slide(normal).normalized()
		planar = planar.lerp(course_forward * planar.length(), delta * 0.46)
		velocity = planar
		if _jump_buffer_time > 0.0 and _coyote_time > 0.0:
			velocity += normal * JUMP_SPEED
			_jump_buffer_time = 0.0
			_coyote_time = 0.0
			jumped.emit()
	else:
		_coyote_time = maxf(0.0, _coyote_time - delta)
		velocity.y -= AIR_GRAVITY * delta
	_previous_vertical_speed = velocity.y
	move_and_slide()
	grounded = is_on_floor()
	if grounded and not _was_grounded:
		landing_impact = clampf(absf(_previous_vertical_speed) / 13.0, 0.25, 1.0)
		_landing_compression = landing_impact
		_emit_landing_burst()
		landed.emit()
	else:
		landing_impact = move_toward(landing_impact, 0.0, delta * 4.0)
	_was_grounded = grounded
	_check_collisions()
	_update_visual(delta, grounded)
	_update_shadow()
	progress = Course.progress_of(position)
	if absf(Course.lateral_of(position)) > Course.HALF_WIDTH + 2.0 or position.y < Course.height_at(position.x, progress) - 8.0:
		request_wipeout()

func _check_collisions() -> void:
	if invulnerable_time > 0.0:
		return
	for i in get_slide_collision_count():
		var collision := get_slide_collision(i)
		var collider := collision.get_collider()
		if collider is Node and collider.is_in_group("snowboard_hazard"):
			request_wipeout()
			return

func request_wipeout() -> void:
	if invulnerable_time > 0.0:
		return
	invulnerable_time = 1.2
	enabled = false
	_set_snow_emitting(false)
	var direction := -1.0 if input_steer < 0.0 else 1.0
	var tween := create_tween().set_parallel(true)
	tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(_model, "rotation:z", direction * 1.15, 0.42)
	tween.tween_property(_model, "rotation:y", direction * 0.72, 0.42)
	tween.tween_property(_model, "position:y", 0.38, 0.2)
	wiped_out.emit()

func reset_at(world_position: Vector3) -> void:
	position = world_position
	velocity = Course.tangent_at(Course.progress_of(world_position)) * START_SPEED
	speed = START_SPEED
	invulnerable_time = 1.2
	_jump_buffer_time = 0.0
	_coyote_time = 0.0
	_model.rotation = Vector3.ZERO
	_model.position = Vector3.ZERO
	_body_root.position = Vector3.ZERO

func apply_visual_pose(pose: String) -> void:
	match pose:
		"carve":
			input_steer = 1.0
			speed = MAX_SPEED * 0.88
			_update_visual(0.18, true)
			_set_snow_emitting(true)
		"jump":
			input_steer = -0.28
			speed = MAX_SPEED * 0.72
			_update_visual(0.18, false)
		"landing":
			input_steer = 0.35
			speed = MAX_SPEED * 0.78
			_landing_compression = 1.0
			_update_visual(0.18, true)
			_emit_landing_burst()
		_:
			input_steer = 0.0
			speed = MAX_SPEED * 0.55
			_update_visual(0.18, true)
	_update_shadow()

func _update_visual(delta: float, grounded: bool) -> void:
	var planar := Vector3(velocity.x, 0, velocity.z)
	if planar.length() > 0.1:
		var target_yaw := atan2(-planar.x, -planar.z)
		rotation.y = lerp_angle(rotation.y, target_yaw, minf(1.0, delta * 7.0))
	carve_strength = clampf(absf(input_steer) * speed / MAX_SPEED, 0.0, 1.0) if grounded else 0.0
	_landing_compression = move_toward(_landing_compression, 0.0, delta * 5.4)
	var crouch := (0.10 + carve_strength * 0.17 + _landing_compression * 0.28) if grounded else 0.26
	var lean := -input_steer * 0.34 if grounded else -input_steer * 0.12
	_model.rotation.z = lerp_angle(_model.rotation.z, lean, minf(1.0, delta * 8.0))
	_model.rotation.x = lerp_angle(_model.rotation.x, -0.09 if grounded else 0.16, minf(1.0, delta * 5.0))
	_body_root.position.y = lerpf(_body_root.position.y, -crouch, minf(1.0, delta * 9.0))
	_hips.rotation.z = lerp_angle(_hips.rotation.z, input_steer * 0.13, minf(1.0, delta * 7.0))
	_torso.rotation.z = lerp_angle(_torso.rotation.z, input_steer * 0.19, minf(1.0, delta * 7.0))
	_left_leg.rotation.x = lerp_angle(_left_leg.rotation.x, 0.26 + crouch * 0.9, minf(1.0, delta * 8.0))
	_right_leg.rotation.x = lerp_angle(_right_leg.rotation.x, -0.18 - crouch * 0.65, minf(1.0, delta * 8.0))
	_left_arm.rotation.z = lerp_angle(_left_arm.rotation.z, 0.72 + input_steer * 0.26, minf(1.0, delta * 6.0))
	_right_arm.rotation.z = lerp_angle(_right_arm.rotation.z, -0.72 + input_steer * 0.26, minf(1.0, delta * 6.0))
	_board.rotation.y = lerp_angle(_board.rotation.y, -input_steer * 0.08, minf(1.0, delta * 8.0))
	var progress := Course.progress_of(global_position)
	air_height = maxf(0.0, global_position.y - Course.height_at(global_position.x, progress) - 0.62)
	_set_snow_emitting(grounded and speed > 9.0)
	if _snow:
		_snow.amount = maxi(3, int(lerpf(18.0, 52.0, carve_strength) * visual_profile.particle_scale))
	if _snow_mist:
		_snow_mist.amount = maxi(2, int(lerpf(8.0, 24.0, carve_strength) * visual_profile.particle_scale))

func _set_snow_emitting(value: bool) -> void:
	if _snow:
		_snow.emitting = value
	if _snow_mist:
		_snow_mist.emitting = value and visual_profile.particle_scale > 0.35

func _update_shadow() -> void:
	if _shadow == null:
		return
	var progress := Course.progress_of(global_position)
	var ground_y := Course.height_at(global_position.x, progress)
	var height_above := maxf(0.0, global_position.y - ground_y)
	_shadow.position = Vector3(0, ground_y - global_position.y + 0.055, 0)
	var shadow_scale := lerpf(1.0, 0.58, clampf(height_above / 6.0, 0.0, 1.0))
	_shadow.scale = Vector3(1.9 * shadow_scale, 3.1 * shadow_scale, 1.0)

func _build_bonbon() -> void:
	_model = Node3D.new()
	_model.name = "Bonbon"
	_model.scale = Vector3.ONE * 0.8
	add_child(_model)
	_board = Node3D.new()
	_board.name = "Board"
	_model.add_child(_board)
	var board_middle := BoxMesh.new()
	board_middle.size = Vector3(1.42, 0.12, 2.75)
	_add_mesh(_board, board_middle, SnowMaterials.board_plastic(), Vector3(0, 0.04, 0))
	var board_stripe := BoxMesh.new()
	board_stripe.size = Vector3(0.72, 0.02, 2.05)
	_add_mesh(_board, board_stripe, SnowMaterials.board_decal(), Vector3(0, 0.11, 0))
	for z in [-1.43, 1.43]:
		var tip := SphereMesh.new()
		tip.radius = 0.72
		tip.height = 0.24
		tip.radial_segments = 12
		tip.rings = 4
		_add_mesh(_board, tip, SnowMaterials.board_plastic(), Vector3(0, 0.11, z), Vector3(0.12 * signf(z), 0, 0))

	_body_root = Node3D.new()
	_body_root.name = "PoseRig"
	_model.add_child(_body_root)
	_hips = Node3D.new()
	_hips.name = "Hips"
	_body_root.add_child(_hips)
	var hip_mesh := SphereMesh.new()
	_mesh_sphere_quality(hip_mesh, 0.55, 0.72)
	_add_mesh(_hips, hip_mesh, SnowMaterials.fabric(Color8(40, 66, 105)), Vector3(0, 1.22, 0))

	_left_leg = _build_leg(_hips, -0.34)
	_right_leg = _build_leg(_hips, 0.34)
	_torso = Node3D.new()
	_torso.name = "Torso"
	_hips.add_child(_torso)
	var torso_mesh := CapsuleMesh.new()
	torso_mesh.radius = 0.62
	torso_mesh.height = 1.62
	torso_mesh.radial_segments = 12
	torso_mesh.rings = 5
	_add_mesh(_torso, torso_mesh, SnowMaterials.fabric(Color8(57, 173, 161)), Vector3(0, 2.0, 0))

	_left_arm = _build_arm(_torso, -0.68)
	_right_arm = _build_arm(_torso, 0.68)
	var head := SphereMesh.new()
	_mesh_sphere_quality(head, 0.67, 1.38)
	_add_mesh(_torso, head, SnowMaterials.skin(), Vector3(0, 3.08, -0.08))
	var hood := TorusMesh.new()
	hood.inner_radius = 0.49
	hood.outer_radius = 0.69
	hood.rings = 18
	hood.ring_segments = 8
	_add_mesh(_torso, hood, SnowMaterials.fabric(Color8(48, 159, 151)), Vector3(0, 3.12, 0.05), Vector3(PI * 0.5, 0, 0))
	_build_face(_torso)
	var hair_material := SnowMaterials.fabric(Color8(91, 53, 34))
	for spec in [Vector3(-0.43, 3.49, -0.12), Vector3(-0.15, 3.62, -0.24), Vector3(0.17, 3.61, -0.25), Vector3(0.44, 3.45, -0.1), Vector3(-0.37, 3.5, -0.49), Vector3(0.36, 3.5, -0.49)]:
		var hair := SphereMesh.new()
		_mesh_sphere_quality(hair, 0.29, 0.48)
		_add_mesh(_torso, hair, hair_material, spec)
	_build_backpack(_torso)
	_build_shadow()
	_build_snow_particles()

func _build_face(parent: Node3D) -> void:
	# 眼白 → 瞳孔 → 腮紅 → 眉 → 微笑，讓 QA 近景不像光頭積木。
	for x in [-0.23, 0.23]:
		var white := SphereMesh.new()
		_mesh_sphere_quality(white, 0.13, 0.22)
		_add_mesh(parent, white, SnowMaterials.clay(Color8(250, 248, 244), 0.72), Vector3(x, 3.16, -0.62))
		var pupil := SphereMesh.new()
		_mesh_sphere_quality(pupil, 0.075, 0.14)
		_add_mesh(parent, pupil, SnowMaterials.clay(Color8(43, 34, 31), 0.55), Vector3(x, 3.16, -0.72))
		var blush := SphereMesh.new()
		_mesh_sphere_quality(blush, 0.11, 0.08)
		_add_mesh(parent, blush, SnowMaterials.clay(Color8(255, 156, 148), 0.88), Vector3(x * 1.35, 3.0, -0.58))
		var brow := BoxMesh.new()
		brow.size = Vector3(0.22, 0.05, 0.06)
		_add_mesh(parent, brow, SnowMaterials.fabric(Color8(91, 53, 34)), Vector3(x, 3.34, -0.62), Vector3(0, 0, x * 0.18))
	var smile := TorusMesh.new()
	smile.inner_radius = 0.11
	smile.outer_radius = 0.16
	smile.rings = 14
	smile.ring_segments = 6
	_add_mesh(parent, smile, SnowMaterials.clay(Color8(214, 92, 104), 0.7), Vector3(0, 2.92, -0.68), Vector3(PI * 0.5, 0, 0))
	var nose := SphereMesh.new()
	_mesh_sphere_quality(nose, 0.09, 0.14)
	_add_mesh(parent, nose, SnowMaterials.skin(Color8(232, 150, 112)), Vector3(0, 3.08, -0.74))

func _build_headless_rig() -> void:
	_model = Node3D.new()
	add_child(_model)
	_board = Node3D.new()
	_model.add_child(_board)
	_body_root = Node3D.new()
	_model.add_child(_body_root)
	_hips = Node3D.new()
	_body_root.add_child(_hips)
	_torso = Node3D.new()
	_hips.add_child(_torso)
	_left_leg = Node3D.new()
	_right_leg = Node3D.new()
	_left_arm = Node3D.new()
	_right_arm = Node3D.new()
	_hips.add_child(_left_leg)
	_hips.add_child(_right_leg)
	_torso.add_child(_left_arm)
	_torso.add_child(_right_arm)

func _build_leg(parent: Node3D, x: float) -> Node3D:
	var pivot := Node3D.new()
	pivot.position = Vector3(x, 0.62, 0)
	parent.add_child(pivot)
	var leg := CapsuleMesh.new()
	leg.radius = 0.23
	leg.height = 1.08
	leg.radial_segments = 10
	_add_mesh(pivot, leg, SnowMaterials.fabric(Color8(39, 63, 101)), Vector3(0, 0.18, 0))
	var shoe := BoxMesh.new()
	shoe.size = Vector3(0.52, 0.28, 0.78)
	_add_mesh(pivot, shoe, SnowMaterials.board_plastic(Color8(224, 66, 68)), Vector3(0, -0.38, 0.08))
	return pivot

func _build_arm(parent: Node3D, x: float) -> Node3D:
	var pivot := Node3D.new()
	pivot.position = Vector3(x, 2.36, 0)
	parent.add_child(pivot)
	var arm := CapsuleMesh.new()
	arm.radius = 0.17
	arm.height = 1.18
	arm.radial_segments = 9
	_add_mesh(pivot, arm, SnowMaterials.fabric(Color8(57, 173, 161)), Vector3(0, -0.38, 0))
	var glove := SphereMesh.new()
	_mesh_sphere_quality(glove, 0.2, 0.38)
	_add_mesh(pivot, glove, SnowMaterials.fabric(Color8(242, 194, 68)), Vector3(0, -0.94, 0))
	return pivot

func _build_backpack(parent: Node3D) -> void:
	var backpack := SphereMesh.new()
	_mesh_sphere_quality(backpack, 0.61, 1.24)
	_add_mesh(parent, backpack, SnowMaterials.fabric(Color8(241, 184, 48)), Vector3(0, 2.02, 0.5), Vector3(0.08, 0, 0))
	for x in [-0.43, 0.43]:
		var strap := BoxMesh.new()
		strap.size = Vector3(0.11, 1.1, 0.11)
		_add_mesh(parent, strap, SnowMaterials.fabric(Color8(216, 142, 35)), Vector3(x, 2.0, -0.52), Vector3(0, 0, x * 0.22))

func _build_shadow() -> void:
	var quad := QuadMesh.new()
	quad.size = Vector2(1.0, 1.0)
	_shadow = _add_mesh(self, quad, SnowMaterials.blob_shadow(), Vector3(0, -0.02, 0), Vector3(-PI * 0.5, 0, 0))
	_shadow.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF

func _build_snow_particles() -> void:
	if DisplayServer.get_name() == "headless":
		return
	var chunk := SphereMesh.new()
	chunk.radius = 0.075
	chunk.height = 0.14
	chunk.radial_segments = 5
	chunk.rings = 3
	chunk.material = SnowMaterials.clay(Color8(232, 247, 250), 1.0)
	_snow = _particle_system(chunk, 44, 0.56, Vector3(0, 0.38, 1), 34.0, 2.2, 6.5, Vector3(0, -4.2, 0))
	_snow.position = Vector3(0, 0.13, 1.15)
	add_child(_snow)

	var mist_quad := QuadMesh.new()
	mist_quad.size = Vector2(0.42, 0.42)
	mist_quad.material = SnowMaterials.translucent(Color(0.87, 0.96, 1.0, 0.32), true)
	_snow_mist = _particle_system(mist_quad, 18, 0.72, Vector3(0, 0.5, 1), 28.0, 1.2, 3.6, Vector3(0, -1.4, 0))
	_snow_mist.position = Vector3(0, 0.18, 1.25)
	add_child(_snow_mist)

	_landing_burst = _particle_system(chunk, maxi(4, int(34.0 * visual_profile.particle_scale)), 0.62, Vector3(0, 0.9, 0), 68.0, 2.8, 7.8, Vector3(0, -6.5, 0))
	_landing_burst.one_shot = true
	_landing_burst.explosiveness = 0.92
	_landing_burst.position = Vector3(0, 0.1, 0)
	add_child(_landing_burst)

func _particle_system(mesh: Mesh, amount: int, lifetime: float, direction: Vector3, spread: float, min_speed: float, max_speed: float, gravity: Vector3) -> CPUParticles3D:
	var particles := CPUParticles3D.new()
	particles.emitting = false
	particles.amount = maxi(2, int(amount * visual_profile.particle_scale))
	particles.lifetime = lifetime
	particles.direction = direction
	particles.spread = spread
	particles.gravity = gravity
	particles.initial_velocity_min = min_speed
	particles.initial_velocity_max = max_speed
	particles.scale_amount_min = 0.55
	particles.scale_amount_max = 1.35
	particles.local_coords = false
	particles.mesh = mesh
	return particles

func _emit_landing_burst() -> void:
	if _landing_burst == null or visual_profile.reduced_motion:
		return
	_landing_burst.restart()
	_landing_burst.emitting = true

static func _mesh_sphere_quality(mesh: SphereMesh, radius: float, height: float) -> void:
	mesh.radius = radius
	mesh.height = height
	mesh.radial_segments = 12
	mesh.rings = 6

static func _add_mesh(parent: Node3D, mesh: Mesh, material: Material, at: Vector3, rotate := Vector3.ZERO) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material
	instance.position = at
	instance.rotation = rotate
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(instance)
	return instance
