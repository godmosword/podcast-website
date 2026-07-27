class_name SnowWorldBuilder
extends Node3D

const Course = preload("res://scripts/course.gd")
const SnowflakePickup = preload("res://scripts/snowflake.gd")
const SnowMaterials = preload("res://scripts/materials.gd")
const SnowVisualProfile = preload("res://scripts/visual_profile.gd")

const TERRAIN_HALF_WIDTH := 82.0
const TERRAIN_STEP_X := 5.0
const TERRAIN_STEP_Z := 4.0
const TERRAIN_CHUNK := 100.0
const TREE_CHUNK := 150.0

var reduced_motion := false
var obstacle_multiplier := 1.0
var visual_profile: SnowVisualProfile
var environment: Environment
var snowflakes: Array = []
var _height_map_shape: HeightMapShape3D
var _visual_instances: Array[GeometryInstance3D] = []
var _last_focus_progress := -9999.0

static func solid_material(color: Color, emission := 0.0) -> StandardMaterial3D:
	return SnowMaterials.clay(color, 0.87, emission)

func _ready() -> void:
	if visual_profile == null:
		visual_profile = SnowVisualProfile.create(reduced_motion, DisplayServer.is_touchscreen_available())
	environment = _add_environment(self, visual_profile)
	if DisplayServer.get_name() == "headless":
		var terrain_root := Node3D.new()
		terrain_root.name = "SnowTerrain"
		add_child(terrain_root)
		_add_height_map_collision(self)
		snowflakes = _add_snowflakes(self, false)
		return
	_add_terrain(self)
	_add_background(self)
	_add_course_markers(self)
	_add_hazards(self)
	_add_ramps(self)
	_add_finish(self)
	snowflakes = _add_snowflakes(self, true)
	_cache_visual_instances()
	update_focus(0.0, true)

func _cache_visual_instances() -> void:
	_visual_instances.clear()
	for node in find_children("*", "GeometryInstance3D", true, false):
		if node is GeometryInstance3D:
			_visual_instances.append(node)

func update_focus(progress: float, force := false) -> void:
	if not force and absf(progress - _last_focus_progress) < 18.0:
		return
	_last_focus_progress = progress
	for instance in _visual_instances:
		if not is_instance_valid(instance):
			continue
		var instance_progress := clampf(-instance.global_position.z, 0.0, Course.LENGTH)
		var range := 245.0
		if instance.is_in_group("snowboard_backdrop"):
			range = 760.0
		elif instance.name.begins_with("SnowChunk"):
			range = 365.0
		elif instance.name.begins_with("Grooming"):
			range = 225.0
		elif instance.name.begins_with("Tree"):
			range = 285.0
		instance.visible = absf(instance_progress - progress) <= range

