class_name SnowTrails
extends Node3D

const SEGMENTS := 240

var _multimesh: MultiMesh
var _cursor := 0
var _last_position := Vector3(9999, 9999, 9999)

func _ready() -> void:
	var mesh := BoxMesh.new()
	mesh.size = Vector3(0.10, 0.025, 0.72)
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.47, 0.69, 0.82, 0.58)
	material.roughness = 1.0
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mesh.material = material
	_multimesh = MultiMesh.new()
	_multimesh.transform_format = MultiMesh.TRANSFORM_3D
	_multimesh.mesh = mesh
	_multimesh.instance_count = SEGMENTS * 2
	for i in _multimesh.instance_count:
		_multimesh.set_instance_transform(i, Transform3D(Basis().scaled(Vector3.ZERO), Vector3.ZERO))
	var instance := MultiMeshInstance3D.new()
	instance.multimesh = _multimesh
	add_child(instance)

func record(rider_position: Vector3, rider_basis: Basis, grounded: bool) -> void:
	if not grounded:
		_last_position = rider_position
		return
	if _last_position.distance_to(rider_position) < 0.48:
		return
	_last_position = rider_position
	var forward := -rider_basis.z.normalized()
	var yaw := atan2(-forward.x, -forward.z)
	var basis := Basis(Vector3.UP, yaw)
	for side in [-1.0, 1.0]:
		var pos: Vector3 = rider_position + rider_basis.x * side * 0.36 + Vector3(0, -0.52, 0)
		_multimesh.set_instance_transform(_cursor * 2 + (0 if side < 0.0 else 1), Transform3D(basis, pos))
	_cursor = (_cursor + 1) % SEGMENTS

func clear() -> void:
	_cursor = 0
	_last_position = Vector3(9999, 9999, 9999)
	if _multimesh:
		for i in _multimesh.instance_count:
			_multimesh.set_instance_transform(i, Transform3D(Basis().scaled(Vector3.ZERO), Vector3.ZERO))
