extends Node3D

const Course = preload("res://scripts/course.gd")
const SnowboardBridge = preload("res://scripts/bridge.gd")
const SnowWorldBuilder = preload("res://scripts/world_builder.gd")
const SnowboardRider = preload("res://scripts/rider.gd")
const SnowTrails = preload("res://scripts/trails.gd")
const SnowboardHud = preload("res://scripts/hud.gd")
const SnowboardSfx = preload("res://scripts/sfx.gd")
const SnowboardStrings = preload("res://scripts/strings.gd")
const SnowVisualProfile = preload("res://scripts/visual_profile.gd")

enum RunState { MENU, COUNTDOWN, RUNNING, FINISHING, FINISHED }

var state := RunState.MENU
var sfx: Node
var ui_layer: CanvasLayer
var current_screen: Control
var run_root: Node3D
var world_builder
var rider: CharacterBody3D
var hud: CanvasLayer
var trails: Node3D
var camera_pivot: Node3D
var camera: Camera3D
var run_environment: Environment
var app_theme: Theme
var reduced_motion := false
var visual_profile: SnowVisualProfile
var visual_qa: bool = false
var visual_stage: String = ""
var visual_pose: String = "ride"
var elapsed_seconds := 0.0
var penalty_ms := 0
var falls := 0
var snowflakes_collected := 0
var snowflake_score := 0
var trick_score := 0
var best_combo := 1
var combo_multiplier := 1.0
var combo_timer := 0.0
var snowflake_chain := 0
var current_checkpoint := 0.0
var selected_course_id := "bonbon-peak"
var unlocked_course_ids: Array[String] = ["bonbon-peak"]
var difficulty := "relaxed"
var game_volume := 1.0
var run_id := ""
var fall_progress_snapshot := 0.0
var _last_checkpoint_announced := 0.0
var _finish_sent := false
var _audio_unlocked := false
var _touch_jump_previous := false
var _camera_impact := 0.0
var _camera_spring := 0.0
var _camera_spring_velocity := 0.0
var _visual_perf_elapsed := 0.0
var _visual_perf_reported := false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	# Web-export argv entries are JavaScript-backed string variants in Godot 4.3.
	# A JSON round-trip normalizes them before GDScript comparisons.
	var parsed_args: Variant = JSON.parse_string(JSON.stringify(OS.get_cmdline_user_args()))
	var user_args: Array = parsed_args if parsed_args is Array else []
	for arg in user_args:
		var raw_arg := String(arg)
		if raw_arg.begins_with("--smoke-course="):
			var requested_course := raw_arg.trim_prefix("--smoke-course=")
			if requested_course in Course.COURSE_IDS:
				selected_course_id = requested_course
		if raw_arg.begins_with("--smoke-difficulty="):
			var requested_difficulty := raw_arg.trim_prefix("--smoke-difficulty=")
			if requested_difficulty in ["relaxed", "standard", "challenge"]:
				difficulty = requested_difficulty
	reduced_motion = user_args.has("--visual-reduced-motion") or SnowboardBridge.prefers_reduced_motion()
	var coarse_pointer := user_args.has("--visual-mobile") or SnowboardBridge.uses_coarse_pointer()
	visual_profile = SnowVisualProfile.create(reduced_motion, coarse_pointer)
	Course.select(selected_course_id)
	visual_qa = false
	if user_args.has("--visual-stage=start"):
		visual_stage = "start"
		visual_qa = true
	elif user_args.has("--visual-stage=forest"):
		visual_stage = "forest"
		visual_qa = true
	elif user_args.has("--visual-stage=valley"):
		visual_stage = "valley"
		visual_qa = true
	elif user_args.has("--visual-stage=finish"):
		visual_stage = "finish"
		visual_qa = true
	else:
		visual_stage = ""
	if user_args.has("--visual-pose=carve"):
		visual_pose = "carve"
	elif user_args.has("--visual-pose=jump"):
		visual_pose = "jump"
	elif user_args.has("--visual-pose=landing"):
		visual_pose = "landing"
	else:
		visual_pose = "ride"
	_load_theme_font()
	_setup_ui_scale()
	sfx = SnowboardSfx.new()
	sfx.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(sfx)
	ui_layer = CanvasLayer.new()
	ui_layer.layer = 20
	add_child(ui_layer)
	SnowboardBridge.install_message_listener()
	SnowboardBridge.send_ready()
	if not visual_qa:
		call_deferred("_send_debug_finish_after_boot")
	if OS.get_cmdline_user_args().has("--smoke"):
		_run_smoke()
		return
	if visual_qa:
		call_deferred("_start_visual_qa")
	else:
		_show_title()

