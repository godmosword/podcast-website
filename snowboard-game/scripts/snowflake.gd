class_name SnowflakePickup
extends Area3D

signal collected(pickup)

var _base_y := 0.0
var _phase := 0.0
var _collected := false

func _ready() -> void:
	_base_y = position.y
	_phase = float(get_instance_id() % 13)
	body_entered.connect(func(body: Node3D) -> void:
		if body.is_in_group("snowboard_rider"):
			set_deferred("monitoring", false)
			collected.emit(self)
	)

func _process(delta: float) -> void:
	if _collected:
		return
	rotation.y += delta * 1.8
	rotation.z = sin(Time.get_ticks_msec() * 0.0022 + _phase) * 0.12
	position.y = _base_y + sin(Time.get_ticks_msec() * 0.003 + _phase) * 0.22

func play_collect() -> void:
	if _collected:
		return
	_collected = true
	set_deferred("monitoring", false)
	var tween := create_tween().set_parallel(true)
	tween.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	tween.tween_property(self, "scale", Vector3.ONE * 1.85, 0.16)
	tween.tween_property(self, "rotation:y", rotation.y + PI, 0.2)
	tween.tween_property(self, "position:y", position.y + 1.1, 0.2)
	tween.chain().tween_callback(queue_free)
