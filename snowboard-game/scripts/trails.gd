class_name SnowTrails
extends Node3D

const Course = preload("res://scripts/course.gd")
const SnowMaterials = preload("res://scripts/materials.gd")
const SnowVisualProfile = preload("res://scripts/visual_profile.gd")
const SEGMENTS := 320

var visual_profile: SnowVisualProfile
var _multimesh: MultiMesh
var _cursor := 0
var _last_position := Vector3(9999, 9999, 9999)

func _ready() -> void:
	if visual_profile == null:
		visual_profile = SnowVisualProfile.create(false, false)
	if DisplayServer.get_name() == "headless":
		return
	var mesh := BoxMesh.new()
	mesh.size = Vector3(0.12, 0.018, 0.72)
	mesh.material = SnowMaterials.clay(Color8(119, 177, 202), 0.98)
	_multimesh = MultiMesh.new()
	_multimesh.transform_format = MultiMesh.TRANSFORM_3D
	_multimesh.mesh = mesh
	_multimesh.instance_count = SEGMENTS * 2
	for i in _multimesh.instance_count:
		_multimesh.set_instance_transform(i, Transform3D(Basis().scaled(Vector3.ZERO), Vector3.ZERO))
	var instance := MultiMeshInstance3D.new()
	instance.name = "CarvedSnowTracks"
	instance.multimesh = _multimesh
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(instance)

func record(rider_position: Vector3, rider_basis: Basis, grounded: bool, carve_strength := 0.0) -> void:
	if _multimesh == null:
		return
	if not grounded:
		_last_position = rider_position
		return
	var distance := _last_position.distance_to(rider_position)
	if distance < 0.34:
		return
	_last_position = rider_position
	var progress := Course.progress_of(rider_position)
	var normal := Course.surface_normal(progress, Course.lateral_of(rider_position))
	var forward := -rider_basis.z.slide(normal).normalized()
	if forward.length() < 0.2:
		forward = Course.tangent_at(progress)
	var right := forward.cross(normal).normalized()
	var trail_basis := Basis(right, normal, -forward).orthonormalized()
	var width_scale := lerpf(0.85, 1.42, carve_strength)
	var length_scale := clampf(distance / 0.72, 0.55, 1.8)
	trail_basis = trail_basis.scaled(Vector3(width_scale, 1.0, length_scale))
	for side in [-1.0, 1.0]:
		var world_xz: Vector3 = rider_position + rider_basis.x * side * 0.37
		var track_progress: float = Course.progress_of(world_xz)
		var pos := Vector3(world_xz.x, Course.height_at(world_xz.x, track_progress) + 0.035, world_xz.z)
		_multimesh.set_instance_transform(_cursor * 2 + (0 if side < 0.0 else 1), Transform3D(trail_basis, pos))
	_cursor = (_cursor + 1) % SEGMENTS

func clear() -> void:
	_cursor = 0
	_last_position = Vector3(9999, 9999, 9999)
	if _multimesh:
		for i in _multimesh.instance_count:
			_multimesh.set_instance_transform(i, Transform3D(Basis().scaled(Vector3.ZERO), Vector3.ZERO))