func _send_debug_finish_after_boot() -> void:
	# Let the parent React host finish installing its message listener and
	# handling `ready` before the local-only debug shortcut emits its result.
	await get_tree().create_timer(0.25).timeout
	if not visual_qa:
		SnowboardBridge.send_debug_finish_if_requested()

func _input(event: InputEvent) -> void:
	if not _audio_unlocked and (event is InputEventKey or event is InputEventMouseButton or event is InputEventScreenTouch or event is InputEventJoypadButton):
		_audio_unlocked = true
		sfx.unlock()

func _process(delta: float) -> void:
	_apply_inbound_messages()
	if visual_qa and rider and hud:
		world_builder.update_focus(Course.progress_of(rider.global_position))
		_update_camera(delta)
		_visual_perf_elapsed += delta
		if _visual_perf_elapsed >= 4.0 and not _visual_perf_reported:
			_visual_perf_reported = true
			print("VIS_PERF_RESULT fps=%d draws=%d primitives=%d mobile=%s" % [
				Engine.get_frames_per_second(),
				int(Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)),
				int(Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)),
				str(visual_profile.mobile),
			])
		return
	if (state == RunState.RUNNING or state == RunState.FINISHING) and not get_tree().paused and rider and hud:
		if state == RunState.RUNNING:
			elapsed_seconds += delta
		combo_timer = maxf(0.0, combo_timer - delta)
		if combo_timer <= 0.0:
			combo_multiplier = 1.0
			snowflake_chain = 0
		var steer := Input.get_action_strength("steer_right") - Input.get_action_strength("steer_left")
		if hud.touch_left:
			steer -= 1.0
		if hud.touch_right:
			steer += 1.0
		rider.input_steer = clampf(steer, -1.0, 1.0)
		var touch_jump_now: bool = hud.touch_jump
		rider.input_jump = rider.input_jump or Input.is_action_just_pressed("jump") or (touch_jump_now and not _touch_jump_previous)
		_touch_jump_previous = touch_jump_now
		if state == RunState.FINISHING:
			rider.input_steer = 0.0
			rider.input_jump = false
		var progress := Course.progress_of(rider.position)
		world_builder.update_focus(progress)
		_update_checkpoint(progress)
		trails.record(rider.global_position, rider.global_basis, rider.is_on_floor(), rider.carve_strength)
		var total_ms := int(elapsed_seconds * 1000.0) + penalty_ms
		hud.update_state(total_ms, snowflakes_collected, rider.speed, progress, _current_score(total_ms), combo_multiplier)
		_update_camera(delta)
		if state == RunState.RUNNING and progress >= Course.LENGTH - 9.0:
			_begin_finish()
		elif state == RunState.FINISHING and progress >= Course.LENGTH - 7.0:
			_complete_finish()
	if Input.is_action_just_pressed("pause"):
		if state == RunState.RUNNING and not get_tree().paused:
			_pause_run()
		elif get_tree().paused:
			_resume_run()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and state == RunState.RUNNING and not get_tree().paused:
		_pause_run()

