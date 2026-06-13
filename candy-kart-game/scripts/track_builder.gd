class_name TrackBuilder
## 把 TrackData 轉成 3D 世界：路面網格、護欄糖珠、裝飾道具、加速帶、起跑線、環境光。
## 全程序生成（無外部資產），MultiMesh 控制 draw call。

const SAMPLE_STEP := 4.0
const BARRIER_STEP := 10.0
const PROP_STEP := 26.0

static func make_clay_material() -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.roughness = 0.85
	mat.metallic = 0.0
	# 程序生成的路面/起跑線/加速帶三角形繞向不保證一致，關閉背面剔除
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return mat

static func solid_material(color: Color, emissive := 0.0) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.8
	if emissive > 0.0:
		mat.emission_enabled = true
		mat.emission = color
		mat.emission_energy_multiplier = emissive
	return mat

## 建出整個賽道世界，回傳掛了所有東西的 Node3D。
static func build_world(track: Dictionary, curve: Curve3D) -> Node3D:
	var root := Node3D.new()
	root.name = "TrackWorld"
	_add_environment(root, track)
	_add_ground(root, track)
	if track.get("backdrop_hills", false):
		_add_backdrop_hills(root, track, curve)
	_add_road(root, track, curve)
	_add_start_line(root, curve)
	_add_barriers(root, track, curve)
	_add_props(root, track, curve)
	if track.has("landmark"):
		_add_landmark(root, track, curve)
	_add_boost_pads(root, track, curve)
	return root

static func _add_environment(root: Node3D, track: Dictionary) -> void:
	var env := Environment.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = track["sky_top"]
	sky_mat.sky_horizon_color = track["sky_horizon"]
	sky_mat.ground_bottom_color = track["ground"]
	sky_mat.ground_horizon_color = track["sky_horizon"]
	var sky := Sky.new()
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 1.1
	var we := WorldEnvironment.new()
	we.environment = env
	root.add_child(we)

	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-48, -32, 0)
	light.light_energy = 1.0
	light.shadow_enabled = false
	root.add_child(light)

static func _add_ground(root: Node3D, track: Dictionary) -> void:
	var plane := PlaneMesh.new()
	plane.size = Vector2(4000, 4000)
	var inst := MeshInstance3D.new()
	inst.mesh = plane
	inst.material_override = solid_material(track["ground"])
	inst.position.y = -0.12
	root.add_child(inst)

static func _add_road(root: Node3D, track: Dictionary, curve: Curve3D) -> void:
	var length := curve.get_baked_length()
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var road_color: Color = track["road"]
	var edge_color: Color = track["edge"]
	var half := TrackData.ROAD_HALF
	var steps := int(length / SAMPLE_STEP)
	var prev_l: Vector3
	var prev_r: Vector3
	var prev_le: Vector3
	var prev_re: Vector3
	for i in steps + 1:
		var off := fmod(float(i) * SAMPLE_STEP, length)
		var pos := curve.sample_baked(off, true)
		var ahead := curve.sample_baked(fmod(off + 1.0, length), true)
		var tangent := (ahead - pos).normalized()
		var side := Vector3(-tangent.z, 0.0, tangent.x)
		var l := pos - side * half
		var r := pos + side * half
		var le := pos - side * (half + 1.2)
		var re := pos + side * (half + 1.2)
		if i > 0:
			_quad(st, prev_l, prev_r, l, r, road_color)
			_quad(st, prev_le, prev_l, le, l, edge_color)
			_quad(st, prev_r, prev_re, r, re, edge_color)
		prev_l = l
		prev_r = r
		prev_le = le
		prev_re = re
	st.generate_normals()
	var inst := MeshInstance3D.new()
	inst.mesh = st.commit()
	inst.material_override = make_clay_material()
	root.add_child(inst)

static func _quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3, color: Color) -> void:
	st.set_color(color)
	st.add_vertex(a)
	st.add_vertex(b)
	st.add_vertex(c)
	st.set_color(color)
	st.add_vertex(b)
	st.add_vertex(d)
	st.add_vertex(c)

