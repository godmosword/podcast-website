class_name SnowWorldBuilder
extends Node3D

const Course = preload("res://scripts/course.gd")
const SnowflakePickup = preload("res://scripts/snowflake.gd")

const TERRAIN_STEP := 4.0

var reduced_motion := false
var environment: Environment
var snowflakes: Array = []

static func solid_material(color: Color, emission := 0.0) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.9
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	# A small emissive fill keeps the clay palette readable on WebGL drivers
	# that do not expose procedural-sky radiance to Compatibility materials.
	material.emission_enabled = true
	material.emission = Color(color.r, color.g, color.b)
	material.emission_energy_multiplier = maxf(0.24, emission)
	return material

func _ready() -> void:
	environment = _add_environment(self, reduced_motion)
	_add_terrain(self)
	_add_background(self)
	_add_course_markers(self)
	_add_hazards(self)
	_add_ramps(self)
	_add_finish(self)
	snowflakes = _add_snowflakes(self)

static func _add_environment(parent: Node3D, reduced_motion: bool) -> Environment:
	RenderingServer.set_default_clear_color(Color8(151, 215, 242))
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color8(151, 215, 242)
	environment.background_energy_multiplier = 0.8
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color8(218, 239, 255)
	environment.ambient_light_energy = 1.35
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.fog_enabled = not reduced_motion
	environment.fog_light_color = Color8(222, 244, 255)
	environment.fog_density = 0.0018
	environment.fog_sky_affect = 0.3
	var world_environment := WorldEnvironment.new()
	world_environment.environment = environment
	parent.add_child(world_environment)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -28, 0)
	sun.light_color = Color8(255, 247, 226)
	sun.light_energy = 1.15
	sun.shadow_enabled = not DisplayServer.is_touchscreen_available()
	sun.directional_shadow_max_distance = 90.0
	parent.add_child(sun)
	return environment

static func _add_terrain(parent: Node3D) -> void:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var across := int(Course.HALF_WIDTH * 2.0 / TERRAIN_STEP)
	var along := int(Course.LENGTH / TERRAIN_STEP)
	for iz in along:
		var s0 := float(iz) * TERRAIN_STEP
		var s1 := s0 + TERRAIN_STEP
		for ix in across:
			var x0 := -Course.HALF_WIDTH + float(ix) * TERRAIN_STEP
			var x1 := x0 + TERRAIN_STEP
			var a := Course.position_at(s0, x0)
			var b := Course.position_at(s0, x1)
			var c := Course.position_at(s1, x0)
			var d := Course.position_at(s1, x1)
			_add_terrain_vertex(surface, a, Vector2(ix, iz))
			_add_terrain_vertex(surface, b, Vector2(ix + 1, iz))
			_add_terrain_vertex(surface, c, Vector2(ix, iz + 1))
			_add_terrain_vertex(surface, b, Vector2(ix + 1, iz))
			_add_terrain_vertex(surface, d, Vector2(ix + 1, iz + 1))
			_add_terrain_vertex(surface, c, Vector2(ix, iz + 1))
	surface.generate_normals()
	var mesh := surface.commit()
	var material := StandardMaterial3D.new()
	material.albedo_color = Color8(231, 247, 255)
	material.roughness = 0.96
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.vertex_color_use_as_albedo = true
	material.emission_enabled = true
	material.emission = Color8(205, 232, 246)
	material.emission_energy_multiplier = 0.22
	mesh.surface_set_material(0, material)
	var terrain := MeshInstance3D.new()
	terrain.name = "SnowTerrain"
	terrain.mesh = mesh
	parent.add_child(terrain)
	# 玩法碰撞使用單一乾淨斜面；視覺網格不參與碰撞，避免 trimesh 接縫。
	var ground := StaticBody3D.new()
	ground.name = "SnowCollision"
	ground.collision_layer = 1
	ground.collision_mask = 0
	var collision := CollisionShape3D.new()
	var slope_angle := -atan(Course.SLOPE)
	var slope_normal := Vector3(0, cos(slope_angle), sin(slope_angle))
	var center_point := Course.position_at(Course.LENGTH * 0.5, 0.0)
	var box := BoxShape3D.new()
	box.size = Vector3(Course.HALF_WIDTH * 2.0, 2.0, Course.LENGTH * sqrt(1.0 + Course.SLOPE * Course.SLOPE) + 16.0)
	collision.shape = box
	ground.rotation.x = slope_angle
	ground.position = center_point - slope_normal
	ground.add_child(collision)
	# A primitive-mesh snow slab is a Compatibility/Web fallback for drivers
	# that reject the larger runtime SurfaceTool mesh. It sits just below it.
	var slab_mesh := BoxMesh.new()
	slab_mesh.size = box.size
	var slab := MeshInstance3D.new()
	slab.mesh = slab_mesh
	slab.material_override = solid_material(Color8(231, 247, 255), 0.38)
	slab.position.y = -0.06
	ground.add_child(slab)
	for track_x in range(-42, 43, 6):
		var groove_mesh := BoxMesh.new()
		groove_mesh.size = Vector3(0.12, 0.035, box.size.z - 12.0)
		var groove := MeshInstance3D.new()
		groove.mesh = groove_mesh
		groove.material_override = solid_material(Color8(183, 222, 240), 0.32)
		groove.position = Vector3(float(track_x), 0.955, 0)
		ground.add_child(groove)
	parent.add_child(ground)