func _start_run(skip_countdown := false) -> void:
	_teardown_run()
	_clear_screen()
	elapsed_seconds = 0.0
	penalty_ms = 0
	falls = 0
	snowflakes_collected = 0
	snowflake_score = 0
	trick_score = 0
	best_combo = 1
	combo_multiplier = 1.0
	combo_timer = 0.0
	snowflake_chain = 0
	current_checkpoint = 0.0
	_last_checkpoint_announced = 0.0
	_finish_sent = false
	run_id = "%s-%s" % [str(Time.get_unix_time_from_system()), str(randi())]
	_touch_jump_previous = false
	run_root = Node3D.new()
	run_root.name = "SnowboardRun"
	add_child(run_root)
	world_builder = SnowWorldBuilder.new()
	world_builder.reduced_motion = reduced_motion
	world_builder.visual_profile = visual_profile
	world_builder.obstacle_multiplier = _difficulty_obstacle_multiplier()
	run_root.add_child(world_builder)
	run_environment = world_builder.environment
	for pickup in world_builder.snowflakes:
		pickup.collected.connect(_on_snowflake_collected)
	rider = SnowboardRider.new()
	rider.visual_profile = visual_profile
	var difficulty_config := _difficulty_config()
	rider.configure_difficulty(difficulty_config.speed_multiplier, difficulty_config.assist_strength)
	rider.position = Course.position_at(8.0, 0.0, 1.5)
	rider.wiped_out.connect(_on_wipeout)
	rider.jumped.connect(func() -> void: sfx.play(sfx.snd_jump))
	rider.landed.connect(_on_rider_landed)
	rider.trick_landed.connect(_on_trick_landed)
	run_root.add_child(rider)
	trails = SnowTrails.new()
	trails.visual_profile = visual_profile
	run_root.add_child(trails)
	_build_camera()
	hud = SnowboardHud.new()
	hud.app_theme = app_theme
	hud.touch_layout = visual_profile.touch_layout
	hud.pause_requested.connect(_pause_run)
	hud.resume_requested.connect(_resume_run)
	hud.restart_requested.connect(func() -> void:
		get_tree().paused = false
		_start_run()
	)
	hud.quit_requested.connect(func() -> void:
		get_tree().paused = false
		_show_title()
	)
	add_child(hud)
	if skip_countdown:
		state = RunState.RUNNING
		rider.enabled = true
	else:
		state = RunState.COUNTDOWN
		_begin_countdown()

func _apply_inbound_messages() -> void:
	var message := SnowboardBridge.poll_message()
	if message.is_empty():
		return
	if message.get("type", "") == "config":
		var requested_difficulty := str(message.get("difficulty", "relaxed"))
		difficulty = requested_difficulty if requested_difficulty in ["relaxed", "standard", "challenge"] else "relaxed"
		game_volume = clampf(float(message.get("volume", 1.0)), 0.0, 1.0)
		if sfx:
			sfx.set_volume(game_volume)
		reduced_motion = message.get("reducedMotion", reduced_motion) == true
		visual_profile = SnowVisualProfile.create(reduced_motion, visual_profile.mobile if visual_profile else false)
		var requested_unlocked: Variant = message.get("unlockedCourseIds", ["bonbon-peak"])
		unlocked_course_ids.clear()
		if requested_unlocked is Array:
			for course_id in requested_unlocked:
				if course_id in Course.COURSE_IDS:
					unlocked_course_ids.append(String(course_id))
		if unlocked_course_ids.is_empty():
			unlocked_course_ids.append("bonbon-peak")
		if selected_course_id not in unlocked_course_ids:
			selected_course_id = unlocked_course_ids[0]
		Course.select(selected_course_id)
		if state == RunState.MENU:
			_show_title()
	elif message.get("type", "") == "control":
		var action := str(message.get("action", ""))
		if action == "pause" and state == RunState.RUNNING:
			_pause_run()
		elif action == "resume" and get_tree().paused:
			_resume_run()

func _begin_countdown() -> void:
	for value in [3, 2, 1]:
		if state != RunState.COUNTDOWN or hud == null:
			return
		hud.show_countdown(value)
		sfx.play(sfx.snd_count)
		await get_tree().create_timer(0.75).timeout
	if state != RunState.COUNTDOWN or hud == null:
		return
	hud.show_countdown(0)
	sfx.play(sfx.snd_go)
	state = RunState.RUNNING
	rider.enabled = true

func _update_checkpoint(progress: float) -> void:
	current_checkpoint = Course.checkpoint_for(progress)
	if current_checkpoint > _last_checkpoint_announced:
		_last_checkpoint_announced = current_checkpoint
		sfx.play(sfx.snd_checkpoint)
		if hud:
			hud.notify_checkpoint()

