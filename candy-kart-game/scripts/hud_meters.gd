extends Control
## 速度／漂移／Boost 儀表（獨立腳本，避免 hud.gd 內嵌類別 forward reference 解析失敗）。

var _speed := 0.0
var _drift := 0.0
var _boost := false

func set_values(speed_ratio: float, drift_ratio: float, boost_active: bool) -> void:
	_speed = clampf(speed_ratio, 0.0, 1.0)
	_drift = clampf(drift_ratio, 0.0, 1.0)
	_boost = boost_active
	queue_redraw()

func _draw() -> void:
	var w := size.x
	var bar_h := 14.0
	var y := size.y - bar_h - 8.0
	var label_y := y - 22.0
	var ink_soft := Color8(140, 120, 150)
	var sky := Color8(141, 223, 240)
	var pink := Color8(255, 159, 183)
	var lemon := Color8(255, 232, 137)
	var ink := Color8(93, 74, 103)
	draw_string(ThemeDB.fallback_font, Vector2(0, label_y), "速度", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, ink_soft)
	_draw_bar(Rect2(52, label_y - 14, w - 52, bar_h), _speed, sky)
	draw_string(ThemeDB.fallback_font, Vector2(0, y - 8), "漂移", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, ink_soft)
	_draw_bar(Rect2(52, y - 22, w - 52, bar_h), _drift, pink if _drift < 0.98 else lemon)
	if _boost:
		draw_circle(Vector2(w - 18, label_y - 6), 10.0, lemon)
		draw_string(ThemeDB.fallback_font, Vector2(w - 72, label_y - 2), "Boost!", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, ink)

func _draw_bar(rect: Rect2, fill: float, color: Color) -> void:
	draw_rect(rect, Color(1, 1, 1, 0.55))
	var inner := Rect2(rect.position.x + 2, rect.position.y + 2, maxf(0.0, (rect.size.x - 4) * fill), rect.size.y - 4)
	if inner.size.x > 0.0:
		draw_rect(inner, color)