static func _add_environment(parent: Node3D, profile: SnowVisualProfile) -> Environment:
	RenderingServer.set_default_clear_color(Color8(126, 196, 224))
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color8(72, 151, 201)
	sky_material.sky_horizon_color = Color8(191, 226, 239)
	sky_material.sky_curve = 0.18
	sky_material.ground_bottom_color = Color8(105, 164, 191)
	sky_material.ground_horizon_color = Color8(211, 234, 241)
	sky_material.ground_curve = 0.1
	var sky := Sky.new()
	sky.sky_material = sky_material

	var result := Environment.new()
	result.background_mode = Environment.BG_SKY
	result.sky = sky
	result.background_energy_multiplier = 0.72
	result.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	result.ambient_light_color = Color8(164, 205, 226)
	result.ambient_light_energy = 0.46
	result.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	result.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	result.tonemap_exposure = 0.88
	result.fog_enabled = true
	result.fog_mode = Environment.FOG_MODE_DEPTH
	result.fog_light_color = Color8(183, 218, 232)
	result.fog_light_energy = 0.86
	result.fog_density = 0.82
	result.fog_depth_begin = 115.0
	result.fog_depth_end = 620.0
	result.fog_depth_curve = 1.35
	result.fog_sky_affect = 0.32
	result.fog_sun_scatter = 0.12
	if Course.NIGHT:
		result.background_energy_multiplier = 0.34
		result.ambient_light_color = Color8(82, 110, 166)
		result.ambient_light_energy = 0.28
		result.fog_light_color = Color8(102, 130, 190)
	result.ssao_enabled = profile.ssao_enabled
	if profile.ssao_enabled:
		result.ssao_radius = 2.0
		result.ssao_intensity = 1.15
		result.ssao_power = 1.25
	result.adjustment_enabled = true
	result.adjustment_brightness = 1.02
	result.adjustment_contrast = 1.06
	result.adjustment_saturation = 1.04

	var world_environment := WorldEnvironment.new()
	world_environment.name = "SnowEnvironment"
	world_environment.environment = result
	parent.add_child(world_environment)

	var sun := DirectionalLight3D.new()
	sun.name = "WinterSun"
	sun.rotation_degrees = Vector3(-52, -34, -4)
	sun.light_color = Color8(152, 184, 255) if Course.NIGHT else Color8(255, 238, 204)
	sun.light_energy = 0.42 if Course.NIGHT else 0.88
	sun.light_angular_distance = 2.2
	sun.shadow_enabled = profile.shadows_enabled
	sun.directional_shadow_max_distance = 105.0 if profile.shadows_enabled else 48.0
	sun.directional_shadow_fade_start = 0.72
	parent.add_child(sun)
	return result

func _add_terrain(parent: Node3D) -> void:
	var terrain_root := Node3D.new()
	terrain_root.name = "SnowTerrain"
	parent.add_child(terrain_root)
	var chunk_count := int(ceil(Course.LENGTH / TERRAIN_CHUNK))
	for chunk_index in chunk_count:
		var start_progress := float(chunk_index) * TERRAIN_CHUNK
		var end_progress := minf(Course.LENGTH, start_progress + TERRAIN_CHUNK)
		var chunk_origin := Course.surface_point((start_progress + end_progress) * 0.5)
		var surface := SurfaceTool.new()
		surface.begin(Mesh.PRIMITIVE_TRIANGLES)
		var across_cells := int(TERRAIN_HALF_WIDTH * 2.0 / TERRAIN_STEP_X)
		var along_cells := int((end_progress - start_progress) / TERRAIN_STEP_Z)
		for iz in along_cells:
			var p0 := start_progress + float(iz) * TERRAIN_STEP_Z
			var p1 := minf(end_progress, p0 + TERRAIN_STEP_Z)
			for ix in across_cells:
				var x0 := terrain_x_at(ix, across_cells + 1)
				var x1 := terrain_x_at(ix + 1, across_cells + 1)
				_add_terrain_vertex(surface, x0, p0, chunk_origin)
				_add_terrain_vertex(surface, x1, p0, chunk_origin)
				_add_terrain_vertex(surface, x0, p1, chunk_origin)
				_add_terrain_vertex(surface, x1, p0, chunk_origin)
				_add_terrain_vertex(surface, x1, p1, chunk_origin)
				_add_terrain_vertex(surface, x0, p1, chunk_origin)
		surface.generate_normals()
		var mesh := surface.commit()
		mesh.surface_set_material(0, SnowMaterials.snow())
		var instance := MeshInstance3D.new()
		instance.name = "SnowChunk%02d" % chunk_index
		instance.mesh = mesh
		instance.position = chunk_origin
		instance.visibility_range_end = 430.0
		instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		terrain_root.add_child(instance)
	_add_groomed_ridges(terrain_root)
	_add_height_map_collision(parent)