func _on_snowflake_collected(pickup: Area3D) -> void:
	if state != RunState.RUNNING and state != RunState.FINISHING:
		return
	snowflakes_collected += 1
	snowflake_chain += 1
	combo_timer = 3.0
	combo_multiplier = minf(5.0, combo_multiplier + 0.25)
	best_combo = maxi(best_combo, int(ceil(combo_multiplier)))
	snowflake_score += int(100.0 * combo_multiplier)
	sfx.play_pickup(snowflake_chain, game_volume)
	if hud:
		hud.notify_snowflake(snowflake_chain, combo_multiplier)
	if pickup.has_method("play_collect"):
		pickup.play_collect()
	else:
		pickup.queue_free()

func _on_wipeout() -> void:
	if state != RunState.RUNNING:
		return
	fall_progress_snapshot = Course.progress_of(rider.position)
	falls += 1
	penalty_ms += _difficulty_penalty_ms()
	combo_multiplier = 1.0
	combo_timer = 0.0
	snowflake_chain = 0
	sfx.play(sfx.snd_bump)
	_camera_impact = 0.7 if visual_profile.camera_motion else 0.0
	await get_tree().create_timer(0.45).timeout
	if state != RunState.RUNNING or rider == null:
		return
	var respawn_progress := clampf(fall_progress_snapshot - 12.0, 8.0, Course.LENGTH - 20.0)
	rider.reset_at(Course.position_at(respawn_progress, 0.0, 1.7))
	rider.enabled = true

func _begin_finish() -> void:
	if visual_qa or _finish_sent or state != RunState.RUNNING or rider == null:
		return
	state = RunState.FINISHING
	rider.finish_mode = true
	rider.input_jump = false
	if hud:
		hud.notify_finish_line()

func _complete_finish() -> void:
	if visual_qa or _finish_sent or state != RunState.FINISHING:
		return
	_finish_sent = true
	state = RunState.FINISHED
	rider.enabled = false
	var total_ms := int(elapsed_seconds * 1000.0) + penalty_ms
	var final_score := _current_score(total_ms)
	SnowboardBridge.send_finish(run_id, total_ms, falls, snowflakes_collected, Course.SNOWFLAKE_TOTAL, final_score, trick_score, best_combo)
	sfx.play(sfx.snd_finish)
	if hud:
		hud.show_celebration()
	await get_tree().create_timer(0.9).timeout
	_show_result(total_ms, final_score)

func _pause_run() -> void:
	if state != RunState.RUNNING or hud == null:
		return
	get_tree().paused = true
	hud.set_paused_visible(true)
	sfx.set_bgm_paused(true)

func _resume_run() -> void:
	get_tree().paused = false
	if hud:
		hud.set_paused_visible(false)
	sfx.set_bgm_paused(false)

func _build_camera() -> void:
	camera_pivot = Node3D.new()
	camera_pivot.name = "CameraPivot"
	run_root.add_child(camera_pivot)
	camera = Camera3D.new()
	camera.fov = 61.0
	camera.environment = run_environment
	camera.current = true
	camera.position = Vector3(0.75, 1.2, 13.2)
	camera_pivot.add_child(camera)
	camera_pivot.global_position = rider.global_position + Vector3(0, 1.8, 0)
	_update_camera(1.0)

func _update_camera(delta: float) -> void:
	if camera_pivot == null or rider == null:
		return
	var progress := Course.progress_of(rider.global_position)
	var normal := Course.surface_normal(progress, Course.lateral_of(rider.global_position))
	var forward := Course.tangent_at(progress)
	var right := forward.cross(normal).normalized()
	var speed_ratio := clampf(rider.speed / SnowboardRider.MAX_SPEED, 0.0, 1.0)
	var desired: Vector3 = rider.global_position + normal * 1.75 - right * rider.input_steer * 0.55
	_camera_spring_velocity += (-_camera_spring * 42.0 - _camera_spring_velocity * 11.0) * delta
	_camera_spring += _camera_spring_velocity * delta
	desired += normal * _camera_spring
	var smoothing := 1.0 - exp(-delta * 5.2)
	camera_pivot.global_position = camera_pivot.global_position.lerp(desired, smoothing)
	var look_distance := lerpf(12.0, 22.0, speed_ratio)
	var look_target := rider.global_position + forward * look_distance + normal * 0.55
	var shake := Vector3.ZERO
	if visual_profile.camera_motion and _camera_impact > 0.001:
		shake = Vector3(randf_range(-1.0, 1.0), randf_range(-0.65, 0.65), 0) * _camera_impact * 0.16
		_camera_impact = move_toward(_camera_impact, 0.0, delta * 3.8)
	camera_pivot.look_at(look_target + shake, normal)
	var target_roll := deg_to_rad(-rider.input_steer * 3.0) if visual_profile.camera_motion else 0.0
	camera_pivot.rotation.z = lerp_angle(camera_pivot.rotation.z, target_roll, minf(1.0, delta * 4.8))
	var side_offset: float = lerpf(0.45, 0.95, speed_ratio) - rider.input_steer * 0.26
	camera.position.x = lerpf(camera.position.x, side_offset, smoothing)
	camera.position.y = lerpf(camera.position.y, lerpf(1.35, 0.95, speed_ratio), smoothing)
	if visual_profile.camera_motion:
		camera.fov = lerpf(camera.fov, lerpf(60.0, 68.0, speed_ratio), smoothing)
	else:
		camera.fov = 60.0

