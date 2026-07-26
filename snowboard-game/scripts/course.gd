class_name Course

const ID := "bonbon-peak"
const NAME := "糖霜雪峰"
const LENGTH := 1200.0
const HALF_WIDTH := 48.0
const SLOPE := 0.22
const PAR_MS := 95_000
const SNOWFLAKE_TOTAL := 12
const CHECKPOINTS := [0.0, 300.0, 650.0, 950.0]

const SNOWFLAKES := [
	Vector2(-10, 105), Vector2(12, 190), Vector2(-5, 270),
	Vector2(16, 365), Vector2(-18, 470), Vector2(8, 585),
	Vector2(-8, 700), Vector2(0, 790), Vector2(11, 895),
	Vector2(-14, 995), Vector2(15, 1085), Vector2(0, 1160),
]

static func center_x(progress: float) -> float:
	var p := clampf(progress, 0.0, LENGTH)
	var fade_in := smoothstep(0.0, 90.0, p)
	return (sin(p * 0.0105) * 6.6 + sin(p * 0.0039 + 0.35) * 3.6 - 1.23) * fade_in

static func lateral_of(world_position: Vector3) -> float:
	var progress := progress_of(world_position)
	return world_position.x - center_x(progress)

static func height_at(x: float, progress: float) -> float:
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
	return clampf(-world_position.z, 0.0, LENGTH)

static func checkpoint_for(progress: float) -> float:
	var result := 0.0
	for checkpoint in CHECKPOINTS:
		if progress >= checkpoint:
			result = checkpoint
	return result
