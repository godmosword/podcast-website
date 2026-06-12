class_name Ui
## 馬卡龍風 UI 建造 helpers（標題／選單／結算共用）。

const INK := Color8(93, 74, 103)
const INK_SOFT := Color8(140, 120, 150)
const PINK := Color8(255, 159, 183)
const LEMON := Color8(255, 232, 137)
const MINT := Color8(157, 231, 184)
const SKY := Color8(141, 223, 240)

## 全 app 共用 Theme（含 CJK 字型），由 main._load_theme_font 設定。
static var app_theme: Theme = null

static func screen_bg() -> Control:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	if app_theme:
		root.theme = app_theme
	var rect := ColorRect.new()
	rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	rect.color = Color8(255, 247, 237)
	root.add_child(rect)
	return root

static func title_label(text: String, size: int, color := INK) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return label

static func primary_button(text: String, fn: Callable, min_size := Vector2(260, 64)) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	btn.add_theme_font_size_override("font_size", 26)
	btn.add_theme_color_override("font_color", Color8(97, 64, 24))
	btn.add_theme_stylebox_override("normal", Hud.chip_style(LEMON, 32.0))
	btn.add_theme_stylebox_override("hover", Hud.chip_style(LEMON.lightened(0.12), 32.0))
	btn.add_theme_stylebox_override("pressed", Hud.chip_style(LEMON.darkened(0.08), 32.0))
	btn.focus_mode = Control.FOCUS_NONE
	btn.pressed.connect(fn)
	return btn

static func soft_button(text: String, fn: Callable, min_size := Vector2(220, 52)) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	btn.add_theme_font_size_override("font_size", 20)
	btn.add_theme_color_override("font_color", INK)
	btn.add_theme_stylebox_override("normal", Hud.chip_style(Color(1, 1, 1, 0.92), 26.0))
	btn.add_theme_stylebox_override("hover", Hud.chip_style(Color(1, 1, 1, 1.0), 26.0))
	btn.add_theme_stylebox_override("pressed", Hud.chip_style(Color(0.96, 0.93, 0.95), 26.0))
	btn.focus_mode = Control.FOCUS_NONE
	btn.pressed.connect(fn)
	return btn

static func center_box(root: Control) -> VBoxContainer:
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(center)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 18)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(box)
	return box

## 賽道卡片按鈕：主題色塊＋名稱。
static func track_button(track: Dictionary, fn: Callable) -> Button:
	var btn := Button.new()
	btn.custom_minimum_size = Vector2(300, 86)
	btn.focus_mode = Control.FOCUS_NONE
	btn.add_theme_stylebox_override("normal", Hud.chip_style(Color(1, 1, 1, 0.95), 24.0))
	btn.add_theme_stylebox_override("hover", Hud.chip_style(Color(1, 1, 1, 1.0), 24.0))
	btn.add_theme_stylebox_override("pressed", Hud.chip_style(Color(0.97, 0.94, 0.96), 24.0))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	row.set_anchors_preset(Control.PRESET_FULL_RECT)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(row)
	var swatch := ColorRect.new()
	swatch.custom_minimum_size = Vector2(46, 46)
	swatch.color = track["sky_top"]
	swatch.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(swatch)
	var swatch2 := ColorRect.new()
	swatch2.custom_minimum_size = Vector2(14, 46)
	swatch2.color = track["ground"]
	swatch2.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(swatch2)
	var name_label := Label.new()
	name_label.text = track["name"]
	name_label.add_theme_font_size_override("font_size", 24)
	name_label.add_theme_color_override("font_color", INK)
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(name_label)
	btn.pressed.connect(fn)
	return btn

## 三星列：依達成狀態亮／暗（前3名、時間達標、收齊星星）。
static func medal_row(cleared: bool, flawless: bool, collected: bool) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 16)
	var states := [cleared, flawless, collected]
	var labels := ["前三名", "夠快", "全星星"]
	for i in 3:
		var col := VBoxContainer.new()
		col.alignment = BoxContainer.ALIGNMENT_CENTER
		var star := MedalStar.new()
		star.lit = states[i]
		star.custom_minimum_size = Vector2(56, 56)
		col.add_child(star)
		var lbl := Label.new()
		lbl.text = labels[i]
		lbl.add_theme_font_size_override("font_size", 15)
		lbl.add_theme_color_override("font_color", INK if states[i] else INK_SOFT)
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		col.add_child(lbl)
		row.add_child(col)
	return row

static func format_ms(ms: int) -> String:
	var total_s := ms / 1000
	var minutes := total_s / 60
	var seconds := total_s % 60
	var hundredths := (ms % 1000) / 10
	return "%d:%02d.%02d" % [minutes, seconds, hundredths]


class MedalStar:
	extends Control
	var lit := false

	func _draw() -> void:
		var c := size / 2.0
		var r := minf(size.x, size.y) * 0.5
		var pts := PackedVector2Array()
		for i in 10:
			var ang := -PI / 2.0 + TAU * i / 10.0
			var rr := r if i % 2 == 0 else r * 0.45
			pts.append(c + Vector2(cos(ang), sin(ang)) * rr)
		var color := Color8(255, 211, 77) if lit else Color8(222, 214, 224)
		draw_colored_polygon(pts, color)
