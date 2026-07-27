class_name SnowboardCourseData
extends Resource

@export var id := "bonbon-peak"
@export var display_name := "糖霜雪峰"
@export var length := 1200.0
@export var half_width := 48.0
@export var slope := 0.22
@export var par_ms := 95_000
@export var checkpoint_spacing := 120.0
@export var center_scale := 1.0
@export var center_phase := 0.0
@export var friction := 1.0
@export var obstacle_density := 1.0
@export var tree_density := 1.0
@export var night := false
@export var snowflakes: Array = []
@export var ramps: Array = []
@export var hazard_trees: Array = []
@export var snowmen: Array = []

func configure(values: Dictionary) -> SnowboardCourseData:
	for key in values:
		set(key, values[key])
	return self