func _add_groomed_ridges(parent: Node3D) -> void:
	var lateral_step := 2.6 if visual_profile.mobile else 1.8
	var ridge_half_width := 0.045 if visual_profile.mobile else 0.035
	var chunk_count := int(ceil(Course.LENGTH / TERRAIN_CHUNK))
	for chunk_index in chunk_count:
		var start_progress := float(chunk_index) * TERRAIN_CHUNK
		var end_progress := minf(Course.LENGTH, start_progress + TERRAIN_CHUNK)
		var chunk_origin := Course.surface_point((start_progress + end_progress) * 0.5)
		var surface := SurfaceTool.new()
		surface.begin(Mesh.PRIMITIVE_TRIANGLES)
		var along_cells := int((end_progress - start_progress) / TERRAIN_STEP_Z)
		var lateral := -44.0
		while lateral <= 44.0:
			for iz in along_cells:
				var p0 := start_progress + float(iz) * TERRAIN_STEP_Z
				var p1 := minf(end_progress, p0 + TERRAIN_STEP_Z)
				var a := Course.surface_point(p0, lateral - ridge_half_width, 0.038)
				var b := Course.surface_point(p0, lateral + ridge_half_width, 0.038)
				var c := Course.surface_point(p1, lateral - ridge_half_width, 0.038)
				var d := Course.surface_point(p1, lateral + ridge_half_width, 0.038)
				for point in [a, b, c, b, d, c]:
					surface.add_vertex(point - chunk_origin)
			lateral += lateral_step
		surface.generate_normals()
		var mesh := surface.commit()
		mesh.surface_set_material(0, SnowMaterials.grooming())
		var instance := MeshInstance3D.new()
		instance.name = "Grooming%02d" % chunk_index
		instance.mesh = mesh
		instance.position = chunk_origin
		instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		instance.visibility_range_end = 245.0
		parent.add_child(instance)

static func _add_terrain_vertex(surface: SurfaceTool, x: float, progress: float, origin: Vector3) -> void:
	var edge := clampf(absf(x - Course.center_x(progress)) / TERRAIN_HALF_WIDTH, 0.0, 1.0)
	surface.set_color(Color(1.0 - edge * 0.055, 1.0 - edge * 0.025, 1.0))
	surface.set_uv(Vector2((x + TERRAIN_HALF_WIDTH) * 0.155, progress * 0.035))
	surface.add_vertex(Vector3(x, Course.height_at(x, progress), -progress) - origin)

static func terrain_x_at(index: int, sample_width: int) -> float:
	# HeightMapShape3D is centered and spans (sample_width - 1) cells.
	# Keep render vertices and collision samples on exactly the same grid.
	return -float(sample_width - 1) * TERRAIN_STEP_X * 0.5 + float(index) * TERRAIN_STEP_X

func _add_height_map_collision(parent: Node3D) -> void:
	var map_width := int(TERRAIN_HALF_WIDTH * 2.0 / TERRAIN_STEP_X) + 1
	var map_depth := int(Course.LENGTH / TERRAIN_STEP_Z) + 1
	var heights := PackedFloat32Array()
	heights.resize(map_width * map_depth)
	for iz in map_depth:
		var progress := Course.LENGTH - float(iz) * TERRAIN_STEP_Z
		for ix in map_width:
			var x := terrain_x_at(ix, map_width)
			heights[iz * map_width + ix] = Course.height_at(x, progress)
	var height_map := HeightMapShape3D.new()
	height_map.map_width = map_width
	height_map.map_depth = map_depth
	height_map.map_data = heights
	_height_map_shape = height_map
	var collision := CollisionShape3D.new()
	collision.shape = height_map
	collision.scale = Vector3(TERRAIN_STEP_X, 1.0, TERRAIN_STEP_Z)
	collision.position = Vector3(0, 0, -Course.LENGTH * 0.5)
	var ground := StaticBody3D.new()
	ground.name = "SnowCollision"
	ground.collision_layer = 1
	ground.collision_mask = 0
	ground.add_child(collision)
	parent.add_child(ground)

func terrain_alignment_error() -> float:
	if _height_map_shape == null:
		return INF
	var max_error := 0.0
	var map_width := _height_map_shape.map_width
	var map_depth := _height_map_shape.map_depth
	for iz in [0, int(map_depth / 2), map_depth - 1]:
		var progress := Course.LENGTH - float(iz) * TERRAIN_STEP_Z
		for ix in [0, int(map_width / 2), map_width - 1]:
			var x := terrain_x_at(ix, map_width)
			var index: int = iz * map_width + ix
			max_error = maxf(max_error, absf(_height_map_shape.map_data[index] - Course.height_at(x, progress)))
	return max_error

