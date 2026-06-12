class_name TrackData
## 6 條馬卡龍主題賽道的純資料定義（與站內 lib/games/candy-kart/tracks.ts 對齊）。
## 賽道為封閉 Curve3D 迴圈；卡丁車以 progress（沿線距離）＋ lateral（橫向偏移）運動。

const ROAD_HALF := 9.0
const BARRIER_LAT := 12.0

const TRACKS := [
	{
		"id": "macaron-meadow",
		"name": "馬卡龍草原",
		"laps": 3,
		"par_ms": 225000,
		"scale": 1.05,
		"points": [
			Vector2(0, 0), Vector2(180, -50), Vector2(380, -40), Vector2(500, 60),
			Vector2(520, 200), Vector2(430, 330), Vector2(240, 370), Vector2(60, 340),
			Vector2(-60, 220), Vector2(-50, 80),
		],
		"road": Color8(255, 236, 218), "edge": Color8(255, 255, 255),
		"ground": Color8(185, 243, 219), "sky_top": Color8(189, 231, 255),
		"sky_horizon": Color8(255, 228, 240),
		"barriers": [Color8(255, 180, 207), Color8(255, 255, 255)],
		"prop": "lollipop",
		"prop_colors": [Color8(255, 159, 183), Color8(255, 232, 137), Color8(157, 231, 184)],
		"boosts": [0.2, 0.55, 0.85],
		"stars": [
			[0.08, -4.0], [0.22, 3.5], [0.36, 0.0], [0.5, -3.5],
			[0.64, 4.0], [0.78, -2.0], [0.92, 2.5],
		],
	},
	{
		"id": "candy-beach",
		"name": "糖果海灘",
		"laps": 3,
		"par_ms": 235000,
		"scale": 0.95,
		"points": [
			Vector2(0, 0), Vector2(160, -70), Vector2(330, -60), Vector2(430, 30),
			Vector2(420, 150), Vector2(300, 200), Vector2(250, 290), Vector2(330, 370),
			Vector2(450, 420), Vector2(450, 530), Vector2(330, 590), Vector2(160, 560),
			Vector2(30, 470), Vector2(-50, 330), Vector2(-60, 150),
		],
		"road": Color8(255, 226, 196), "edge": Color8(255, 250, 240),
		"ground": Color8(255, 232, 178), "sky_top": Color8(141, 223, 240),
		"sky_horizon": Color8(255, 244, 214),
		"barriers": [Color8(141, 223, 240), Color8(255, 255, 255)],
		"prop": "icecream",
		"prop_colors": [Color8(255, 196, 168), Color8(189, 231, 255), Color8(255, 232, 137)],
		"boosts": [0.15, 0.48, 0.8],
		"stars": [
			[0.1, 3.0], [0.24, -3.5], [0.4, 2.0], [0.52, -4.0],
			[0.66, 0.0], [0.8, 3.5], [0.93, -2.5],
		],
	},
	{
		"id": "jelly-forest",
		"name": "果凍森林",
		"laps": 3,
		"par_ms": 245000,
		"scale": 1.0,
		"points": [
			Vector2(0, 0), Vector2(120, -60), Vector2(240, -20), Vector2(330, -90),
			Vector2(450, -60), Vector2(520, 40), Vector2(470, 140), Vector2(540, 240),
			Vector2(470, 340), Vector2(330, 360), Vector2(240, 300), Vector2(140, 360),
			Vector2(20, 330), Vector2(-70, 220), Vector2(-40, 100),
		],
		"road": Color8(243, 230, 255), "edge": Color8(255, 255, 255),
		"ground": Color8(157, 231, 184), "sky_top": Color8(201, 180, 255),
		"sky_horizon": Color8(220, 255, 235),
		"barriers": [Color8(201, 180, 255), Color8(157, 231, 184)],
		"prop": "jelly",
		"prop_colors": [Color8(255, 159, 183), Color8(201, 180, 255), Color8(157, 231, 184)],
		"boosts": [0.3, 0.62, 0.9],
		"stars": [
			[0.07, 0.0], [0.2, 3.5], [0.34, -3.0], [0.49, 4.0],
			[0.63, -4.0], [0.77, 2.0], [0.9, -2.0],
		],
	},
	{
		"id": "icecream-peak",
		"name": "冰淇淋雪山",
		"laps": 3,
		"par_ms": 255000,
		"scale": 1.0,
		"points": [
			Vector2(0, 0), Vector2(200, -40), Vector2(400, -30), Vector2(480, 60),
			Vector2(400, 140), Vector2(200, 130), Vector2(100, 200), Vector2(200, 280),
			Vector2(400, 270), Vector2(480, 360), Vector2(400, 450), Vector2(180, 460),
			Vector2(-20, 430), Vector2(-90, 300), Vector2(-70, 140),
		],
		"road": Color8(228, 240, 255), "edge": Color8(255, 255, 255),
		"ground": Color8(248, 252, 255), "sky_top": Color8(189, 231, 255),
		"sky_horizon": Color8(255, 240, 248),
		"barriers": [Color8(141, 223, 240), Color8(255, 180, 207)],
		"prop": "icecream",
		"prop_colors": [Color8(255, 255, 255), Color8(255, 180, 207), Color8(141, 223, 240)],
		"boosts": [0.25, 0.58, 0.88],
		"stars": [
			[0.09, -3.0], [0.23, 3.0], [0.38, -4.0], [0.5, 2.5],
			[0.65, -2.5], [0.79, 4.0], [0.92, 0.0],
		],
	},
	{
		"id": "choco-volcano",
		"name": "巧克力火山",
		"laps": 3,
		"par_ms": 265000,
		"scale": 1.0,
		"points": [
			Vector2(0, 0), Vector2(140, -50), Vector2(260, -10), Vector2(380, -60),
			Vector2(480, 20), Vector2(440, 120), Vector2(320, 150), Vector2(360, 250),
			Vector2(480, 290), Vector2(440, 400), Vector2(300, 430), Vector2(160, 380),
			Vector2(60, 430), Vector2(-60, 360), Vector2(-90, 200), Vector2(-50, 80),
		],
		"road": Color8(255, 224, 200), "edge": Color8(255, 244, 230),
		"ground": Color8(150, 102, 64), "sky_top": Color8(255, 196, 168),
		"sky_horizon": Color8(255, 232, 137),
		"barriers": [Color8(122, 82, 48), Color8(255, 244, 230)],
		"prop": "choco",
		"prop_colors": [Color8(122, 82, 48), Color8(255, 196, 168), Color8(255, 232, 137)],
		"boosts": [0.18, 0.5, 0.78],
		"stars": [
			[0.06, 2.0], [0.21, -3.5], [0.35, 3.5], [0.48, 0.0],
			[0.62, -4.0], [0.78, 3.0], [0.91, -2.5],
		],
	},
	{
		"id": "rainbow-skyway",
		"name": "彩虹天空道",
		"laps": 3,
		"par_ms": 275000,
		"scale": 1.0,
		"points": [
			Vector2(0, 0), Vector2(260, -80), Vector2(520, -60), Vector2(680, 80),
			Vector2(700, 280), Vector2(560, 420), Vector2(380, 400), Vector2(300, 330),
			Vector2(220, 400), Vector2(60, 430), Vector2(-120, 330), Vector2(-160, 140),
		],
		"road": Color8(255, 250, 242), "edge": Color8(255, 232, 137),
		"ground": Color8(236, 247, 255), "sky_top": Color8(125, 196, 255),
		"sky_horizon": Color8(255, 212, 235),
		"barriers": [
			Color8(255, 159, 183), Color8(255, 232, 137), Color8(157, 231, 184),
			Color8(141, 223, 240), Color8(201, 180, 255),
		],
		"prop": "cloud",
		"prop_colors": [Color8(255, 255, 255), Color8(236, 247, 255), Color8(255, 228, 240)],
		"boosts": [0.12, 0.4, 0.68, 0.92],
		"stars": [
			[0.1, 0.0], [0.25, -3.5], [0.4, 3.5], [0.55, -2.0],
			[0.68, 2.0], [0.82, -4.0], [0.95, 4.0],
		],
	},
]