static func _add_terrain_vertex(surface: SurfaceTool, point: Vector3, uv_cell: Vector2) -> void:
	var stripe := 0.965 + sin(uv_cell.x * 2.1) * 0.015
	surface.set_color(Color(stripe, minf(1.0, stripe + 0.025), 1.0))
	surface.set_uv(uv_cell * 0.12)
	surface.add_vertex(point)

static func _add_background(parent: Node3D) -> void:
	var mountain_colors := [Color8(125, 190, 224), Color8(102, 166, 207), Color8(81, 146, 193)]
	for row in 3:
		for i in 8:
			var peak := CylinderMesh.new()
			peak.top_radius = 0.0
			peak.bottom_radius = 35.0 + row * 9.0
			peak.height = 78.0 + row * 18.0 + (i % 3) * 12.0
			peak.radial_segments = 5
			var instance := MeshInstance3D.new()
			instance.mesh = peak
			instance.material_override = solid_material(mountain_colors[row])
			instance.position = Vector3(-190.0 + i * 55.0, -20.0 - row * 9.0, -260.0 - row * 240.0)
			parent.add_child(instance)
	for i in 44:
		var progress := 55.0 + float(i) * 26.0
		var side := -1.0 if i % 2 == 0 else 1.0
		var lateral := side * (Course.HALF_WIDTH + 9.0 + float(i % 4) * 5.0)
		_add_pine(parent, Course.position_at(progress, lateral), 2.4 + float(i % 3) * 0.35, false)
	for i in 5:
		_add_cabin(parent, Course.position_at(155.0 + i * 235.0, (-1.0 if i % 2 == 0 else 1.0) * 72.0))

static func _add_course_markers(parent: Node3D) -> void:
	for checkpoint_index in range(1, Course.CHECKPOINTS.size()):
		var progress: float = Course.CHECKPOINTS[checkpoint_index]
		for side in [-1.0, 1.0]:
			var pole := CylinderMesh.new()
			pole.top_radius = 0.11
			pole.bottom_radius = 0.14
			pole.height = 4.8
			var pole_instance := MeshInstance3D.new()
			pole_instance.mesh = pole
			pole_instance.material_override = solid_material(Color8(255, 114, 140) if side < 0 else Color8(80, 181, 226))
			pole_instance.position = Course.position_at(progress, side * 22.0, 2.2)
			parent.add_child(pole_instance)

