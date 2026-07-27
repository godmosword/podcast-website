class_name Course

const CourseData = preload("res://scripts/course_data.gd")

const COURSE_IDS := ["bonbon-peak", "pine-trail", "glacier-night"]

# These public names intentionally remain stable. The active values are synced
# from a CourseData Resource by select(), so existing generated-world code does
# not need a second copy of course rules.
static var ID := "bonbon-peak"
static var NAME := "糖霜雪峰"
static var LENGTH := 1200.0
static var HALF_WIDTH := 48.0
static var SLOPE := 0.22
static var PAR_MS := 95_000
static var SNOWFLAKE_TOTAL := 12
static var CHECKPOINTS: Array = [0.0, 120.0, 240.0, 360.0, 480.0, 600.0, 720.0, 840.0, 960.0, 1080.0]
static var SNOWFLAKES: Array = []
static var RAMPS: Array = []
static var HAZARD_TREES: Array = []
static var SNOWMEN: Array = []
static var FRICTION := 1.0
static var OBSTACLE_DENSITY := 1.0
static var TREE_DENSITY := 1.0
static var NIGHT := false

static var current: SnowboardCourseData
static var _courses: Dictionary = {}

static func select(course_id: String) -> bool:
	_ensure_courses()
	var selected: SnowboardCourseData = _courses.get(course_id)
	if selected == null:
		selected = _courses["bonbon-peak"]
	current = selected
	_sync_public_values()
	return selected.id == course_id

static func selected_id() -> String:
	_ensure_current()
	return current.id

static func _ensure_current() -> void:
	if current == null:
		select("bonbon-peak")

static func _ensure_courses() -> void:
	if not _courses.is_empty():
		return
	_courses["bonbon-peak"] = _make_course("bonbon-peak", "糖霜雪峰", 1200.0, 48.0, 0.22, 95_000, 1.0, 1.0, 1.0, false, [
		Vector2(-10, 105), Vector2(12, 190), Vector2(-5, 270), Vector2(16, 365),
		Vector2(-18, 470), Vector2(8, 585), Vector2(-8, 700), Vector2(0, 790),
		Vector2(11, 895), Vector2(-14, 995), Vector2(15, 1085), Vector2(0, 1160),
	], [Vector2(-8, 690), Vector2(0, 785), Vector2(11, 880)], [
		Vector2(-29, 338), Vector2(-12, 366), Vector2(5, 394), Vector2(22, 422),
		Vector2(-25, 450), Vector2(-8, 478), Vector2(9, 506), Vector2(26, 534),
		Vector2(-18, 562), Vector2(-1, 590), Vector2(-31, 970), Vector2(-8, 997),
		Vector2(15, 1024), Vector2(-24, 1051), Vector2(-1, 1078), Vector2(22, 1105),
	], [Vector2(-22, 530), Vector2(24, 1015), Vector2(-12, 1110)])
	_courses["pine-trail"] = _make_course("pine-trail", "森林小徑", 1320.0, 38.0, 0.20, 108_000, 0.82, 1.25, 1.35, false, _generated_snowflakes(14, 1320.0, 24.0), [
		Vector2(-14, 420), Vector2(12, 690), Vector2(-8, 1010),
	], _generated_hazards(13, 320.0, 1080.0, 34.0), [Vector2(18, 570), Vector2(-20, 930)])
	_courses["glacier-night"] = _make_course("glacier-night", "冰河夜滑", 1440.0, 52.0, 0.24, 122_000, 1.18, 1.45, 0.82, true, _generated_snowflakes(16, 1440.0, 26.0), [
		Vector2(-18, 390), Vector2(15, 660), Vector2(-4, 930), Vector2(20, 1200),
	], _generated_hazards(16, 300.0, 1190.0, 42.0), [Vector2(-24, 520), Vector2(22, 870), Vector2(-8, 1240)])