static func _add_start_line(root: Node3D, curve: Curve3D) -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var pos := curve.sample_baked(0.0, true)
	var ahead := curve.sample_baked(1.0, true)
	var tangent := (ahead - pos).normalized()
	var side := Vector3(-tangent.z, 0.0, tangent.x)
	var cells := 8
	var cell_w := TrackData.ROAD_HALF * 2.0 / cells
	for row in 2:
		for i in cells:
			var color := Color(1, 1, 1) if (i + row) % 2 == 0 else Color(0.36, 0.29, 0.4)
			var base := pos + side * (-TrackData.ROAD_HALF + cell_w * i) + tangent * (1.5 * row)
			var a := base + Vector3(0, 0.02, 0)
			var b := a + side * cell_w
			var c := a + tangent * 1.5
			var d := b + tangent * 1.5
			_quad(st, a, b, c, d, color)
	var inst := MeshInstance3D.new()
	inst.mesh = st.commit()
	inst.material_override = make_clay_material()
	root.add_child(inst)

static func _add_barriers(root: Node3D, track: Dictionary, curve: Curve3D) -> void:
	var length := curve.get_baked_length()
	var colors: Array = track["barriers"]
	var count := int(length / BARRIER_STEP)
	var mesh := SphereMesh.new()
	mesh.radius = 1.1
	mesh.height = 2.2
	mesh.radial_segments = 10
	mesh.rings = 6
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = mesh
	mm.instance_count = count * 2
	for i in count:
		var off := float(i) * BARRIER_STEP
		var pos := curve.sample_baked(off, true)
		var ahead := curve.sample_baked(fmod(off + 1.0, length), true)
		var tangent := (ahead - pos).normalized()
		var side := Vector3(-tangent.z, 0.0, tangent.x)
		var color: Color = colors[i % colors.size()]
		var l := pos - side * TrackData.BARRIER_LAT
		var r := pos + side * TrackData.BARRIER_LAT
		mm.set_instance_transform(i * 2, Transform3D(Basis(), l + Vector3(0, 0.6, 0)))
		mm.set_instance_color(i * 2, color)
		mm.set_instance_transform(i * 2 + 1, Transform3D(Basis(), r + Vector3(0, 0.6, 0)))
		mm.set_instance_color(i * 2 + 1, color)
	var inst := MultiMeshInstance3D.new()
	inst.multimesh = mm
	var mat := make_clay_material()
	inst.material_override = mat
	root.add_child(inst)

static func _add_backdrop_hills(root: Node3D, track: Dictionary, curve: Curve3D) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(track["id"]) + 9001
	var colors: Array = track["prop_colors"]
	var hill_count := 5
	for i in hill_count:
		var off := float(i) / float(hill_count) * curve.get_baked_length()
		var pos := curve.sample_baked(off, true)
		var ahead := curve.sample_baked(fmod(off + 1.0, curve.get_baked_length()), true)
		var tangent := (ahead - pos).normalized()
		var side := Vector3(-tangent.z, 0.0, tangent.x)
		var lat := rng.randf_range(55.0, 95.0) * (1.0 if i % 2 == 0 else -1.0)
		var base := pos + side * lat
		var scale := rng.randf_range(18.0, 32.0)
		var hill := SphereMesh.new()
		hill.radius = scale * 0.5
		hill.height = scale * 0.35
		var inst := MeshInstance3D.new()
		inst.mesh = hill
		var color: Color = colors[i % colors.size()]
		inst.material_override = solid_material(color.lightened(rng.randf_range(0.05, 0.2)))
		inst.position = base + Vector3(0, scale * 0.12, 0)
		inst.scale = Vector3(1.6, 0.55, 1.4)
		root.add_child(inst)

