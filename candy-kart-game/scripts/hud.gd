class_name Hud
extends CanvasLayer
## 賽事 HUD：名次／圈數／星星／倒數＋觸控按鈕＋速度／漂移／Boost 回饋＋暫停選單。

signal pause_requested
signal resume_requested
signal restart_requested
signal quit_requested

const INK := Color8(93, 74, 103)
const INK_SOFT := Color8(140, 120, 150)
const PINK := Color8(255, 159, 183)
const LEMON := Color8(255, 232, 137)
const MINT := Color8(157, 231, 184)
const SKY := Color8(141, 223, 240)

static var _hint_shown_session := false

var pos_label: Label
var lap_label: Label
var star_label: Label
var count_label: Label
var pause_panel: PanelContainer
var _touch := false
var _meters: Control
var _hint_panel: PanelContainer

# 觸控輸入狀態（由 race 讀取）
var touch_left := false
var touch_right := false
var touch_drift := false
var touch_brake := false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_touch = DisplayServer.is_touchscreen_available()
	_build()

static func chip_style(bg: Color, radius := 18.0) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.corner_radius_top_left = int(radius)
	sb.corner_radius_top_right = int(radius)
	sb.corner_radius_bottom_left = int(radius)
	sb.corner_radius_bottom_right = int(radius)
	sb.content_margin_left = 18.0
	sb.content_margin_right = 18.0
	sb.content_margin_top = 8.0
	sb.content_margin_bottom = 8.0
	return sb

static func make_chip(text: String, font_size: int) -> Dictionary:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", chip_style(Color(1, 1, 1, 0.85)))
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", INK)
	panel.add_child(label)
	return {"panel": panel, "label": label}

func _build() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if Ui.app_theme:
		root.theme = Ui.app_theme
	add_child(root)

	var top := HBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.position = Vector2(16, 14)
	top.size = Vector2(0, 56)
	top.offset_left = 16
	top.offset_right = -16
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(top)

	var pos_chip := make_chip("第 1 名", 28)
	pos_label = pos_chip["label"]
	top.add_child(pos_chip["panel"])

	var spacer1 := Control.new()
	spacer1.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer1.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(spacer1)

	var star_panel := PanelContainer.new()
	star_panel.add_theme_stylebox_override("panel", chip_style(Color(1, 1, 1, 0.85)))
	var star_row := HBoxContainer.new()
	star_row.add_theme_constant_override("separation", 6)
	var star_icon := StarIcon.new()
	star_icon.custom_minimum_size = Vector2(34, 34)
	star_label = Label.new()
	star_label.text = "0/7"
	star_label.add_theme_font_size_override("font_size", 30)
	star_label.add_theme_color_override("font_color", INK)
	star_row.add_child(star_icon)
	star_row.add_child(star_label)
	star_panel.add_child(star_row)
	top.add_child(star_panel)

	var spacer2 := Control.new()
	spacer2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer2.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(spacer2)

	var lap_chip := make_chip("第 1/3 圈", 26)
	lap_label = lap_chip["label"]
	top.add_child(lap_chip["panel"])

	var pause_btn := IconButton.new()
	pause_btn.icon_type = "pause"
	pause_btn.custom_minimum_size = Vector2(68, 68)
	pause_btn.pressed.connect(func() -> void: pause_requested.emit())
	top.add_child(pause_btn)

	count_label = Label.new()
	count_label.add_theme_font_size_override("font_size", 128)
	count_label.add_theme_color_override("font_color", PINK)
	count_label.add_theme_constant_override("outline_size", 14)
	count_label.add_theme_color_override("font_outline_color", Color(1, 1, 1))
	count_label.set_anchors_preset(Control.PRESET_CENTER)
	count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(count_label)

	_meters = Control.new()
	_meters.set_script(load("res://scripts/hud_meters.gd"))
	_meters.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_meters.offset_left = 16
	_meters.offset_right = -16
	_meters.offset_bottom = -196 if _touch else -24
	_meters.offset_top = -248 if _touch else -72
	_meters.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_meters)

	if _touch:
		_build_touch(root)
	_build_pause(root)
	_build_control_hint(root)