func _add_background(parent: Node3D) -> void:
	_add_mountain_ranges(parent)
	_add_snow_mounds(parent)
	_add_tree_belts(parent)
	for spec in [Vector3(150, -66, 0), Vector3(420, 69, 0), Vector3(720, -70, 0), Vector3(1035, 68, 0)]:
		_add_cabin(parent, Course.position_at(spec.x, spec.y))
	for spec in [Vector2(-58, 235), Vector2(60, 575), Vector2(-62, 905), Vector2(59, 1130)]:
		_add_rock_cluster(parent, Course.position_at(spec.y, spec.x))

static func _add_snow_mounds(parent: Node3D) -> void:
	for i in 17:
		var progress := 72.0 + float(i) * 69.0
		var side := -1.0 if i % 2 == 0 else 1.0
		var lateral := side * (61.0 + float((i * 7) % 12))
		var mound := SphereMesh.new()
		mound.radius = 1.0
		mound.height = 2.0
		mound.radial_segments = 16
		mound.rings = 8
		var instance := _add_mesh(parent, mound, SnowMaterials.snow(), Course.position_at(progress, lateral, -2.8))
		instance.scale = Vector3(20.0 + float(i % 4) * 3.5, 5.2 + float(i % 3) * 1.2, 25.0 + float((i + 2) % 4) * 4.0)

static func _add_mountain_ranges(parent: Node3D) -> void:
	var colors := [Color8(47, 111, 157), Color8(65, 132, 174), Color8(84, 151, 187)]
	var range_progress := [420.0, 790.0, 1410.0]
	for row in 3:
		var progress: float = range_progress[row]
		var origin := Course.position_at(progress)
		var profile: Array[Vector3] = []
		for point_index in 17:
			var x := -384.0 + float(point_index) * 48.0
			var is_peak := point_index % 2 == 1
			var patterned := float((point_index * 31 + row * 43) % 37)
			var height := (72.0 + patterned * 1.45 + row * 5.0) if is_peak else (11.0 + patterned * 0.42)
			if point_index == 0 or point_index == 16:
				height = -4.0
			var depth := float((point_index * 17 + row * 29) % 21) - 10.0
			profile.append(Vector3(x, height, depth))

		var mountain_surface := SurfaceTool.new()
		mountain_surface.begin(Mesh.PRIMITIVE_TRIANGLES)
		for point_index in profile.size() - 1:
			var top_left := profile[point_index]
			var top_right := profile[point_index + 1]
			var bottom_left := Vector3(top_left.x, -18.0, top_left.z + 9.0)
			var bottom_right := Vector3(top_right.x, -18.0, top_right.z + 9.0)
			var facet_color: Color = colors[row].lightened(0.12) if point_index % 3 == 0 else colors[row].darkened(0.08 if point_index % 3 == 1 else 0.0)
			for point in [top_left, bottom_left, bottom_right, top_left, bottom_right, top_right]:
				mountain_surface.set_color(facet_color)
				mountain_surface.add_vertex(point)
		mountain_surface.generate_normals()
		var mountain := MeshInstance3D.new()
		mountain.name = "MountainRange%d" % row
		mountain.mesh = mountain_surface.commit()
		var mountain_material := SnowMaterials.clay(Color.WHITE, 0.98).duplicate() as StandardMaterial3D
		mountain_material.cull_mode = BaseMaterial3D.CULL_DISABLED
		mountain_material.vertex_color_use_as_albedo = true
		mountain.material_override = mountain_material
		mountain.position = origin
		mountain.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mountain.add_to_group("snowboard_backdrop")
		parent.add_child(mountain)

		var snow_surface := SurfaceTool.new()
		snow_surface.begin(Mesh.PRIMITIVE_TRIANGLES)
		for point_index in range(1, profile.size() - 1, 2):
			var peak: Vector3 = profile[point_index] + Vector3(0, 0.18, -0.12)
			var left: Vector3 = peak.lerp(profile[point_index - 1], 0.34) + Vector3(0, 0.12, -0.18)
			var right: Vector3 = peak.lerp(profile[point_index + 1], 0.34) + Vector3(0, 0.12, -0.18)
			for point in [left, right, peak]:
				snow_surface.add_vertex(point)
		snow_surface.generate_normals()
		var snow_cap := MeshInstance3D.new()
		snow_cap.name = "MountainSnow%d" % row
		snow_cap.mesh = snow_surface.commit()
		var snow_material := SnowMaterials.clay(Color8(215 - row * 5, 235 - row * 3, 242), 0.98).duplicate() as StandardMaterial3D
		snow_material.cull_mode = BaseMaterial3D.CULL_DISABLED
		snow_cap.material_override = snow_material
		snow_cap.position = origin
		snow_cap.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		snow_cap.add_to_group("snowboard_backdrop")
		parent.add_child(snow_cap)