static func _add_landmark(root: Node3D, track: Dictionary, curve: Curve3D) -> void:
	var length := curve.get_baked_length()
	var frac: float = track.get("landmark_frac", 0.4)
	var off := frac * length
	var pos := curve.sample_baked(off, true)
	var ahead := curve.sample_baked(fmod(off + 1.0, length), true)
	var tangent := (ahead - pos).normalized()
	var side := Vector3(-tangent.z, 0.0, tangent.x)
	var base := pos + side * 42.0
	var landmark := Node3D.new()
	landmark.name = "Landmark"
	landmark.position = base
	match track["landmark"]:
		"lollipop_tower":
			for tier in 3:
				var ball := SphereMesh.new()
				ball.radius = 4.5 - tier * 0.8
				ball.height = 9.0 - tier * 1.6
				var inst := MeshInstance3D.new()
				inst.mesh = ball
				var cols: Array = track["prop_colors"]
				inst.material_override = solid_material(cols[tier % cols.size()])
				inst.position = Vector3(0, 6.0 + tier * 5.5, 0)
				landmark.add_child(inst)
			var stick := CylinderMesh.new()
			stick.top_radius = 1.2
			stick.bottom_radius = 1.4
			stick.height = 14.0
			var stick_inst := MeshInstance3D.new()
			stick_inst.mesh = stick
			stick_inst.material_override = solid_material(Color(1, 0.98, 0.94))
			stick_inst.position = Vector3(0, 7.0, 0)
			landmark.add_child(stick_inst)
		"sandcastle":
			for bx in [-3.5, 0.0, 3.5]:
				var tower := BoxMesh.new()
				tower.size = Vector3(5.0, 8.0 + absf(bx), 5.0)
				var inst := MeshInstance3D.new()
				inst.mesh = tower
				inst.material_override = solid_material(Color8(255, 232, 178))
				inst.position = Vector3(bx, 4.0, 0)
				landmark.add_child(inst)
			var wall := BoxMesh.new()
			wall.size = Vector3(14.0, 3.5, 6.0)
			var wall_inst := MeshInstance3D.new()
			wall_inst.mesh = wall
			wall_inst.material_override = solid_material(Color8(255, 226, 196))
			wall_inst.position = Vector3(0, 1.8, 2.5)
			landmark.add_child(wall_inst)
		"jelly_tree":
			var trunk := CylinderMesh.new()
			trunk.top_radius = 1.8
			trunk.bottom_radius = 2.4
			trunk.height = 10.0
			var trunk_inst := MeshInstance3D.new()
			trunk_inst.mesh = trunk
			trunk_inst.material_override = solid_material(Color8(157, 231, 184).darkened(0.15))
			trunk_inst.position = Vector3(0, 5.0, 0)
			landmark.add_child(trunk_inst)
			for layer in 3:
				var canopy := SphereMesh.new()
				canopy.radius = 5.5 - layer * 0.6
				canopy.height = 8.0
				var inst := MeshInstance3D.new()
				inst.mesh = canopy
				var cols: Array = track["prop_colors"]
				inst.material_override = solid_material(cols[layer % cols.size()])
				inst.position = Vector3(0, 12.0 + layer * 3.5, 0)
				landmark.add_child(inst)
		"ice_mountain":
			for peak in 3:
				var cone := SphereMesh.new()
				cone.radius = 6.0 - peak * 1.2
				cone.height = 12.0 - peak * 2.0
				var inst := MeshInstance3D.new()
				inst.mesh = cone
				inst.material_override = solid_material(Color8(248, 252, 255) if peak < 2 else Color8(255, 180, 207))
				inst.position = Vector3(peak * 2.5 - 2.5, 6.0 + peak * 4.0, 0)
				inst.scale = Vector3(1.0, 1.4, 1.0)
				landmark.add_child(inst)
		"volcano":
			var cone := SphereMesh.new()
			cone.radius = 10.0
			cone.height = 16.0
			var body := MeshInstance3D.new()
			body.mesh = cone
			body.material_override = solid_material(Color8(122, 82, 48))
			body.position = Vector3(0, 8.0, 0)
			body.scale = Vector3(1.2, 1.5, 1.2)
			landmark.add_child(body)
			var lava := SphereMesh.new()
			lava.radius = 3.5
			lava.height = 2.0
			var lava_inst := MeshInstance3D.new()
			lava_inst.mesh = lava
			lava_inst.material_override = solid_material(Color8(255, 196, 168), 0.6)
			lava_inst.position = Vector3(0, 15.5, 0)
			landmark.add_child(lava_inst)
		"rainbow_arch":
			var arch_colors := [
				Color8(255, 159, 183), Color8(255, 232, 137), Color8(157, 231, 184),
				Color8(141, 223, 240), Color8(201, 180, 255),
			]
			for band in arch_colors.size():
				var torus := TorusMesh.new()
				torus.inner_radius = 14.0 - band * 1.1
				torus.outer_radius = 15.2 - band * 1.1
				var inst := MeshInstance3D.new()
				inst.mesh = torus
				inst.material_override = solid_material(arch_colors[band])
				inst.rotation_degrees = Vector3(90, 0, 0)
				inst.position = Vector3(0, 14.0 - band * 0.8, 0)
				landmark.add_child(inst)
		_:
			var ball := SphereMesh.new()
			ball.radius = 6.0
			ball.height = 12.0
			var inst := MeshInstance3D.new()
			inst.mesh = ball
			inst.material_override = solid_material(track["road"])
			inst.position = Vector3(0, 6.0, 0)
			landmark.add_child(inst)
	root.add_child(landmark)