func _build_touch(root: Control) -> void:
	var left_btn := IconButton.new()
	left_btn.icon_type = "left"
	left_btn.custom_minimum_size = Vector2(112, 112)
	left_btn.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	left_btn.offset_top = -168
	left_btn.offset_left = 20
	left_btn.button_down.connect(func() -> void: touch_left = true)
	left_btn.button_up.connect(func() -> void: touch_left = false)
	root.add_child(left_btn)

	var right_btn := IconButton.new()
	right_btn.icon_type = "right"
	right_btn.custom_minimum_size = Vector2(112, 112)
	right_btn.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	right_btn.offset_top = -168
	right_btn.offset_left = 148
	right_btn.button_down.connect(func() -> void: touch_right = true)
	right_btn.button_up.connect(func() -> void: touch_right = false)
	root.add_child(right_btn)

	var brake_btn := IconButton.new()
	brake_btn.icon_type = "brake"
	brake_btn.custom_minimum_size = Vector2(240, 88)
	brake_btn.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	brake_btn.offset_top = -88
	brake_btn.offset_left = 20
	brake_btn.button_down.connect(func() -> void: touch_brake = true)
	brake_btn.button_up.connect(func() -> void: touch_brake = false)
	root.add_child(brake_btn)

	var drift_btn := IconButton.new()
	drift_btn.icon_type = "drift"
	drift_btn.custom_minimum_size = Vector2(136, 136)
	drift_btn.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	drift_btn.offset_top = -176
	drift_btn.offset_left = -184
	drift_btn.button_down.connect(func() -> void: touch_drift = true)
	drift_btn.button_up.connect(func() -> void: touch_drift = false)
	root.add_child(drift_btn)

func _build_control_hint(root: Control) -> void:
	if _hint_shown_session:
		return
	_hint_shown_session = true
	_hint_panel = PanelContainer.new()
	_hint_panel.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_hint_panel.offset_left = 24
	_hint_panel.offset_right = -24
	_hint_panel.offset_bottom = -280 if _touch else -96
	_hint_panel.offset_top = -360 if _touch else -176
	var sb := chip_style(Color(1, 1, 1, 0.94), 22.0)
	sb.content_margin_left = 20.0
	sb.content_margin_right = 20.0
	sb.content_margin_top = 14.0
	sb.content_margin_bottom = 14.0
	_hint_panel.add_theme_stylebox_override("panel", sb)
	root.add_child(_hint_panel)

	var lbl := Label.new()
	if _touch:
		lbl.text = "◀ ▶ 轉向　煞車減速　右下漂移蓄力"
	else:
		lbl.text = "← → 轉向　↓ 煞車　空白漂移蓄力"
	lbl.add_theme_font_size_override("font_size", 20)
	lbl.add_theme_color_override("font_color", INK)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_hint_panel.add_child(lbl)

	var dismiss := get_tree().create_timer(7.0)
	dismiss.timeout.connect(func() -> void:
		if is_instance_valid(_hint_panel):
			_hint_panel.queue_free()
	)
	_hint_panel.gui_input.connect(func(ev: InputEvent) -> void:
		if ev is InputEventScreenTouch or ev is InputEventMouseButton:
			_hint_panel.queue_free()
	)

func _build_pause(root: Control) -> void:
	pause_panel = PanelContainer.new()
	pause_panel.visible = false
	pause_panel.set_anchors_preset(Control.PRESET_CENTER)
	var sb := chip_style(Color(1, 1, 1, 0.96), 26.0)
	sb.content_margin_left = 36.0
	sb.content_margin_right = 36.0
	sb.content_margin_top = 28.0
	sb.content_margin_bottom = 28.0
	pause_panel.add_theme_stylebox_override("panel", sb)
	root.add_child(pause_panel)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 14)
	pause_panel.add_child(box)

	var title := Label.new()
	title.text = "暫停中"
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", INK)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)

	box.add_child(_pause_btn("繼續", func() -> void: resume_requested.emit()))
	box.add_child(_pause_btn("重新開始", func() -> void: restart_requested.emit()))
	box.add_child(_pause_btn("回選單", func() -> void: quit_requested.emit()))