func _add_tree_belts(parent: Node3D) -> void:
	if DisplayServer.get_name() == "headless":
		return
	var rng := RandomNumberGenerator.new()
	rng.seed = 912_746
	var chunk_count := int(ceil(Course.LENGTH / TREE_CHUNK))
	for chunk_index in chunk_count:
		var points: Array[Vector3] = []
		var target_count := int(roundi(15.0 * visual_profile.scenery_density * Course.TREE_DENSITY))
		for i in target_count:
			var progress := float(chunk_index) * TREE_CHUNK + rng.randf_range(12.0, TREE_CHUNK - 8.0)
			if progress >= Course.LENGTH - 25.0:
				continue
			var side := -1.0 if i % 2 == 0 else 1.0
			var lateral := side * rng.randf_range(54.0, 78.0)
			points.append(Vector3(progress, lateral, rng.randf_range(0.72, 1.45)))
		_add_tree_multimeshes(parent, points, chunk_index)

static func _add_tree_multimeshes(parent: Node3D, points: Array[Vector3], chunk_index: int) -> void:
	if points.is_empty():
		return
	var trunk_mesh := CylinderMesh.new()
	trunk_mesh.top_radius = 0.18
	trunk_mesh.bottom_radius = 0.31
	trunk_mesh.height = 2.1
	trunk_mesh.radial_segments = 7
	trunk_mesh.material = SnowMaterials.wood(Color8(102, 72, 55))
	var crown_mesh := CylinderMesh.new()
	crown_mesh.top_radius = 0.0
	crown_mesh.bottom_radius = 1.52
	crown_mesh.height = 2.5
	crown_mesh.radial_segments = 9
	crown_mesh.material = SnowMaterials.foliage()
	var cap_mesh := CylinderMesh.new()
	cap_mesh.top_radius = 0.0
	cap_mesh.bottom_radius = 1.43
	cap_mesh.height = 0.42
	cap_mesh.radial_segments = 9
	cap_mesh.material = SnowMaterials.snow()

	var trunks := MultiMesh.new()
	trunks.transform_format = MultiMesh.TRANSFORM_3D
	trunks.mesh = trunk_mesh
	trunks.instance_count = points.size()
	var crowns := MultiMesh.new()
	crowns.transform_format = MultiMesh.TRANSFORM_3D
	crowns.mesh = crown_mesh
	crowns.instance_count = points.size() * 3
	var caps := MultiMesh.new()
	caps.transform_format = MultiMesh.TRANSFORM_3D
	caps.mesh = cap_mesh
	caps.instance_count = points.size() * 3
	var chunk_progress := minf(Course.LENGTH, float(chunk_index) * TREE_CHUNK + TREE_CHUNK * 0.5)
	var chunk_origin := Course.position_at(chunk_progress)
	for i in points.size():
		var spec: Vector3 = points[i]
		var progress := spec.x
		var lateral := spec.y
		var scale_value := spec.z
		var base := Course.position_at(progress, lateral) - chunk_origin
		var tree_rotation := float((i * 37 + chunk_index * 11) % 19) * 0.11
		var trunk_basis := Basis(Vector3.UP, tree_rotation).scaled(Vector3.ONE * scale_value)
		trunks.set_instance_transform(i, Transform3D(trunk_basis, base + Vector3(0, 1.05 * scale_value, 0)))
		for layer in 3:
			var layer_scale := scale_value * (1.0 - float(layer) * 0.16)
			var basis := Basis(Vector3.UP, tree_rotation + layer * 0.19).scaled(Vector3.ONE * layer_scale)
			var y := (2.2 + float(layer) * 1.12) * scale_value
			crowns.set_instance_transform(i * 3 + layer, Transform3D(basis, base + Vector3(0, y, 0)))
			caps.set_instance_transform(i * 3 + layer, Transform3D(basis, base + Vector3(0, y + 0.61 * layer_scale, 0)))
	for spec in [[trunks, "TreeTrunks", false], [crowns, "TreeCrowns", true], [caps, "TreeSnowCaps", false]]:
		var instance := MultiMeshInstance3D.new()
		instance.name = "%s%02d" % [spec[1], chunk_index]
		instance.multimesh = spec[0]
		instance.position = chunk_origin
		instance.visibility_range_end = 360.0
		instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if spec[2] else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		parent.add_child(instance)

