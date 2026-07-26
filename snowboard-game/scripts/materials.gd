class_name SnowMaterials
extends RefCounted

static var _cache: Dictionary = {}

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
	material.normal_texture = load("res://assets/snow-detail.svg")
	material.normal_scale = 0.34
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	_cache["snow"] = material
	return material

static func blob_shadow() -> StandardMaterial3D:
	if _cache.has("blob-shadow"):
		return _cache["blob-shadow"]
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.16, 0.31, 0.39, 0.48)
	material.albedo_texture = load("res://assets/blob-shadow.svg")
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
