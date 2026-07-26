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
	_post({"source": SOURCE, "type": "ready"})

static func send_finish(total_ms: int, falls: int, collected: int, total: int) -> void:
	_post({
		"source": SOURCE,
		"type": "run-finish",
		"courseId": Course.ID,
		"totalMs": total_ms,
		"falls": falls,
		"snowflakesCollected": collected,
		"snowflakesTotal": total,
	})

static func send_debug_finish_if_requested() -> void:
	if not OS.has_feature("web"):
		return
	var payload := {
		"source": SOURCE,
		"type": "run-finish",
		"courseId": Course.ID,
		"totalMs": 90_000,
		"falls": 0,
		"snowflakesCollected": Course.SNOWFLAKE_TOTAL,
		"snowflakesTotal": Course.SNOWFLAKE_TOTAL,
	}
	JavaScriptBridge.eval(
		"(()=>{if(new URLSearchParams(window.location.search).get('debugFinish')==='%s')window.parent.postMessage(%s,window.location.origin)})()" % [Course.ID, JSON.stringify(payload)],
		true,
	)

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