static func _add_course_markers(parent: Node3D) -> void:
	for checkpoint_index in range(1, Course.CHECKPOINTS.size()):
		var progress: float = Course.CHECKPOINTS[checkpoint_index]
		for side in [-1.0, 1.0]:
			var root := Node3D.new()
			root.position = Course.position_at(progress, side * 23.0)
			parent.add_child(root)
			var pole := CylinderMesh.new()
			pole.top_radius = 0.09
			pole.bottom_radius = 0.13
			pole.height = 4.6
			var pole_instance := MeshInstance3D.new()
			pole_instance.mesh = pole
			pole_instance.material_override = SnowMaterials.clay(Color8(225, 82, 91), 0.8)
			pole_instance.position.y = 2.25
			root.add_child(pole_instance)
			var flag := BoxMesh.new()
			flag.size = Vector3(2.3, 1.15, 0.09)
			var flag_instance := MeshInstance3D.new()
			flag_instance.mesh = flag
			flag_instance.material_override = SnowMaterials.clay(Color8(255, 126, 151) if side < 0 else Color8(79, 179, 219), 0.82)
			flag_instance.position = Vector3(side * 1.05, 3.55, 0)
			root.add_child(flag_instance)

func _add_hazards(parent: Node3D) -> void:
	var hazard_count := mini(Course.HAZARD_TREES.size(), maxi(1, int(ceil(float(Course.HAZARD_TREES.size()) * obstacle_multiplier))))
	for index in hazard_count:
		var p: Vector2 = Course.HAZARD_TREES[index]
		_add_pine(parent, Course.position_at(p.y, p.x), 1.55 + fmod(p.y, 3.0) * 0.12, true)
	for p in Course.SNOWMEN:
		_add_snowman(parent, Course.position_at(p.y, p.x))