func _on_rider_landed() -> void:
	sfx.play(sfx.snd_land, -4.0)
	if visual_profile.camera_motion:
		_camera_spring_velocity = -2.2 * maxf(0.35, rider.landing_impact)
		_camera_impact = maxf(_camera_impact, rider.landing_impact * 0.28)

func _on_trick_landed(points: int, clean: bool, _air_seconds: float, _rotation_radians: float) -> void:
	if state != RunState.RUNNING and state != RunState.FINISHING:
		return
	if points <= 0:
		return
	combo_timer = 3.0
	var landing_multiplier := 1.5 if clean else 0.7
	var awarded := int(float(points) * landing_multiplier * combo_multiplier)
	trick_score += awarded
	combo_multiplier = minf(5.0, combo_multiplier + (0.75 if clean else 0.25))
	best_combo = maxi(best_combo, int(ceil(combo_multiplier)))
	if hud:
		hud.notify_trick(awarded, clean, combo_multiplier)

func _start_visual_qa() -> void:
	_start_run(true)
	_visual_perf_elapsed = 0.0
	_visual_perf_reported = false
	var stage_progress: float = float({
		"start": 85.0,
		"forest": 455.0,
		"valley": 785.0,
		"finish": 1150.0,
	}.get(visual_stage, 85.0))
	var lift := 5.4 if visual_pose == "jump" else 1.15
	rider.enabled = false
	rider.visual_preview = true
	rider.position = Course.position_at(stage_progress, 0.0, lift)
	rider.velocity = Course.tangent_at(stage_progress) * SnowboardRider.MAX_SPEED * 0.72
	rider.apply_visual_pose(visual_pose)
	world_builder.update_focus(stage_progress, true)
	hud.update_state(42_350, 7, rider.speed, stage_progress)
	_update_camera(1.0)

func _show_title() -> void:
	_teardown_run()
	_clear_screen()
	state = RunState.MENU
	var root := _screen_background()
	ui_layer.add_child(root)
	current_screen = root
	var box := _center_panel(root)
	box.add_child(_label(SnowboardStrings.t("title"), 54, Color8(54, 93, 126)))
	box.add_child(_label("%s等你出發！" % Course.NAME, 24, Color8(80, 118, 145)))
	box.add_child(_label("左右轉向・空白鍵跳躍・空中轉體・收集彩虹雪花", 18, Color8(80, 118, 145)))
	var course_box := HBoxContainer.new()
	course_box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_child(course_box)
	for course_id in Course.COURSE_IDS:
		var locked: bool = course_id not in unlocked_course_ids
		var course_name := str({
			"bonbon-peak": "糖霜雪峰",
			"pine-trail": "森林小徑",
			"glacier-night": "冰河夜滑",
		}.get(course_id, course_id)) + (" 🔒" if locked else "")
		var course_button := _button(course_name, func() -> void:
			if locked:
				return
			selected_course_id = course_id
			Course.select(selected_course_id)
			_show_title()
		, Color8(219, 241, 252) if course_id != selected_course_id else Color8(255, 211, 77))
		course_button.custom_minimum_size = Vector2(170, 52)
		course_button.disabled = locked
		course_box.add_child(course_button)
	box.add_child(_button(SnowboardStrings.t("start"), func() -> void:
		sfx.play(sfx.snd_click)
		_start_run()
	, Color8(255, 211, 77)))
	box.add_child(_label("三星：完成雪道　%s 秒內　收齊雪花" % str(int(Course.PAR_MS / 1000)), 16, Color8(103, 128, 147)))

