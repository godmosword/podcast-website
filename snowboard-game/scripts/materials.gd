class_name SnowMaterials
extends RefCounted

## 阿蹦雪山黏土材質庫（Clay material catalog）。
## 全部走 StandardMaterial3D、低 metallic，近看靠 roughness／normal／微貼圖分層。

static var _cache: Dictionary = {}

## 契約用：TS／smoke 會斷言這些 factory 存在。
const CATALOG := [
	"clay",
	"snow",
	"grooming",
	"blob_shadow",
	"translucent",
	"backdrop",
	"skin",
	"fabric",
	"wood",
	"foliage",
	"board_plastic",
	"ice",
	"board_decal",
]

const TEX_CLAY_MICRO := "res://assets/clay-micro.svg"
const TEX_FABRIC_KNIT := "res://assets/fabric-knit.svg"
const TEX_BOARD_STRIPE := "res://assets/board-stripe.svg"
const TEX_SNOW_DETAIL := "res://assets/snow-detail.svg"
const TEX_BLOB_SHADOW := "res://assets/blob-shadow.svg"

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

static func translucent(color: Color, billboard := false) -> StandardMaterial3D:
	var key := "alpha:%s:%s" % [color.to_html(), str(billboard)]
	if _cache.has(key):
		return _cache[key]
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 1.0
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED if billboard else BaseMaterial3D.BILLBOARD_DISABLED
	_cache[key] = material
	return material

static func backdrop(color: Color) -> StandardMaterial3D:
	var key := "backdrop:%s" % color.to_html()
	if _cache.has(key):
		return _cache[key]
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 1.0
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_cache[key] = material
	return material

static func snow() -> StandardMaterial3D:
	if _cache.has("snow"):
		return _cache["snow"]
	var material := StandardMaterial3D.new()
	material.albedo_color = Color8(202, 225, 234)
	material.roughness = 0.82
	material.metallic = 0.0
	material.vertex_color_use_as_albedo = true
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	material.normal_enabled = true
	material.normal_texture = load(TEX_SNOW_DETAIL)
	material.normal_scale = 0.34
	material.uv1_scale = Vector3(6.0, 6.0, 6.0)
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	_cache["snow"] = material
	return material

static func blob_shadow() -> StandardMaterial3D:
	if _cache.has("blob-shadow"):
		return _cache["blob-shadow"]
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.16, 0.31, 0.39, 0.48)
	material.albedo_texture = load(TEX_BLOB_SHADOW)
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	_cache["blob-shadow"] = material
	return material

static func grooming() -> StandardMaterial3D:
	if _cache.has("grooming"):
		return _cache["grooming"]
	var material := StandardMaterial3D.new()
	material.albedo_color = Color8(166, 200, 213)
	material.roughness = 0.96
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	_cache["grooming"] = material
	return material

## 膚色 — 微 normal 讓臉／手不太平。
static func skin(color := Color8(238, 172, 121)) -> StandardMaterial3D:
	var key := "skin:%s" % color.to_html()
	if _cache.has(key):
		return _cache[key]
	var material := clay(color, 0.78).duplicate() as StandardMaterial3D
	material.normal_enabled = true
	material.normal_texture = load(TEX_CLAY_MICRO)
	material.normal_scale = 0.22
	material.uv1_scale = Vector3(2.4, 2.4, 2.4)
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	_cache[key] = material
	return material

## 布料／外套 — 細織紋 albedo。
static func fabric(color: Color) -> StandardMaterial3D:
	var key := "fabric:%s" % color.to_html()
	if _cache.has(key):
		return _cache[key]
	var material := clay(color, 0.9).duplicate() as StandardMaterial3D
	material.albedo_texture = load(TEX_FABRIC_KNIT)
	material.uv1_scale = Vector3(3.5, 3.5, 3.5)
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	_cache[key] = material
	return material

## 樹幹／木質道具。
static func wood(color := Color8(107, 72, 53)) -> StandardMaterial3D:
	return clay(color, 0.94)

## 針葉樹冠。
static func foliage(color := Color8(28, 91, 76)) -> StandardMaterial3D:
	return clay(color, 0.95)

## 滑雪板殼 — 略亮、仍無 metallic。
static func board_plastic(color := Color8(226, 67, 70)) -> StandardMaterial3D:
	var key := "board:%s" % color.to_html()
	if _cache.has(key):
		return _cache[key]
	var material := clay(color, 0.62).duplicate() as StandardMaterial3D
	material.normal_enabled = true
	material.normal_texture = load(TEX_CLAY_MICRO)
	material.normal_scale = 0.18
	material.uv1_scale = Vector3(1.6, 4.0, 1.0)
	_cache[key] = material
	return material

## 板面奶油條紋貼花。
static func board_decal() -> StandardMaterial3D:
	if _cache.has("board-decal"):
		return _cache["board-decal"]
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(1, 1, 1, 1)
	material.albedo_texture = load(TEX_BOARD_STRIPE)
	material.roughness = 0.55
	material.metallic = 0.0
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	_cache["board-decal"] = material
	return material

## 硬雪／冰緣 — 比雪場略滑。
static func ice(color := Color8(188, 220, 232)) -> StandardMaterial3D:
	return clay(color, 0.55)