static func _add_pine(parent: Node3D, position: Vector3, scale_value: float, hazard: bool) -> void:
	var tree := Node3D.new()
	tree.position = position
	tree.scale = Vector3.ONE * scale_value
	parent.add_child(tree)
	var trunk := CylinderMesh.new()
	trunk.top_radius = 0.2
	trunk.bottom_radius = 0.32
	trunk.height = 2.2
	trunk.radial_segments = 7
	_add_mesh(tree, trunk, SnowMaterials.wood(), Vector3(0, 1.1, 0))
	for layer in 3:
		var crown := CylinderMesh.new()
		crown.top_radius = 0.0
		crown.bottom_radius = 1.72 - layer * 0.29
		crown.height = 2.5
		crown.radial_segments = 9
		_add_mesh(tree, crown, SnowMaterials.foliage(Color8(28, 94 + layer * 7, 78)), Vector3(0, 2.2 + layer * 1.16, 0), Vector3(0, layer * 0.21, 0))
		var cap := CylinderMesh.new()
		cap.top_radius = 0.0
		cap.bottom_radius = 1.6 - layer * 0.29
		cap.height = 0.46
		cap.radial_segments = 9
		_add_mesh(tree, cap, SnowMaterials.snow(), Vector3(0, 2.84 + layer * 1.16, 0))
	if hazard:
		var body := StaticBody3D.new()
		body.add_to_group("snowboard_hazard")
		body.collision_layer = 2
		body.collision_mask = 1
		var shape := CollisionShape3D.new()
		var capsule := CapsuleShape3D.new()
		capsule.radius = 0.36
		capsule.height = 2.35
		shape.shape = capsule
		shape.position.y = 1.18
		body.add_child(shape)
		tree.add_child(body)

static func _add_snowman(parent: Node3D, position: Vector3) -> void:
	var root := Node3D.new()
	root.position = position
	parent.add_child(root)
	for spec in [Vector3(0, 0.86, 0), Vector3(0, 2.08, 0)]:
		var sphere := SphereMesh.new()
		sphere.radius = 0.82 if spec.y < 1.0 else 0.56
		sphere.height = sphere.radius * 2.0
		_add_mesh(root, sphere, SnowMaterials.clay(Color8(238, 248, 250), 0.9), spec)
	var scarf := TorusMesh.new()
	scarf.inner_radius = 0.38
	scarf.outer_radius = 0.57
	_add_mesh(root, scarf, SnowMaterials.clay(Color8(237, 83, 91), 0.82), Vector3(0, 1.7, 0))
	var nose := CylinderMesh.new()
	nose.top_radius = 0.0
	nose.bottom_radius = 0.16
	nose.height = 0.55
	nose.radial_segments = 7
	_add_mesh(root, nose, SnowMaterials.clay(Color8(242, 139, 52), 0.78), Vector3(0, 2.14, -0.56), Vector3(PI * 0.5, 0, 0))
	var body := StaticBody3D.new()
	body.add_to_group("snowboard_hazard")
	body.collision_layer = 2
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.52
	capsule.height = 2.3
	collision.shape = capsule
	collision.position.y = 1.15
	body.add_child(collision)
	root.add_child(body)

static func _add_ramps(parent: Node3D) -> void:
	for p in Course.RAMPS:
		var ramp := StaticBody3D.new()
		ramp.position = Course.position_at(p.y, p.x, 0.12)
		ramp.rotation.x = deg_to_rad(-8.5)
		ramp.collision_layer = 1
		var mesh := BoxMesh.new()
		mesh.size = Vector3(10.5, 0.62, 12.5)
		var instance := MeshInstance3D.new()
		instance.mesh = mesh
		instance.material_override = SnowMaterials.clay(Color8(213, 235, 242), 0.88)
		ramp.add_child(instance)
		var lip := BoxMesh.new()
		lip.size = Vector3(10.8, 0.18, 1.1)
		_add_mesh(ramp, lip, SnowMaterials.clay(Color8(245, 251, 252), 0.8), Vector3(0, 0.38, -5.55))
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = mesh.size
		collision.shape = shape
		ramp.add_child(collision)
		parent.add_child(ramp)

static func _add_snowflakes(parent: Node3D, with_visuals := true) -> Array:
	var pickups: Array = []
	var colors := [Color8(255, 112, 142), Color8(255, 202, 61), Color8(77, 202, 160), Color8(72, 178, 229), Color8(172, 126, 233)]
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
		if with_visuals:
			var halo := SphereMesh.new()
			halo.radius = 0.9
			halo.height = 1.8
			halo.radial_segments = 12
			halo.rings = 6
			_add_mesh(pickup, halo, SnowMaterials.translucent(Color(0.72, 0.95, 1.0, 0.14)), Vector3.ZERO)
			for axis in 3:
				var arm := BoxMesh.new()
				arm.size = Vector3(0.22, 1.9, 0.22)
				_add_mesh(pickup, arm, SnowMaterials.clay(colors[(index + axis) % colors.size()], 0.65, 0.48), Vector3.ZERO, Vector3(0, 0, float(axis) * PI / 3.0))
		parent.add_child(pickup)
		pickups.append(pickup)
	return pickups

