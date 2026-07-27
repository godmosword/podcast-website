class_name SnowboardBridge

const Course = preload("res://scripts/course.gd")

const SOURCE := "cheche-snowboard"

static func _post(payload: Dictionary) -> void:
	if not OS.has_feature("web"):
		print("[bridge] ", JSON.stringify(payload))
		return
	JavaScriptBridge.eval(
		"(()=>window.parent.postMessage(%s,window.location.origin))()" % JSON.stringify(payload),
		true,
	)

static func send_ready() -> void:
	_post({
		"source": SOURCE,
		"type": "ready",
		"protocolVersion": 2,
		"supportedCourseIds": Course.COURSE_IDS,
	})

static func send_finish(run_id: String, total_ms: int, falls: int, collected: int, total: int, score: int, trick_score: int, best_combo: int) -> void:
	_post({
		"source": SOURCE,
		"type": "run-finish",
		"protocolVersion": 2,
		"runId": run_id,
		"courseId": Course.ID,
		"totalMs": total_ms,
		"falls": falls,
		"snowflakesCollected": collected,
		"snowflakesTotal": total,
		"score": score,
		"trickScore": trick_score,
		"bestCombo": best_combo,
	})

static func send_debug_finish_if_requested() -> void:
	if not OS.has_feature("web"):
		return
	var debug_build := "true" if OS.is_debug_build() else "false"
	var payload := {
		"source": SOURCE,
		"type": "run-finish",
		"protocolVersion": 2,
		"runId": "debug-local-run",
		"courseId": Course.ID,
		"totalMs": 90_000,
		"falls": 0,
		"snowflakesCollected": Course.SNOWFLAKE_TOTAL,
		"snowflakesTotal": Course.SNOWFLAKE_TOTAL,
		"score": 1_000_000,
		"trickScore": 0,
		"bestCombo": 1,
	}
	JavaScriptBridge.eval(
		"(()=>{if((%s||%s)&&new URLSearchParams(window.location.search).get('debugFinish')==='%s')window.parent.postMessage(%s,window.location.origin)})()" % [debug_build, _is_local_host_js(), Course.ID, JSON.stringify(payload)],
		true,
	)

static func poll_message() -> Dictionary:
	if not OS.has_feature("web"):
		return {}
	var raw: Variant = JavaScriptBridge.eval("(()=>{const m=window.__checheSnowboardMessage||null;window.__checheSnowboardMessage=null;return m?JSON.stringify(m):''})()", true)
	if typeof(raw) != TYPE_STRING or String(raw).is_empty():
		return {}
	var parsed: Variant = JSON.parse_string(String(raw))
	return parsed if parsed is Dictionary else {}

static func install_message_listener() -> void:
	if not OS.has_feature("web"):
		return
	JavaScriptBridge.eval("(()=>{if(window.__checheSnowboardListenerInstalled)return;window.__checheSnowboardListenerInstalled=true;window.addEventListener('message',e=>{if(e.origin===window.location.origin&&e.data&&e.data.source==='cheche-snowboard')window.__checheSnowboardMessage=e.data})})()", true)

static func _is_local_host() -> bool:
	if not OS.has_feature("web"):
		return false
	return JavaScriptBridge.eval(_is_local_host_js(), true) == true

static func _is_local_host_js() -> String:
	return "['localhost','127.0.0.1','[::1]'].includes(window.location.hostname)"

static func prefers_reduced_motion() -> bool:
	if not OS.has_feature("web"):
		return false
	var result: Variant = JavaScriptBridge.eval(
		"window.matchMedia('(prefers-reduced-motion: reduce)').matches", true
	)
	return result == true

static func uses_coarse_pointer() -> bool:
	if not OS.has_feature("web"):
		return DisplayServer.is_touchscreen_available()
	var result: Variant = JavaScriptBridge.eval(
		"window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 700", true
	)
	return result == true
