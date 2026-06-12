class_name Bridge
## 與父頁（Next.js CandyKartIframeHost）的 postMessage 橋接。
## 協定見 lib/gamekit/iframe-bridge.ts：source 固定 "cheche-candy-kart"。

const SOURCE := "cheche-candy-kart"

static func _post(payload: Dictionary) -> void:
	if not OS.has_feature("web"):
		print("[bridge] ", JSON.stringify(payload))
		return
	var json := JSON.stringify(payload)
	JavaScriptBridge.eval(
		"window.parent.postMessage(%s, window.location.origin);" % json, true
	)

static func send_ready() -> void:
	_post({"source": SOURCE, "type": "ready"})

static func send_race_finish(
	track_id: String,
	player_pos: int,
	total_ms: int,
	best_lap_ms: int,
	stars_collected: int,
	stars_total: int,
) -> void:
	_post({
		"source": SOURCE,
		"type": "race-finish",
		"trackId": track_id,
		"playerPos": player_pos,
		"totalMs": total_ms,
		"bestLapMs": best_lap_ms,
		"starsCollected": stars_collected,
		"starsTotal": stars_total,
	})

## e2e 測試鉤子：?debugFinish=<trackId> 啟動後直接送結算訊息。
static func debug_finish_track_id() -> String:
	if not OS.has_feature("web"):
		return ""
	var search: Variant = JavaScriptBridge.eval("window.location.search", true)
	if typeof(search) != TYPE_STRING:
		return ""
	var s := String(search)
	var key := "debugFinish="
	var idx := s.find(key)
	if idx < 0:
		return ""
	var rest := s.substr(idx + key.length())
	var amp := rest.find("&")
	return rest.substr(0, amp) if amp >= 0 else rest
