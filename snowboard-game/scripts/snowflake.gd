class_name SnowflakePickup
extends Area3D

signal collected(pickup)

var _base_y := 0.0
var _phase := 0.0

func _ready() -> void:
	_base_y = position.y
	_phase = float(get_instance_id() % 13)
	body_entered.connect(func(body: Node3D) -> void:
		if body.is_in_group("snowboard_rider"):
			monitoring = false
			collected.emit(self)
	)

func _process(delta: float) -> void:
	rotation.y += delta * 1.8
	position.y = _base_y + sin(Time.get_ticks_msec() * 0.003 + _phase) * 0.22
