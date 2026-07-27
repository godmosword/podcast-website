class_name SnowboardHud
extends CanvasLayer

const Course = preload("res://scripts/course.gd")
const Strings = preload("res://scripts/strings.gd")

signal pause_requested
signal resume_requested
signal restart_requested
signal quit_requested

const INK := Color8(44, 65, 87)
const SKY := Color8(79, 178, 224)
const CORAL := Color8(244, 92, 119)
const YELLOW := Color8(247, 197, 56)

var touch_layout := false
var touch_left := false
var touch_right := false
var touch_jump := false
var app_theme: Theme
var time_label: Label
var flakes_label: Label
var speed_label: Label
var score_label: Label
var combo_label: Label
var progress_bar: ProgressBar
var countdown_label: Label
var pause_panel: PanelContainer
var pause_overlay: ColorRect

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build()

static func panel_style(color: Color, radius := 20) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 7
	style.content_margin_bottom = 7
	return style

func _build() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if app_theme:
		root.theme = app_theme
	add_child(root)

	var top := HBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 18
	top.offset_right = -18
	top.offset_top = 12
	top.offset_bottom = 138 if touch_layout else 66
	top.add_theme_constant_override("separation", 9)
	root.add_child(top)
	time_label = _chip(top, "0:00.00", 38 if touch_layout else 21, Strings.t("time"), 252 if touch_layout else 168)
	flakes_label = _chip(top, "0/12", 38 if touch_layout else 21, Strings.t("snowflakes"), 182 if touch_layout else 126)
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(spacer)
	speed_label = _chip(top, "29", 36 if touch_layout else 20, Strings.t("speed"), 156 if touch_layout else 112)
	score_label = _chip(top, "0", 30 if touch_layout else 17, Strings.t("score"), 150 if touch_layout else 108)
	combo_label = _chip(top, "×1", 30 if touch_layout else 17, Strings.t("combo"), 150 if touch_layout else 108)
	var pause_button := Button.new()
	pause_button.text = "Ⅱ"
	pause_button.custom_minimum_size = Vector2(178, 138) if touch_layout else Vector2(54, 48)
	pause_button.add_theme_font_size_override("font_size", 38 if touch_layout else 22)
	pause_button.add_theme_color_override("font_color", INK)
	pause_button.add_theme_stylebox_override("normal", panel_style(Color(0.97, 0.99, 1.0, 0.84), 19))
	pause_button.add_theme_stylebox_override("pressed", panel_style(Color(0.80, 0.92, 0.97, 0.94), 19))
	pause_button.pressed.connect(func() -> void: pause_requested.emit())
	top.add_child(pause_button)

	progress_bar = ProgressBar.new()
	progress_bar.anchor_left = 0.5
	progress_bar.anchor_right = 0.5
	progress_bar.offset_left = -205
	progress_bar.offset_right = 205
	progress_bar.offset_top = 145 if touch_layout else 70
	progress_bar.offset_bottom = 158 if touch_layout else 81
	progress_bar.max_value = 100
	progress_bar.show_percentage = false
	progress_bar.add_theme_stylebox_override("background", panel_style(Color(0.91, 0.97, 0.99, 0.58), 6))
	progress_bar.add_theme_stylebox_override("fill", panel_style(SKY, 6))
	root.add_child(progress_bar)

	countdown_label = Label.new()
	countdown_label.set_anchors_preset(Control.PRESET_CENTER)
	countdown_label.offset_left = -180
	countdown_label.offset_right = 180
	countdown_label.offset_top = -100
	countdown_label.offset_bottom = 100
	countdown_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	countdown_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	countdown_label.add_theme_font_size_override("font_size", 104)
	countdown_label.add_theme_color_override("font_color", CORAL)
	countdown_label.add_theme_color_override("font_outline_color", Color.WHITE)
	countdown_label.add_theme_constant_override("outline_size", 9)
	root.add_child(countdown_label)

	if touch_layout:
		_build_touch(root)
	_build_pause(root)

func _chip(parent: Container, value: String, size: int, caption: String, minimum_width: float) -> Label:
	var panel := PanelContainer.new()
	panel.custom_minimum_size.x = minimum_width
	panel.add_theme_stylebox_override("panel", panel_style(Color(0.97, 0.99, 1.0, 0.84), 18))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 7)
	panel.add_child(row)
	var small := Label.new()
	small.text = caption
	small.add_theme_font_size_override("font_size", maxi(13, size - (12 if touch_layout else 7)))
	small.add_theme_color_override("font_color", Color8(84, 111, 132))
	row.add_child(small)
	var label := Label.new()
	label.text = value
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", INK)
	row.add_child(label)
	parent.add_child(panel)
	return label

func _build_touch(root: Control) -> void:
	var left := _touch_button("◀", Vector2(18, -196))
	left.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	left.button_down.connect(func() -> void: touch_left = true)
	left.button_up.connect(func() -> void: touch_left = false)
	root.add_child(left)
	var right := _touch_button("▶", Vector2(202, -196))
	right.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	right.button_down.connect(func() -> void: touch_right = true)
	right.button_up.connect(func() -> void: touch_right = false)
	root.add_child(right)
	var jump := _touch_button("跳", Vector2(-198, -196))
	jump.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	jump.button_down.connect(func() -> void: touch_jump = true)
	jump.button_up.connect(func() -> void: touch_jump = false)
	root.add_child(jump)

