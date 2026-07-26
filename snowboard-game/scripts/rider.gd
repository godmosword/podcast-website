class_name SnowboardRider
extends CharacterBody3D

const Course = preload("res://scripts/course.gd")
const SnowWorldBuilder = preload("res://scripts/world_builder.gd")

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

var input_steer := 0.0
var input_jump := false
var enabled := false
var invulnerable_time := 0.0
var speed := START_SPEED
var _jump_buffer_time := 0.0
var _coyote_time := 0.0
var _was_grounded := false
var _model: Node3D
var _snow: CPUParticles3D

func _ready() -> void:
	add_to_group("snowboard_rider")
	collision_layer = 1
	collision_mask = 1 | 2 | 4
	floor_snap_length = 1.0
	floor_stop_on_slope = false
	floor_max_angle = deg_to_rad(70.0)
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.52
	capsule.height = 1.8
	collision.shape = capsule
	collision.position.y = 0.75
	add_child(collision)
	_build_bonbon()
	velocity = Vector3(0, -Course.SLOPE, -1).normalized() * START_SPEED

func _physics_process(delta: float) -> void:
	invulnerable_time = maxf(0.0, invulnerable_time - delta)
	if not enabled:
		_snow.emitting = false
		return
	if input_jump:
		_jump_buffer_time = JUMP_BUFFER
	else:
		_jump_buffer_time = maxf(0.0, _jump_buffer_time - delta)
	var grounded := is_on_floor()
	if grounded:
		_coyote_time = COYOTE_TIME
		var normal := get_floor_normal()
		var downhill := Vector3.DOWN.slide(normal)
		var planar := velocity.slide(normal)
		speed = clampf(speed + downhill.length() * SLOPE_ACCEL * delta, START_SPEED, MAX_SPEED)
		if planar.length() < 0.1:
			planar = Vector3(0, -Course.SLOPE, -1).slide(normal)
		planar = planar.normalized() * speed
		var ratio := clampf(speed / MAX_SPEED, 0.0, 1.0)
		planar = planar.rotated(normal, -input_steer * TURN_SPEED * lerpf(0.82, 0.42, ratio) * delta)
		var course_forward := Vector3(0, -Course.SLOPE, -1).slide(normal).normalized()
		planar = planar.lerp(course_forward * planar.length(), delta * 0.42)
		velocity = planar
		if _jump_buffer_time > 0.0 and _coyote_time > 0.0:
			velocity += normal * JUMP_SPEED
			_jump_buffer_time = 0.0
			_coyote_time = 0.0
			jumped.emit()
	else:
		_coyote_time = maxf(0.0, _coyote_time - delta)
		velocity.y -= AIR_GRAVITY * delta
	move_and_slide()
	grounded = is_on_floor()
	if grounded and not _was_grounded:
		landed.emit()
	_was_grounded = grounded
	_check_collisions()
	_update_visual(delta, grounded)
	if absf(position.x) > Course.HALF_WIDTH + 2.0 or position.y < Course.height_at(position.x, Course.progress_of(position)) - 8.0:
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
	wiped_out.emit()

func reset_at(world_position: Vector3) -> void:
	position = world_position
	velocity = Vector3(0, -Course.SLOPE, -1).normalized() * START_SPEED
	speed = START_SPEED
	invulnerable_time = 1.2
	_jump_buffer_time = 0.0
	_coyote_time = 0.0
	_model.rotation = Vector3.ZERO

func _update_visual(delta: float, grounded: bool) -> void:
	var planar := Vector3(velocity.x, 0, velocity.z)
	if planar.length() > 0.1:
		var target_yaw := atan2(-planar.x, -planar.z)
		rotation.y = lerp_angle(rotation.y, target_yaw, minf(1.0, delta * 7.0))
	_model.rotation.z = lerp_angle(_model.rotation.z, -input_steer * 0.28, minf(1.0, delta * 8.0))
	_model.rotation.x = lerp_angle(_model.rotation.x, -0.08 if grounded else 0.12, minf(1.0, delta * 5.0))
	_snow.emitting = grounded and speed > 9.0
	_snow.amount = int(lerpf(5.0, 16.0, absf(input_steer)))

