extends Node3D
## 繽紛卡丁車主流程：標題 → 選賽道（單場／大獎賽）→ 賽事 → 結算 → 下一站。
## 獲勝標準：單場名次（前 3 = 通關星）＋時間達標星＋全星星；
## 大獎賽 6 站積分 10-8-6-5-4-3-2-1，總分最高奪繽紛糖果盃。

const GP_POINTS := [10, 8, 6, 5, 4, 3, 2, 1]

var sfx: Sfx
var ui_layer: CanvasLayer
var race: Race
var hud: Hud
var current_screen: Control

# 大獎賽狀態
var gp_mode := false
var gp_index := 0
var gp_player_points := 0
var gp_rival_points: Array[int] = []
var _selected_track := 0
var _audio_unlocked := false

func _ready() -> void:
	_load_theme_font()
	_setup_ui_scale()
	sfx = Sfx.new()
	sfx.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(sfx)
	ui_layer = CanvasLayer.new()
	ui_layer.layer = 10
	add_child(ui_layer)
	Bridge.send_ready()
	var debug_track := Bridge.debug_finish_track_id()
	if debug_track != "":
		get_tree().create_timer(0.5).timeout.connect(func() -> void:
			_debug_finish(debug_track)
		)
	# headless CI 煙霧測試：--smoke 直接開賽 6 秒驗證建構與模擬
	if OS.get_cmdline_user_args().has("--smoke"):
		_run_smoke()
		return
	_show_title()

func _run_smoke() -> void:
	_start_race(0)
	race.player.input_steer = 0.2
	var timer := get_tree().create_timer(6.0)
	timer.timeout.connect(func() -> void:
		var ok := race != null and race.karts.size() >= 5 and race.player.progress > 0.0
		print("SMOKE_RESULT pos=%d progress=%.1f karts=%d ok=%s" % [
			race.position_of(race.player), race.player.progress, race.karts.size(), str(ok),
		])
		get_tree().quit(0 if ok else 1)
	)

func _input(event: InputEvent) -> void:
	if not _audio_unlocked and (event is InputEventMouseButton or event is InputEventScreenTouch or event is InputEventKey):
		_audio_unlocked = true
		sfx.unlock()

## e2e 鉤子：?debugFinish=<trackId> 直接送一筆結算讓父頁可測整合。
func _debug_finish(track_id: String) -> void:
	var idx := TrackData.index_of(track_id)
	if idx < 0:
		return
	var track := TrackData.get_track(idx)
	Bridge.send_race_finish(track_id, 1, 200000, 64000, 7, track["stars"].size())

func _clear_screen() -> void:
	if current_screen:
		current_screen.queue_free()
		current_screen = null

func _show_title() -> void:
	_teardown_race()
	_clear_screen()
	var root := Ui.screen_bg()
	ui_layer.add_child(root)
	current_screen = root
	var box := Ui.center_box(root)
	box.add_child(Ui.title_label("繽紛卡丁車", 64, Ui.PINK))
	box.add_child(Ui.title_label("漂移、收星星、拿糖果盃！", 22, Ui.INK_SOFT))
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 10)
	box.add_child(spacer)
	box.add_child(Ui.primary_button("開始", func() -> void:
		sfx.play(sfx.snd_click)
		_show_track_select()
	))

func _show_track_select() -> void:
	_clear_screen()
	var root := Ui.screen_bg()
	ui_layer.add_child(root)
	current_screen = root
	var box := Ui.center_box(root)
	box.add_child(Ui.title_label("選一條賽道", 36))
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 16)
	grid.add_theme_constant_override("v_separation", 12)
	for i in TrackData.track_count():
		var track := TrackData.get_track(i)
		grid.add_child(Ui.track_button(track, func() -> void:
			sfx.play(sfx.snd_click)
			gp_mode = false
			_selected_track = i
			_start_race(i)
		))
	box.add_child(grid)
	var gp_btn := Ui.primary_button("大獎賽（6 站爭糖果盃）", func() -> void:
		sfx.play(sfx.snd_click)
		_start_grand_prix()
	, Vector2(360, 60))
	box.add_child(gp_btn)
	box.add_child(Ui.soft_button("回標題", func() -> void:
		sfx.play(sfx.snd_click)
		_show_title()
	))