static func _add_props(root: Node3D, track: Dictionary, curve: Curve3D) -> void:
	var length := curve.get_baked_length()
	var colors: Array = track["prop_colors"]
	var density: float = track.get("prop_density", 1.0)
	var step := PROP_STEP / clampf(density, 0.85, 1.6)
	var count := int(length / step)
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(track["id"])

	var head_mesh: Mesh
	match track["prop"]:
		"icecream":
			var cone := SphereMesh.new()
			cone.radius = 2.4
			cone.height = 4.8
			head_mesh = cone
		"jelly":
			var jelly := CapsuleMesh.new()
			jelly.radius = 2.2
			jelly.height = 5.0
			head_mesh = jelly
		"cloud":
			var cloud := SphereMesh.new()
			cloud.radius = 3.2
			cloud.height = 4.2
			head_mesh = cloud
		"choco":
			var box := BoxMesh.new()
			box.size = Vector3(3.6, 3.6, 3.6)
			head_mesh = box
		_:
			var ball := SphereMesh.new()
			ball.radius = 2.6
			ball.height = 5.2
			head_mesh = ball

	var head_mm := MultiMesh.new()
	head_mm.transform_format = MultiMesh.TRANSFORM_3D
	head_mm.use_colors = true
	head_mm.mesh = head_mesh
	head_mm.instance_count = count

	var stick_mesh := CylinderMesh.new()
	stick_mesh.top_radius = 0.4
	stick_mesh.bottom_radius = 0.5
	stick_mesh.height = 4.0
	var stick_mm := MultiMesh.new()
	stick_mm.transform_format = MultiMesh.TRANSFORM_3D
	stick_mm.use_colors = true
	stick_mm.mesh = stick_mesh
	stick_mm.instance_count = count

	for i in count:
		var off := float(i) * step + rng.randf_range(-6.0, 6.0)
		off = fposmod(off, length)
		var pos := curve.sample_baked(off, true)
		var ahead := curve.sample_baked(fmod(off + 1.0, length), true)
		var tangent := (ahead - pos).normalized()
		var side := Vector3(-tangent.z, 0.0, tangent.x)
		var lat := rng.randf_range(16.0, 30.0) * (1.0 if rng.randf() < 0.5 else -1.0)
		var base := pos + side * lat
		var scale := rng.randf_range(0.8, 1.5)
		var color: Color = colors[i % colors.size()]
		var stick_t := Transform3D(Basis().scaled(Vector3(scale, scale, scale)), base + Vector3(0, 2.0 * scale, 0))
		stick_mm.set_instance_transform(i, stick_t)
		stick_mm.set_instance_color(i, Color(1, 0.98, 0.94))
		var head_t := Transform3D(Basis().scaled(Vector3(scale, scale, scale)), base + Vector3(0, 5.4 * scale, 0))
		head_mm.set_instance_transform(i, head_t)
		head_mm.set_instance_color(i, color)

	var stick_inst := MultiMeshInstance3D.new()
	stick_inst.multimesh = stick_mm
	stick_inst.material_override = make_clay_material()
	root.add_child(stick_inst)
	var head_inst := MultiMeshInstance3D.new()
	head_inst.multimesh = head_mm
	head_inst.material_override = make_clay_material()
	root.add_child(head_inst)

static func _add_boost_pads(root: Node3D, track: Dictionary, curve: Curve3D) -> void:
	var length := curve.get_baked_length()
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var color := Color8(255, 232, 137)
	for frac in track["boosts"]:
		var off: float = frac * length
		var pos := curve.sample_baked(off, true)
		var ahead := curve.sample_baked(fmod(off + 1.0, length), true)
		var tangent := (ahead - pos).normalized()
		var side := Vector3(-tangent.z, 0.0, tangent.x)
		var y := Vector3(0, 0.03, 0)
		# 路面亮黃箭頭帶
		var a := pos - side * 5.0 + y
		var b := pos + side * 5.0 + y
		var c := a + tangent * 7.0
		var d := b + tangent * 7.0
		_quad(st, a, b, c, d, color)
		# 中央箭頭（白）
		var tip := pos + tangent * 6.0 + y * 2.0
		st.set_color(Color(1, 1, 1))
		st.add_vertex(pos - side * 2.4 + tangent * 1.6 + y * 2.0)
		st.add_vertex(pos + side * 2.4 + tangent * 1.6 + y * 2.0)
		st.add_vertex(tip)
	var inst := MeshInstance3D.new()
	inst.mesh = st.commit()
	var mat := make_clay_material()
	mat.emission_enabled = true
	mat.emission = color
	mat.emission_energy_multiplier = 0.35
	inst.material_override = mat
	root.add_child(inst)
