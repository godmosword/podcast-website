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

static func height_at(x: float, progress: float) -> float:
	# 首版使用平滑、可預測的 22% 主坡；視覺起伏由跳台與場景道具提供。
	# 單一斜面碰撞能避免 Web trimesh 接縫把玩家誤判為撞牆。
	return -progress * SLOPE

static func position_at(progress: float, lateral := 0.0, lift := 0.0) -> Vector3:
	return Vector3(lateral, height_at(lateral, progress) + lift, -progress)

static func progress_of(world_position: Vector3) -> float:
	return clampf(-world_position.z, 0.0, LENGTH)

static func checkpoint_for(progress: float) -> float:
	var result := 0.0
	for checkpoint in CHECKPOINTS:
		if progress >= checkpoint:
			result = checkpoint
	return result