func _start_grand_prix() -> void:
	gp_mode = true
	gp_index = 0
	gp_player_points = 0
	gp_rival_points.clear()
	for i in 7:
		gp_rival_points.append(0)
	_start_race(0)

func _start_race(track_index: int) -> void:
	_teardown_race()
	_clear_screen()
	_selected_track = track_index
	race = Race.new()
	add_child(race)
	race.start(track_index, sfx)
	race.race_finished.connect(_on_race_finished)
	hud = Hud.new()
	add_child(hud)
	race.countdown_tick.connect(hud.show_countdown)
	hud.pause_requested.connect(_on_pause)
	hud.resume_requested.connect(_on_resume)
	hud.restart_requested.connect(func() -> void:
		get_tree().paused = false
		_start_race(_selected_track)
	)
	hud.quit_requested.connect(func() -> void:
		get_tree().paused = false
		gp_mode = false
		_show_track_select()
	)

func _teardown_race() -> void:
	get_tree().paused = false
	if race:
		race.queue_free()
		race = null
	if hud:
		hud.queue_free()
		hud = null

func _process(_delta: float) -> void:
	if race and hud and race.player:
		hud.update_state(
			race.position_of(race.player),
			race.player.lap,
			race.track["laps"],
			race.stars_collected,
			race.stars_total(),
		)
		race.player.input_steer = Input.get_action_strength("steer_right") - Input.get_action_strength("steer_left")
		if hud.touch_left:
			race.player.input_steer -= 1.0
		if hud.touch_right:
			race.player.input_steer += 1.0
		race.player.input_drift = Input.is_action_pressed("drift") or hud.touch_drift
		race.player.input_brake = Input.is_action_pressed("brake") or hud.touch_brake
		var p := race.player
		hud.update_player_meters(
			p.speed / Kart.MAX_SPEED,
			p.drift_charge / Kart.DRIFT_CHARGE_TIME,
			p.boost_t > 0.05,
		)
	if Input.is_action_just_pressed("pause") and race and not get_tree().paused:
		_on_pause()
	elif Input.is_action_just_pressed("pause") and get_tree().paused:
		_on_resume()

func _on_pause() -> void:
	if race == null or race.state == Race.State.FINISHED:
		return
	get_tree().paused = true
	hud.set_paused_visible(true)
	sfx.set_bgm_paused(true)

func _on_resume() -> void:
	get_tree().paused = false
	hud.set_paused_visible(false)
	sfx.set_bgm_paused(false)

func _on_race_finished(result: Dictionary) -> void:
	# 回報父頁 gamekit（每場都報，大獎賽也累積三星）
	Bridge.send_race_finish(
		result["track_id"],
		result["player_pos"],
		result["total_ms"],
		result["best_lap_ms"],
		result["stars"],
		result["stars_total"],
	)
	if gp_mode:
		_apply_gp_points(result)
	# 留 1.2 秒讓玩家看到衝線，再進結算
	var timer := get_tree().create_timer(1.2)
	timer.timeout.connect(func() -> void: _show_result(result))

func _apply_gp_points(result: Dictionary) -> void:
	var pos: int = result["player_pos"]
	gp_player_points += GP_POINTS[clampi(pos - 1, 0, GP_POINTS.size() - 1)]
	# 對手依結算排名拿分（略過玩家名次）
	var rival := 0
	for i in GP_POINTS.size():
		if i == pos - 1:
			continue
		if rival < gp_rival_points.size():
			gp_rival_points[rival] += GP_POINTS[i]
			rival += 1

