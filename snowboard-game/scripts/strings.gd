class_name SnowboardStrings

const ZH_HANT := {
	"title": "阿蹦雪山衝刺",
	"start": "開始滑雪",
	"pause": "暫停中",
	"resume": "繼續滑",
	"restart": "重新開始",
	"quit": "回主選單",
	"finish": "抵達 %s！",
	"finish_line": "衝線！",
	"time": "時間",
	"snowflakes": "雪花",
	"score": "分數",
	"combo": "Combo",
	"speed": "KM/H",
}

static func t(key: String, fallback := "") -> String:
	return str(ZH_HANT.get(key, fallback if not fallback.is_empty() else key))