func _pause_btn(text: String, fn: Callable) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(220, 54)
	btn.add_theme_font_size_override("font_size", 22)
	btn.add_theme_color_override("font_color", INK)
	btn.add_theme_stylebox_override("normal", chip_style(LEMON, 27.0))
	btn.add_theme_stylebox_override("hover", chip_style(LEMON.lightened(0.1), 27.0))
	btn.add_theme_stylebox_override("pressed", chip_style(LEMON.darkened(0.1), 27.0))
	btn.pressed.connect(fn)
	return btn

func set_paused_visible(value: bool) -> void:
	pause_panel.visible = value

func update_state(pos: int, lap: int, laps: int, stars: int, stars_total: int) -> void:
	pos_label.text = "第 %d 名" % pos
	lap_label.text = "第 %d/%d 圈" % [mini(lap, laps), laps]
	star_label.text = "%d/%d" % [stars, stars_total]

func update_player_meters(speed_ratio: float, drift_ratio: float, boost_active: bool) -> void:
	if _meters and _meters.has_method("set_values"):
		_meters.set_values(speed_ratio, drift_ratio, boost_active)

func show_countdown(n: int) -> void:
	if n > 0:
		count_label.text = str(n)
	elif n == 0:
		count_label.text = "GO!"
		var tw := create_tween()
		tw.tween_interval(0.8)
		tw.tween_callback(func() -> void: count_label.text = "")
	else:
		count_label.text = ""


class IconButton:
	extends Button
	var icon_type := "left"

	func _init() -> void:
		flat = true
		focus_mode = Control.FOCUS_NONE

	func _draw() -> void:
		var c := size / 2.0
		var r := minf(size.x, size.y) * 0.46
		draw_circle(c, r, Color(1, 1, 1, 0.82))
		draw_arc(c, r - 1.5, 0, TAU, 40, Color8(255, 159, 183, 200), 3.0)
		var ink := Color8(93, 74, 103)
		match icon_type:
			"left":
				draw_colored_polygon(PackedVector2Array([
					c + Vector2(-r * 0.42, 0), c + Vector2(r * 0.26, -r * 0.42),
					c + Vector2(r * 0.26, r * 0.42),
				]), ink)
			"right":
				draw_colored_polygon(PackedVector2Array([
					c + Vector2(r * 0.42, 0), c + Vector2(-r * 0.26, -r * 0.42),
					c + Vector2(-r * 0.26, r * 0.42),
				]), ink)
			"brake":
				var bw := r * 0.55
				draw_rect(Rect2(c + Vector2(-bw, -bw * 0.35), Vector2(bw * 2, bw * 0.7)), ink)
				draw_string(ThemeDB.fallback_font, c + Vector2(-bw * 0.7, bw * 0.35), "停", HORIZONTAL_ALIGNMENT_LEFT, -1, int(r * 0.9), Color8(255, 255, 255))
			"drift":
				draw_arc(c, r * 0.5, PI * 0.2, PI * 1.5, 24, ink, r * 0.18)
				var tip := c + Vector2(cos(PI * 1.5), sin(PI * 1.5)) * r * 0.5
				draw_colored_polygon(PackedVector2Array([
					tip + Vector2(r * 0.3, 0), tip + Vector2(-r * 0.12, -r * 0.26),
					tip + Vector2(-r * 0.12, r * 0.26),
				]), ink)
			"pause":
				var w := r * 0.18
				var h := r * 0.5
				draw_rect(Rect2(c + Vector2(-w * 2.2, -h), Vector2(w * 1.6, h * 2)), ink)
				draw_rect(Rect2(c + Vector2(w * 0.6, -h), Vector2(w * 1.6, h * 2)), ink)


class StarIcon:
	extends Control
	func _draw() -> void:
		var c := size / 2.0
		var r := minf(size.x, size.y) * 0.5
		var pts := PackedVector2Array()
		for i in 10:
			var ang := -PI / 2.0 + TAU * i / 10.0
			var rr := r if i % 2 == 0 else r * 0.45
			pts.append(c + Vector2(cos(ang), sin(ang)) * rr)
		draw_colored_polygon(pts, Color8(255, 211, 77))