func _build_bonbon() -> void:
	_model = Node3D.new()
	_model.name = "Bonbon"
	add_child(_model)
	var board_mesh := BoxMesh.new()
	board_mesh.size = Vector3(1.45, 0.12, 3.2)
	_add_mesh(_model, board_mesh, SnowWorldBuilder.solid_material(Color8(235, 89, 82)), Vector3(0, 0.04, 0))
	for x in [-0.38, 0.38]:
		var boot := BoxMesh.new()
		boot.size = Vector3(0.52, 0.34, 0.8)
		_add_mesh(_model, boot, SnowWorldBuilder.solid_material(Color8(255, 197, 72)), Vector3(x, 0.31, 0))
		var leg := CapsuleMesh.new()
		leg.radius = 0.24
		leg.height = 1.15
		_add_mesh(_model, leg, SnowWorldBuilder.solid_material(Color8(43, 71, 112)), Vector3(x, 0.95, 0), Vector3(0, 0, x * 0.3))
	var torso := CapsuleMesh.new()
	torso.radius = 0.63
	torso.height = 1.65
	_add_mesh(_model, torso, SnowWorldBuilder.solid_material(Color8(82, 190, 179)), Vector3(0, 1.75, 0))
	var backpack := SphereMesh.new()
	backpack.radius = 0.62
	backpack.height = 1.35
	_add_mesh(_model, backpack, SnowWorldBuilder.solid_material(Color8(245, 190, 54)), Vector3(0, 1.88, 0.46), Vector3(0.08, 0, 0))
	for x in [-0.78, 0.78]:
		var arm := CapsuleMesh.new()
		arm.radius = 0.18
		arm.height = 1.25
		_add_mesh(_model, arm, SnowWorldBuilder.solid_material(Color8(82, 190, 179)), Vector3(x, 1.86, -0.05), Vector3(0, 0, x * -0.95))
	var head := SphereMesh.new()
	head.radius = 0.68
	head.height = 1.42
	_add_mesh(_model, head, SnowWorldBuilder.solid_material(Color8(246, 187, 139)), Vector3(0, 2.93, -0.06))
	for x in [-0.24, 0.24]:
		var eye := SphereMesh.new()
		eye.radius = 0.105
		eye.height = 0.22
		_add_mesh(_model, eye, SnowWorldBuilder.solid_material(Color8(50, 37, 31)), Vector3(x, 3.03, -0.64))
	var hair_color := SnowWorldBuilder.solid_material(Color8(102, 62, 39))
	for spec in [Vector3(-0.42, 3.43, -0.18), Vector3(0, 3.57, -0.25), Vector3(0.42, 3.42, -0.16), Vector3(-0.26, 3.52, -0.52), Vector3(0.25, 3.51, -0.52)]:
		var hair := SphereMesh.new()
		hair.radius = 0.32
		hair.height = 0.55
		_add_mesh(_model, hair, hair_color, spec)
	var shadow := CylinderMesh.new()
	shadow.top_radius = 0.78
	shadow.bottom_radius = 0.78
	shadow.height = 0.015
	_add_mesh(self, shadow, SnowWorldBuilder.solid_material(Color(0.18, 0.35, 0.48, 0.34)), Vector3(0, -0.02, 0))
	_snow = CPUParticles3D.new()
	_snow.emitting = false
	_snow.amount = 12
	_snow.lifetime = 0.5
	_snow.direction = Vector3(0, 0.7, 1)
	_snow.spread = 28.0
	_snow.gravity = Vector3(0, -3, 0)
	_snow.initial_velocity_min = 2.0
	_snow.initial_velocity_max = 5.0
	_snow.scale_amount_min = 0.12
	_snow.scale_amount_max = 0.38
	_snow.color = Color(0.9, 0.98, 1.0, 0.85)
	_snow.position = Vector3(0, 0.12, 1.3)
	add_child(_snow)

func _add_mesh(parent: Node3D, mesh: Mesh, material: Material, at: Vector3, rotate := Vector3.ZERO) -> void:
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material
	instance.position = at
	instance.rotation = rotate
	parent.add_child(instance)