func _show_result(result: Dictionary) -> void:
	_clear_screen()
	var root := Ui.screen_bg()
	ui_layer.add_child(root)
	current_screen = root
	var box := Ui.center_box(root)

	var pos: int = result["player_pos"]
	var headline := "第 %d 名" % pos
	if pos == 1:
		headline = "冠軍！"
	box.add_child(Ui.title_label(headline, 56, Ui.PINK if pos <= 3 else Ui.INK))
	box.add_child(Ui.title_label(result["track_name"], 24, Ui.INK_SOFT))

	var cleared := pos <= 3
	var flawless: bool = result["total_ms"] <= result["par_ms"]
	var collected: bool = result["stars"] >= result["stars_total"]
	box.add_child(Ui.medal_row(cleared, flawless, collected))

	box.add_child(Ui.title_label(
		"時間 %s ・ 最快圈 %s" % [
			Ui.format_ms(result["total_ms"]), Ui.format_ms(result["best_lap_ms"]),
		], 20, Ui.INK_SOFT))

	if gp_mode:
		box.add_child(Ui.title_label("大獎賽積分：%d 分（第 %d / 6 站）" % [gp_player_points, gp_index + 1], 22))
		if gp_index + 1 < TrackData.track_count():
			box.add_child(Ui.primary_button("下一站", func() -> void:
				sfx.play(sfx.snd_click)
				gp_index += 1
				_start_race(gp_index)
			))
		else:
			box.add_child(Ui.primary_button("看總成績", func() -> void:
				sfx.play(sfx.snd_click)
				_show_gp_final()
			))
	else:
		box.add_child(Ui.primary_button("再玩一次", func() -> void:
			sfx.play(sfx.snd_click)
			_start_race(_selected_track)
		))
	box.add_child(Ui.soft_button("回選單", func() -> void:
		sfx.play(sfx.snd_click)
		gp_mode = false
		_show_track_select()
	))

func _show_gp_final() -> void:
	_teardown_race()
	_clear_screen()
	var root := Ui.screen_bg()
	ui_layer.add_child(root)
	current_screen = root
	var box := Ui.center_box(root)

	var best_rival := 0
	for p in gp_rival_points:
		best_rival = maxi(best_rival, p)
	var champion := gp_player_points >= best_rival
	if champion:
		box.add_child(Ui.title_label("繽紛糖果盃 冠軍！", 52, Ui.PINK))
		var cup := CupIcon.new()
		cup.custom_minimum_size = Vector2(120, 120)
		var cup_center := CenterContainer.new()
		cup_center.add_child(cup)
		box.add_child(cup_center)
	else:
		box.add_child(Ui.title_label("大獎賽完賽！", 44))
	box.add_child(Ui.title_label("總積分 %d 分（對手最高 %d 分）" % [gp_player_points, best_rival], 24, Ui.INK_SOFT))
	box.add_child(Ui.primary_button("再來一輪", func() -> void:
		sfx.play(sfx.snd_click)
		_start_grand_prix()
	))
	box.add_child(Ui.soft_button("回選單", func() -> void:
		sfx.play(sfx.snd_click)
		gp_mode = false
		_show_track_select()
	))

## 響應式 UI：依視窗實際像素（含手機高 DPR）調整整體 UI 縮放，
## 桌機／平板／手機都拿到可讀的圖示與文字大小。
func _setup_ui_scale() -> void:
	_update_ui_scale()
	get_window().size_changed.connect(_update_ui_scale)

func _update_ui_scale() -> void:
	var win := get_window()
	var s := Vector2(win.size)
	# 設計基準：寬 820 / 高 620；取較小者避免 HUD 橫向溢出
	var factor := minf(s.x / 820.0, s.y / 620.0)
	win.content_scale_factor = clampf(factor, 1.0, 3.0)

func _load_theme_font() -> void:
	# 子集化的 Noto Sans TC（僅遊戲用字）。預設 theme 自帶字型，
	# 所以要建自訂 Theme 套上各 UI root（Ui.theme / Hud），不能只設 fallback。
	var path := "res://fonts/cjk.ttf"
	if not ResourceLoader.exists(path):
		return
	var font: FontFile = load(path)
	if font == null:
		return
	var theme := Theme.new()
	theme.default_font = font
	theme.default_font_size = 18
	Ui.app_theme = theme


class CupIcon:
	extends Control
	func _draw() -> void:
		var c := Vector2(size.x / 2.0, size.y * 0.42)
		var gold := Color8(255, 211, 77)
		var r := minf(size.x, size.y) * 0.32
		draw_circle(c, r, gold)
		draw_rect(Rect2(c + Vector2(-r * 0.2, r * 0.6), Vector2(r * 0.4, r * 0.7)), gold)
		draw_rect(Rect2(c + Vector2(-r * 0.7, r * 1.3), Vector2(r * 1.4, r * 0.3)), gold)
		draw_arc(c + Vector2(-r * 1.1, 0), r * 0.5, -PI / 2, PI / 2, 16, gold, 6.0)
		draw_arc(c + Vector2(r * 1.1, 0), r * 0.5, PI / 2, PI * 1.5, 16, gold, 6.0)