static func track_count() -> int:
	return TRACKS.size()

static func get_track(index: int) -> Dictionary:
	return TRACKS[clampi(index, 0, TRACKS.size() - 1)]

static func index_of(id: String) -> int:
	for i in TRACKS.size():
		if TRACKS[i]["id"] == id:
			return i
	return -1

## 由 2D 控制點建出平滑封閉 Curve3D（Catmull-Rom 風格切線）。
static func build_curve(track: Dictionary) -> Curve3D:
	var pts: Array = track["points"]
	var s: float = track["scale"]
	var curve := Curve3D.new()
	curve.bake_interval = 2.0
	var n := pts.size()
	for i in n:
		var prev: Vector2 = pts[(i - 1 + n) % n] * s
		var cur: Vector2 = pts[i] * s
		var next: Vector2 = pts[(i + 1) % n] * s
		var tangent := (next - prev) * 0.18
		curve.add_point(
			Vector3(cur.x, 0.0, cur.y),
			Vector3(-tangent.x, 0.0, -tangent.y),
			Vector3(tangent.x, 0.0, tangent.y),
		)
	# 封閉迴圈：補回起點
	var p0: Vector2 = pts[0] * s
	var prev0: Vector2 = pts[n - 1] * s
	var next0: Vector2 = pts[1] * s
	var t0 := (next0 - prev0) * 0.18
	curve.add_point(
		Vector3(p0.x, 0.0, p0.y),
		Vector3(-t0.x, 0.0, -t0.y),
		Vector3(t0.x, 0.0, t0.y),
	)
	return curve