static func _add_hazards(parent: Node3D) -> void:
	var points: Array[Vector2] = []
	for i in 10:
		points.append(Vector2(-29.0 + float((i * 17) % 55), 338.0 + i * 28.0))
	for i in 8:
		points.append(Vector2(-31.0 + float((i * 23) % 62), 970.0 + i * 27.0))
	for p in points:
		_add_pine(parent, Course.position_at(p.y, p.x), 1.65 + fmod(p.y, 3.0) * 0.12, true)
	for p in [Vector2(-22, 530), Vector2(24, 1015), Vector2(-12, 1110)]:
		_add_snowman(parent, Course.position_at(p.y, p.x))

static func _add_pine(parent: Node3D, position: Vector3, scale_value: float, hazard: bool) -> void:
	var tree := Node3D.new()
	tree.position = position
	tree.scale = Vector3.ONE * scale_value
	parent.add_child(tree)
	var trunk := CylinderMesh.new()
	trunk.top_radius = 0.22
	trunk.bottom_radius = 0.32
	trunk.height = 2.2
	trunk.radial_segments = 7
	var trunk_instance := MeshInstance3D.new()
	trunk_instance.mesh = trunk
	trunk_instance.material_override = solid_material(Color8(128, 85, 60))
	trunk_instance.position.y = 1.1
	tree.add_child(trunk_instance)
	for layer in 3:
		var crown := CylinderMesh.new()
		crown.top_radius = 0.0
		crown.bottom_radius = 1.65 - layer * 0.28
		crown.height = 2.4
		crown.radial_segments = 8
		var crown_instance := MeshInstance3D.new()
		crown_instance.mesh = crown
		crown_instance.material_override = solid_material(Color8(48, 137 + layer * 10, 112))
		crown_instance.position.y = 2.25 + layer * 1.15
		tree.add_child(crown_instance)
		var cap := CylinderMesh.new()
		cap.top_radius = 0.0
		cap.bottom_radius = 1.52 - layer * 0.28
		cap.height = 0.48
		cap.radial_segments = 8
		var cap_instance := MeshInstance3D.new()
		cap_instance.mesh = cap
		cap_instance.material_override = solid_material(Color8(245, 252, 255))
		cap_instance.position.y = 2.83 + layer * 1.15
		tree.add_child(cap_instance)
	if hazard:
		var body := StaticBody3D.new()
		body.add_to_group("snowboard_hazard")
		body.collision_layer = 2
		body.collision_mask = 1
		var shape := CollisionShape3D.new()
		var capsule := CapsuleShape3D.new()
		capsule.radius = 0.38
		capsule.height = 2.4
		shape.shape = capsule
		shape.position.y = 1.2
		body.add_child(shape)
		tree.add_child(body)

static func _add_snowman(parent: Node3D, position: Vector3) -> void:
	var root := Node3D.new()
	root.position = position
	parent.add_child(root)
	for spec in [Vector3(0, 0.9, 0), Vector3(0, 2.2, 0)]:
		var sphere := SphereMesh.new()
		sphere.radius = 0.85 if spec.y < 1.0 else 0.58
		sphere.height = sphere.radius * 2.0
		var instance := MeshInstance3D.new()
		instance.mesh = sphere
		instance.material_override = solid_material(Color8(247, 253, 255))
		instance.position = spec
		root.add_child(instance)
	var body := StaticBody3D.new()
	body.add_to_group("snowboard_hazard")
	body.collision_layer = 2
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.55
	capsule.height = 2.4
	collision.shape = capsule
	collision.position.y = 1.2
	body.add_child(collision)
	root.add_child(body)