func _touch_button(text: String, offset: Vector2) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(178, 178)
	button.position = offset
	button.add_theme_font_size_override("font_size", 34)
	button.add_theme_color_override("font_color", INK)
	button.add_theme_stylebox_override("normal", panel_style(Color(0.96, 0.99, 1.0, 0.5), 52))
	button.add_theme_stylebox_override("pressed", panel_style(Color(0.72, 0.89, 0.96, 0.8), 52))
	button.focus_mode = Control.FOCUS_NONE
	return button

func _build_pause(root: Control) -> void:
	pause_overlay = ColorRect.new()
	pause_overlay.visible = false
	pause_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	pause_overlay.color = Color(0.08, 0.19, 0.25, 0.38)
	pause_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(pause_overlay)
	pause_panel = PanelContainer.new()
	pause_panel.visible = false
	pause_panel.set_anchors_preset(Control.PRESET_CENTER)
	pause_panel.add_theme_stylebox_override("panel", panel_style(Color(0.97, 0.99, 1.0, 0.96), 28))
	root.add_child(pause_panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	pause_panel.add_child(box)
	var title := Label.new()
	title.text = Strings.t("pause")
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", INK)
	box.add_child(title)
	box.add_child(_menu_button(Strings.t("resume"), func() -> void: resume_requested.emit(), YELLOW))
	box.add_child(_menu_button(Strings.t("restart"), func() -> void: restart_requested.emit(), Color8(211, 235, 244)))
	box.add_child(_menu_button(Strings.t("quit"), func() -> void: quit_requested.emit(), Color8(236, 233, 239)))

func _menu_button(text: String, callback: Callable, color: Color) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(230, 54)
	button.add_theme_font_size_override("font_size", 21)
	button.add_theme_color_override("font_color", INK)
	button.add_theme_stylebox_override("normal", panel_style(color, 26))
	button.pressed.connect(callback)
	return button

func update_state(total_ms: int, collected: int, speed_mps: float, progress: float, score := 0, combo := 1.0) -> void:
	var total_seconds := total_ms / 1000
	time_label.text = "%d:%02d.%02d" % [total_seconds / 60, total_seconds % 60, (total_ms % 1000) / 10]
	flakes_label.text = "%d/%d" % [collected, Course.SNOWFLAKE_TOTAL]
	speed_label.text = "%d" % int(speed_mps * 3.6)
	if score_label:
		score_label.text = "%d" % score
	if combo_label:
		combo_label.text = "×%d" % int(ceil(combo))
	progress_bar.value = clampf(progress / Course.LENGTH * 100.0, 0.0, 100.0)

func notify_snowflake(chain := 1, combo := 1.0) -> void:
	_pulse_label(flakes_label, Color8(232, 161, 32))
	if combo_label:
		combo_label.text = "×%d" % int(ceil(combo))
		_pulse_label(combo_label, Color8(232, 161, 32))

func notify_trick(points: int, clean: bool, combo := 1.0) -> void:
	if score_label:
		score_label.text = "%d" % points
		_pulse_label(score_label, Color8(69, 178, 142) if clean else Color8(244, 142, 62))
	if combo_label:
		combo_label.text = "×%d" % int(ceil(combo))
		_pulse_label(combo_label, Color8(69, 178, 142) if clean else Color8(244, 142, 62))

func notify_finish_line() -> void:
	if countdown_label:
		countdown_label.text = Strings.t("finish_line")

func show_celebration() -> void:
	if countdown_label:
		countdown_label.text = "🎉"

func notify_checkpoint() -> void:
	var tween := create_tween()
	tween.tween_property(progress_bar, "modulate", Color(1.0, 0.82, 0.36), 0.1)
	tween.tween_property(progress_bar, "modulate", Color.WHITE, 0.32)

func _pulse_label(label: Label, color: Color) -> void:
	label.pivot_offset = label.size * 0.5
	var tween := create_tween().set_parallel(true)
	tween.tween_property(label, "scale", Vector2(1.22, 1.22), 0.1)
	tween.tween_property(label, "modulate", color, 0.1)
	tween.chain().set_parallel(true)
	tween.tween_property(label, "scale", Vector2.ONE, 0.24)
	tween.tween_property(label, "modulate", Color.WHITE, 0.24)

func show_countdown(value: int) -> void:
	countdown_label.text = "出發！" if value == 0 else str(value)
	countdown_label.scale = Vector2.ONE * 0.72
	var pop := create_tween()
	pop.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	pop.tween_property(countdown_label, "scale", Vector2.ONE, 0.22)
	if value == 0:
		pop.tween_interval(0.48)
		pop.tween_callback(func() -> void: countdown_label.text = "")

func set_paused_visible(value: bool) -> void:
	pause_overlay.visible = value
	pause_panel.visible = value