func _show_result(total_ms: int, final_score: int) -> void:
	if hud:
		hud.visible = false
	_clear_screen()
	var root := _screen_background(0.35)
	ui_layer.add_child(root)
	current_screen = root
	var box := _center_panel(root)
	var fast := total_ms <= Course.PAR_MS
	var collected_all := snowflakes_collected >= Course.SNOWFLAKE_TOTAL
	box.add_child(_label(SnowboardStrings.t("finish") % Course.NAME, 50, Color8(64, 114, 145)))
	box.add_child(_medal_line([true, fast, collected_all]))
	box.add_child(_label("時間 %s　摔倒 %d 次" % [_format_ms(total_ms), falls], 22, Color8(75, 104, 128)))
	box.add_child(_label("彩虹雪花 %d/%d" % [snowflakes_collected, Course.SNOWFLAKE_TOTAL], 20, Color8(75, 104, 128)))
	box.add_child(_label("分數 %d　特技 %d　最高 Combo ×%d" % [final_score, trick_score, best_combo], 20, Color8(75, 104, 128)))
	box.add_child(_button("再滑一次", func() -> void:
		sfx.play(sfx.snd_click)
		_start_run()
	, Color8(255, 211, 77)))
	box.add_child(_button("回主選單", func() -> void:
		sfx.play(sfx.snd_click)
		_show_title()
	, Color8(219, 241, 252)))

func _screen_background(art_alpha := 0.48) -> Control:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	if app_theme:
		root.theme = app_theme
	var color := ColorRect.new()
	color.set_anchors_preset(Control.PRESET_FULL_RECT)
	color.color = Color8(229, 246, 255)
	root.add_child(color)
	var art := TextureRect.new()
	art.set_anchors_preset(Control.PRESET_FULL_RECT)
	art.texture = load("res://assets/snowboard-cover.webp")
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	art.modulate = Color(1, 1, 1, art_alpha)
	art.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(art)
	return root

func _center_panel(root: Control) -> VBoxContainer:
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(center)
	var panel := PanelContainer.new()
	var style := SnowboardHud.panel_style(Color(1, 1, 1, 0.93), 32)
	style.content_margin_left = 42
	style.content_margin_right = 42
	style.content_margin_top = 30
	style.content_margin_bottom = 30
	panel.add_theme_stylebox_override("panel", style)
	center.add_child(panel)
	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 16)
	panel.add_child(box)
	return box

func _label(text: String, size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	return label

func _button(text: String, callback: Callable, color: Color) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(310, 60)
	button.add_theme_font_size_override("font_size", 24)
	button.add_theme_color_override("font_color", Color8(61, 79, 105))
	button.add_theme_stylebox_override("normal", SnowboardHud.panel_style(color, 30))
	button.add_theme_stylebox_override("hover", SnowboardHud.panel_style(color.lightened(0.08), 30))
	button.add_theme_stylebox_override("pressed", SnowboardHud.panel_style(color.darkened(0.08), 30))
	button.pressed.connect(callback)
	return button

func _medal_line(states: Array) -> Label:
	var label := Label.new()
	var names := ["完成", "夠快", "全雪花"]
	var parts: Array[String] = []
	for i in 3:
		parts.append(("★" if states[i] else "☆") + names[i])
	label.text = "　".join(parts)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 25)
	label.add_theme_color_override("font_color", Color8(221, 164, 40))
	return label

func _format_ms(ms: int) -> String:
	var seconds := ms / 1000
	return "%d:%02d.%02d" % [seconds / 60, seconds % 60, (ms % 1000) / 10]

func _difficulty_config() -> Dictionary:
	match difficulty:
		"challenge":
			return {"speed_multiplier": 1.14, "assist_strength": 0.78}
		"standard":
			return {"speed_multiplier": 1.0, "assist_strength": 1.0}
		_:
			return {"speed_multiplier": 0.86, "assist_strength": 1.34}

func _difficulty_obstacle_multiplier() -> float:
	match difficulty:
		"challenge": return 1.25
		"standard": return 1.0
		_: return 0.72