static func _add_finish(parent: Node3D) -> void:
	var root := Node3D.new()
	root.position = Course.position_at(Course.LENGTH - 7.0)
	parent.add_child(root)
	var colors := [Color8(246, 92, 119), Color8(247, 194, 49), Color8(64, 190, 147), Color8(61, 164, 217), Color8(157, 111, 218)]
	for side in [-1.0, 1.0]:
		for band in colors.size():
			var post := CylinderMesh.new()
			post.top_radius = 0.42
			post.bottom_radius = 0.52
			post.height = 7.8
			post.radial_segments = 10
			_add_mesh(root, post, SnowMaterials.clay(colors[band], 0.76), Vector3(side * (12.8 - band * 0.68), 3.9 + band * 0.27, 0))
	for band in colors.size():
		var top := BoxMesh.new()
		top.size = Vector3(25.6 - band * 1.36, 0.62, 0.62)
		_add_mesh(root, top, SnowMaterials.clay(colors[band], 0.76), Vector3(0, 7.85 + band * 0.58, 0))

static func _add_cabin(parent: Node3D, position: Vector3) -> void:
	var cabin := Node3D.new()
	cabin.position = position
	parent.add_child(cabin)
	var body := BoxMesh.new()
	body.size = Vector3(7.2, 4.4, 6.1)
	_add_mesh(cabin, body, SnowMaterials.clay(Color8(177, 105, 67), 0.9), Vector3(0, 2.2, 0))
	var front := BoxMesh.new()
	front.size = Vector3(6.4, 3.5, 0.22)
	_add_mesh(cabin, front, SnowMaterials.clay(Color8(206, 135, 79), 0.88), Vector3(0, 2.2, -3.16))
	var roof := CylinderMesh.new()
	roof.top_radius = 0.0
	roof.bottom_radius = 5.2
	roof.height = 3.6
	roof.radial_segments = 4
	_add_mesh(cabin, roof, SnowMaterials.clay(Color8(225, 238, 241), 0.9), Vector3(0, 5.35, 0), Vector3(0, PI / 4.0, 0))
	for x in [-1.8, 1.8]:
		var window := BoxMesh.new()
		window.size = Vector3(1.25, 1.2, 0.12)
		_add_mesh(cabin, window, SnowMaterials.clay(Color8(255, 205, 98), 0.68, 0.72), Vector3(x, 2.5, -3.31))
	var chimney := BoxMesh.new()
	chimney.size = Vector3(0.85, 2.2, 0.85)
	_add_mesh(cabin, chimney, SnowMaterials.clay(Color8(105, 74, 66), 0.92), Vector3(2.1, 6.1, 0.8))

static func _add_rock_cluster(parent: Node3D, position: Vector3) -> void:
	var root := Node3D.new()
	root.position = position
	parent.add_child(root)
	for i in 4:
		var rock := SphereMesh.new()
		rock.radius = 1.1 + i * 0.22
		rock.height = rock.radius * 1.55
		rock.radial_segments = 7
		rock.rings = 4
		var at := Vector3((i - 1.5) * 1.7, 0.65 + (i % 2) * 0.35, (i % 2) * 1.1)
		_add_mesh(root, rock, SnowMaterials.clay(Color8(119, 157, 171), 0.98), at, Vector3(0.12 * i, 0.33 * i, 0.08))

static func _add_mesh(parent: Node3D, mesh: Mesh, material: Material, at: Vector3, rotate := Vector3.ZERO) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material
	instance.position = at
	instance.rotation = rotate
	instance.visibility_range_end = 460.0
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(instance)
	return instance
