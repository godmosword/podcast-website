class_name KartMaterials
extends RefCounted

## 繽紛卡丁車黏土材質庫（對齊 snowboard SnowMaterials 語意）。
## 無外部貼圖，維持小 PCK；以 roughness／具名色票分層。

static var _cache: Dictionary = {}

const CATALOG := [
	"clay",
	"solid",
	"road",
	"skin",
	"fabric",
	"wood",
	"foliage",
	"kart_shell",
	"rubber",
	"candy",
]

static func clay(color: Color, roughness := 0.86, emission := 0.0) -> StandardMaterial3D:
	var key := "clay:%s:%.2f:%.2f" % [color.to_html(), roughness, emission]
	if _cache.has(key):
		return _cache[key]
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	material.metallic = 0.0
	if emission > 0.0:
		material.emission_enabled = true
		material.emission = color
		material.emission_energy_multiplier = emission
	_cache[key] = material
	return material

## 相容 TrackBuilder.solid_material(color, emissive)
static func solid(color: Color, emissive := 0.0) -> StandardMaterial3D:
	return clay(color, 0.8, emissive)

## 路面／起跑線／加速帶（vertex color）
static func road() -> StandardMaterial3D:
	if _cache.has("road"):
		return _cache["road"]
	var material := StandardMaterial3D.new()
	material.vertex_color_use_as_albedo = true
	material.roughness = 0.85
	material.metallic = 0.0
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	_cache["road"] = material
	return material

static func skin(color := Color(1.0, 0.92, 0.84)) -> StandardMaterial3D:
	return clay(color, 0.78)

static func fabric(color: Color) -> StandardMaterial3D:
	return clay(color, 0.9)

static func wood(color := Color8(122, 82, 48)) -> StandardMaterial3D:
	return clay(color, 0.94)

static func foliage(color := Color8(157, 231, 184)) -> StandardMaterial3D:
	return clay(color, 0.95)

## 車殼馬卡龍塑膠
static func kart_shell(color: Color) -> StandardMaterial3D:
	return clay(color, 0.62)

static func rubber(color := Color(0.32, 0.26, 0.34)) -> StandardMaterial3D:
	return clay(color, 0.96)

## 糖珠／糖果道具（可微 emissive）
static func candy(color: Color, glow := 0.0) -> StandardMaterial3D:
	return clay(color, 0.72, glow)