func _difficulty_penalty_ms() -> int:
	match difficulty:
		"challenge": return 4_000
		"standard": return 3_000
		_: return 2_000

func _current_score(total_ms: int) -> int:
	var time_score := maxi(0, 1_000_000 - total_ms * 4)
	return time_score + snowflake_score + trick_score

func _clear_screen() -> void:
	if current_screen:
		current_screen.queue_free()
		current_screen = null

func _teardown_run() -> void:
	get_tree().paused = false
	if hud:
		hud.queue_free()
		hud = null
	if run_root:
		run_root.queue_free()
		run_root = null
	world_builder = null
	rider = null
	trails = null
	camera_pivot = null
	camera = null
	run_environment = null

func _setup_ui_scale() -> void:
	_update_ui_scale()
	get_window().size_changed.connect(_update_ui_scale)

func _update_ui_scale() -> void:
	get_window().content_scale_factor = 1.0

func _load_theme_font() -> void:
	if not ResourceLoader.exists("res://fonts/cjk.ttf"):
		return
	var font: FontFile = load("res://fonts/cjk.ttf")
	app_theme = Theme.new()
	app_theme.default_font = font
	app_theme.default_font_size = 18

func _run_smoke() -> void:
	# 具名材質可實例化（snow／blob_shadow 含貼圖，改由 _start_run 建世界時覆蓋）。
	var SnowMaterials = preload("res://scripts/materials.gd")
	SnowMaterials.skin()
	SnowMaterials.fabric(Color.WHITE)
	SnowMaterials.wood()
	SnowMaterials.foliage()
	SnowMaterials.board_plastic()
	SnowMaterials.ice()
	if SnowMaterials.CATALOG.size() < 13:
		print("SMOKE_RESULT progress=0.0 simulated=0.0 flakes=0 falls=0 penalty=0 terrain=false surface=false ok=false")
		get_tree().quit(1)
		return
	_start_run(true)
	var simulation_start := Course.progress_of(rider.position)
	Engine.time_scale = 10.0
	await get_tree().create_timer(10.0).timeout
	Engine.time_scale = 1.0
	var simulation_progress := Course.progress_of(rider.position)
	var simulation_ok := simulation_progress > simulation_start + 35.0 and absf(Course.lateral_of(rider.position)) < Course.HALF_WIDTH
	rider.position = Course.position_at(320.0, 0.0, 1.5)
	_update_checkpoint(320.0)
	rider.request_wipeout()
	await get_tree().create_timer(1.8).timeout
	var progress := Course.progress_of(rider.position) if rider else 0.0
	var snowflake_count: int = world_builder.snowflakes.size() if world_builder else 0
	var has_terrain := world_builder != null and world_builder.get_node_or_null("SnowTerrain") != null and world_builder.get_node_or_null("SnowCollision") != null
	var terrain_alignment_ok: bool = world_builder != null and world_builder.terrain_alignment_error() < 0.01
	var checkpoint_ok := current_checkpoint == Course.checkpoint_for(320.0) and progress >= 308.0
	var wipeout_ok := falls == 1 and penalty_ms == _difficulty_penalty_ms()
	var samples_finite := true
	for sample_progress in [0.0, 300.0, 650.0, 950.0, 1200.0]:
		for sample_lateral in [-48.0, 0.0, 48.0]:
			var point := Course.surface_point(sample_progress, sample_lateral)
			var normal := Course.surface_normal(sample_progress, sample_lateral)
			samples_finite = samples_finite and point.is_finite() and normal.is_finite() and normal.y > 0.6
	var ok: bool = rider != null and has_terrain and terrain_alignment_ok and snowflake_count == Course.SNOWFLAKE_TOTAL and checkpoint_ok and wipeout_ok and samples_finite and simulation_ok
	print("SMOKE_RESULT progress=%.1f simulated=%.1f flakes=%d falls=%d penalty=%d terrain=%s aligned=%s surface=%s ok=%s" % [progress, simulation_progress, snowflake_count, falls, penalty_ms, str(has_terrain), str(terrain_alignment_ok), str(samples_finite), str(ok)])
	var exit_code := 0 if ok else 1
	_teardown_run()
	await get_tree().process_frame
	get_tree().quit(exit_code)
