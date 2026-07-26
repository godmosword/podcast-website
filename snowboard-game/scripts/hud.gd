class_name SnowboardHud
extends CanvasLayer

const Course = preload("res://scripts/course.gd")

signal pause_requested
signal resume_requested
signal restart_requested
signal quit_requested

const INK := Color8(61, 79, 105)
const SKY := Color8(96, 194, 240)
const CORAL := Color8(255, 122, 142)
const YELLOW := Color8(255, 211, 77)

var touch_left := false
var touch_right := false
var touch_jump := false
var app_theme: Theme
var time_label: Label
var flakes_label: Label
var speed_label: Label
var progress_bar: ProgressBar
var countdown_label: Label
var pause_panel: PanelContainer

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
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 9
	style.content_margin_bottom = 9
	return style

func _build() -> void:
	var touch_device := DisplayServer.is_touchscreen_available()
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
	top.offset_top = 14
	top.offset_bottom = 210 if touch_device else 78
	top.add_theme_constant_override("separation", 12)
	root.add_child(top)
	time_label = _chip(top, "時間 0:00.00", 42 if touch_device else 25)
	flakes_label = _chip(top, "雪花 0/12", 42 if touch_device else 25)
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(spacer)
	speed_label = _chip(top, "8 km/h", 40 if touch_device else 23)
	var pause_button := Button.new()
	pause_button.text = "Ⅱ"
	pause_button.custom_minimum_size = Vector2(190, 190) if touch_device else Vector2(64, 58)
	pause_button.add_theme_font_size_override("font_size", 44 if touch_device else 28)
	pause_button.add_theme_color_override("font_color", INK)
	pause_button.add_theme_stylebox_override("normal", panel_style(Color(1, 1, 1, 0.88), 28))
	pause_button.pressed.connect(func() -> void: pause_requested.emit())
	top.add_child(pause_button)

	progress_bar = ProgressBar.new()
	progress_bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	progress_bar.offset_left = 24
	progress_bar.offset_right = -24
	progress_bar.offset_top = 205 if touch_device else 88
	progress_bar.offset_bottom = 225 if touch_device else 104
	progress_bar.max_value = 100
	progress_bar.show_percentage = false
	progress_bar.add_theme_stylebox_override("background", panel_style(Color(1, 1, 1, 0.65), 8))
	progress_bar.add_theme_stylebox_override("fill", panel_style(SKY, 8))
	root.add_child(progress_bar)

	countdown_label = Label.new()
	countdown_label.set_anchors_preset(Control.PRESET_CENTER)
	countdown_label.offset_left = -180
	countdown_label.offset_right = 180
	countdown_label.offset_top = -100
	countdown_label.offset_bottom = 100
	countdown_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	countdown_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	countdown_label.add_theme_font_size_override("font_size", 112)
	countdown_label.add_theme_color_override("font_color", CORAL)
	countdown_label.add_theme_color_override("font_outline_color", Color.WHITE)
	countdown_label.add_theme_constant_override("outline_size", 12)
	root.add_child(countdown_label)

	if touch_device:
		_build_touch(root)
	_build_pause(root)

func _chip(parent: Container, text: String, size: int) -> Label:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", panel_style(Color(1, 1, 1, 0.88)))
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", INK)
	panel.add_child(label)
	parent.add_child(panel)
	return label

func _build_touch(root: Control) -> void:
	var left := _touch_button("◀", Vector2(22, -226))
	left.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	left.button_down.connect(func() -> void: touch_left = true)
	left.button_up.connect(func() -> void: touch_left = false)
	root.add_child(left)
	var right := _touch_button("▶", Vector2(238, -226))
	right.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	right.button_down.connect(func() -> void: touch_right = true)
	right.button_up.connect(func() -> void: touch_right = false)
	root.add_child(right)
	var jump := _touch_button("跳", Vector2(-222, -226))
	jump.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	jump.button_down.connect(func() -> void: touch_jump = true)
	jump.button_up.connect(func() -> void: touch_jump = false)
	root.add_child(jump)

func _touch_button(text: String, offset: Vector2, min_size := Vector2(200, 200)) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = min_size
	button.position = offset
	button.add_theme_font_size_override("font_size", 36)
	button.add_theme_color_override("font_color", INK)
	button.add_theme_stylebox_override("normal", panel_style(Color(1, 1, 1, 0.8), 54))
	button.add_theme_stylebox_override("pressed", panel_style(Color8(209, 240, 252, 230), 54))
	button.focus_mode = Control.FOCUS_NONE
	return button

func _build_pause(root: Control) -> void:
	pause_panel = PanelContainer.new()
	pause_panel.visible = false
	pause_panel.set_anchors_preset(Control.PRESET_CENTER)
	pause_panel.add_theme_stylebox_override("panel", panel_style(Color(1, 1, 1, 0.97), 28))
	root.add_child(pause_panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	pause_panel.add_child(box)
	var title := Label.new()
	title.text = "暫停中"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", INK)
	box.add_child(title)
	box.add_child(_menu_button("繼續滑", func() -> void: resume_requested.emit(), YELLOW))
	box.add_child(_menu_button("重新開始", func() -> void: restart_requested.emit(), Color8(219, 241, 252)))
	box.add_child(_menu_button("回主選單", func() -> void: quit_requested.emit(), Color8(241, 237, 244)))

func _menu_button(text: String, callback: Callable, color: Color) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(230, 54)
	button.add_theme_font_size_override("font_size", 21)
	button.add_theme_color_override("font_color", INK)
	button.add_theme_stylebox_override("normal", panel_style(color, 26))
	button.pressed.connect(callback)
	return button

func update_state(total_ms: int, collected: int, speed_mps: float, progress: float) -> void:
	var total_seconds := total_ms / 1000
	time_label.text = "時間 %d:%02d.%02d" % [total_seconds / 60, total_seconds % 60, (total_ms % 1000) / 10]
	flakes_label.text = "雪花 %d/%d" % [collected, Course.SNOWFLAKE_TOTAL]
	speed_label.text = "%d km/h" % int(speed_mps * 3.6)
	progress_bar.value = clampf(progress / Course.LENGTH * 100.0, 0.0, 100.0)

func show_countdown(value: int) -> void:
	countdown_label.text = "出發！" if value == 0 else str(value)
	if value == 0:
		var tween := create_tween()
		tween.tween_interval(0.7)
		tween.tween_callback(func() -> void: countdown_label.text = "")

func set_paused_visible(value: bool) -> void:
	pause_panel.visible = value