static func _add_ramps(parent: Node3D) -> void:
	for p in [Vector2(-8, 690), Vector2(0, 785), Vector2(11, 880)]:
		var ramp := StaticBody3D.new()
		ramp.position = Course.position_at(p.y, p.x, 0.1)
		ramp.rotation.x = deg_to_rad(-8.0)
		ramp.collision_layer = 1
		var mesh := BoxMesh.new()
		mesh.size = Vector3(10.0, 0.55, 12.0)
		var instance := MeshInstance3D.new()
		instance.mesh = mesh
		instance.material_override = solid_material(Color8(216, 241, 252))
		ramp.add_child(instance)
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = mesh.size
		collision.shape = shape
		ramp.add_child(collision)
		parent.add_child(ramp)

static func _add_snowflakes(parent: Node3D) -> Array:
	var pickups: Array = []
	var colors := [Color8(255, 122, 153), Color8(255, 211, 77), Color8(102, 213, 175), Color8(98, 194, 240), Color8(181, 139, 239)]
	for index in Course.SNOWFLAKES.size():
		var spec: Vector2 = Course.SNOWFLAKES[index]
		var pickup := SnowflakePickup.new()
		pickup.name = "Snowflake%02d" % (index + 1)
		pickup.position = Course.position_at(spec.y, spec.x, 1.9 if spec.y < 650.0 else 2.5)
		pickup.collision_layer = 4
		pickup.collision_mask = 1
		var collision := CollisionShape3D.new()
		var sphere := SphereShape3D.new()
		sphere.radius = 1.15
		collision.shape = sphere
		pickup.add_child(collision)
		for axis in 3:
			var arm := BoxMesh.new()
			arm.size = Vector3(0.25, 2.0, 0.25)
			var arm_instance := MeshInstance3D.new()
			arm_instance.mesh = arm
			arm_instance.material_override = solid_material(colors[(index + axis) % colors.size()], 0.65)
			arm_instance.rotation.z = float(axis) * PI / 3.0
			pickup.add_child(arm_instance)
		parent.add_child(pickup)
		pickups.append(pickup)
	return pickups

static func _add_finish(parent: Node3D) -> void:
	var base := Course.position_at(Course.LENGTH - 7.0, 0.0)
	var colors := [Color8(255, 126, 153), Color8(255, 213, 86), Color8(96, 211, 174), Color8(97, 190, 239), Color8(178, 139, 237)]
	for side in [-1.0, 1.0]:
		for band in colors.size():
			var post := BoxMesh.new()
			post.size = Vector3(0.75, 8.0, 0.75)
			var instance := MeshInstance3D.new()
			instance.mesh = post
			instance.material_override = solid_material(colors[band])
			instance.position = base + Vector3(side * (13.0 - band * 0.7), 4.0 + band * 0.35, 0)
			parent.add_child(instance)
	for band in colors.size():
		var top := BoxMesh.new()
		top.size = Vector3(26.0 - band * 1.4, 0.75, 0.75)
		var top_instance := MeshInstance3D.new()
		top_instance.mesh = top
		top_instance.material_override = solid_material(colors[band])
		top_instance.position = base + Vector3(0, 8.0 + band * 0.7, 0)
		parent.add_child(top_instance)

static func _add_cabin(parent: Node3D, position: Vector3) -> void:
	var cabin := Node3D.new()
	cabin.position = position
	parent.add_child(cabin)
	var body := BoxMesh.new()
	body.size = Vector3(7, 4.5, 6)
	var body_instance := MeshInstance3D.new()
	body_instance.mesh = body
	body_instance.material_override = solid_material(Color8(187, 121, 79))
	body_instance.position.y = 2.25
	cabin.add_child(body_instance)
	var roof := CylinderMesh.new()
	roof.top_radius = 0.0
	roof.bottom_radius = 5.2
	roof.height = 3.8
	roof.radial_segments = 4
	var roof_instance := MeshInstance3D.new()
	roof_instance.mesh = roof
	roof_instance.material_override = solid_material(Color8(243, 251, 255))
	roof_instance.position.y = 5.5
	roof_instance.rotation.y = PI / 4.0
	cabin.add_child(roof_instance)