static func _make_course(
	course_id: String,
	display_name: String,
	length: float,
	half_width: float,
	slope: float,
	par_ms: int,
	center_scale: float,
	obstacle_density: float,
	tree_density: float,
	night: bool,
	snowflakes: Array,
	ramps: Array,
	hazards: Array,
	snowmen: Array,
) -> SnowboardCourseData:
	var data := CourseData.new()
	return data.configure({
		"id": course_id,
		"display_name": display_name,
		"length": length,
		"half_width": half_width,
		"slope": slope,
		"par_ms": par_ms,
		"checkpoint_spacing": 120.0,
		"center_scale": center_scale,
		"friction": 0.92 if course_id == "glacier-night" else 1.0,
		"obstacle_density": obstacle_density,
		"tree_density": tree_density,
		"night": night,
		"snowflakes": snowflakes,
		"ramps": ramps,
		"hazard_trees": hazards,
		"snowmen": snowmen,
	})

static func _generated_snowflakes(count: int, length: float, lateral_limit: float) -> Array:
	var result: Array = []
	for index in count:
		var progress := 90.0 + float(index) * (length - 170.0) / float(maxi(1, count - 1))
		var lateral := sin(float(index) * 2.17) * lateral_limit * 0.72
		result.append(Vector2(lateral, progress))
	return result

static func _generated_hazards(count: int, start: float, end: float, lateral_limit: float) -> Array:
	var result: Array = []
	for index in count:
		var progress := start + float(index) * (end - start) / float(maxi(1, count - 1))
		var lateral := sin(float(index) * 1.73) * lateral_limit * 0.72
		result.append(Vector2(lateral, progress))
	return result

static func _sync_public_values() -> void:
	ID = current.id
	NAME = current.display_name
	LENGTH = current.length
	HALF_WIDTH = current.half_width
	SLOPE = current.slope
	PAR_MS = current.par_ms
	SNOWFLAKE_TOTAL = current.snowflakes.size()
	CHECKPOINTS = [0.0]
	var checkpoint := current.checkpoint_spacing
	while checkpoint < current.length - 90.0:
		CHECKPOINTS.append(checkpoint)
		checkpoint += current.checkpoint_spacing
	SNOWFLAKES = current.snowflakes
	RAMPS = current.ramps
	HAZARD_TREES = current.hazard_trees
	SNOWMEN = current.snowmen
	FRICTION = current.friction
	OBSTACLE_DENSITY = current.obstacle_density
	TREE_DENSITY = current.tree_density
	NIGHT = current.night

static func center_x(progress: float) -> float:
	_ensure_current()
	var p := clampf(progress, 0.0, LENGTH)
	var fade_in := smoothstep(0.0, 90.0, p)
	return (sin(p * 0.0105) * 6.6 + sin(p * 0.0039 + 0.35) * 3.6 - 1.23) * fade_in * current.center_scale

static func lateral_of(world_position: Vector3) -> float:
	var progress := progress_of(world_position)
	return world_position.x - center_x(progress)

static func height_at(x: float, progress: float) -> float:
	_ensure_current()
	var p := clampf(progress, 0.0, LENGTH)
	var relative_x := x - center_x(p)
	var long_roll := sin(p * 0.038) * 0.68 + sin(p * 0.012 + 0.65) * 1.35
	var start_blend := smoothstep(0.0, 45.0, p)
	var edge_bank := relative_x * relative_x * 0.00052
	var side_roll := sin(relative_x * 0.075 + p * 0.009) * 0.18
	return -p * SLOPE + (long_roll + side_roll) * start_blend + edge_bank

static func surface_point(progress: float, lateral := 0.0, lift := 0.0) -> Vector3:
	var x := center_x(progress) + lateral
	return Vector3(x, height_at(x, progress) + lift, -progress)

static func tangent_at(progress: float) -> Vector3:
	var before := surface_point(maxf(0.0, progress - 0.75))
	var after := surface_point(minf(LENGTH, progress + 0.75))
	return (after - before).normalized()

static func surface_normal(progress: float, lateral := 0.0) -> Vector3:
	var across := surface_point(progress, lateral + 0.5) - surface_point(progress, lateral - 0.5)
	var tangent := tangent_at(progress)
	return across.cross(tangent).normalized()

static func position_at(progress: float, lateral := 0.0, lift := 0.0) -> Vector3:
	return surface_point(progress, lateral, lift)

static func progress_of(world_position: Vector3) -> float:
	_ensure_current()
	return clampf(-world_position.z, 0.0, LENGTH)

static func checkpoint_for(progress: float) -> float:
	_ensure_current()
	var result := 0.0
	for checkpoint in CHECKPOINTS:
		if progress >= checkpoint:
			result = checkpoint
	return result
