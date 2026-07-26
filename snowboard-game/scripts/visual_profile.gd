class_name SnowVisualProfile
extends RefCounted

enum Tier { DESKTOP, MOBILE, REDUCED_MOTION }

var tier := Tier.DESKTOP
var mobile := false
var reduced_motion := false
var touch_layout := false
var shadows_enabled := true
var ssao_enabled := true
var particle_scale := 1.0
var scenery_density := 1.0
var camera_motion := true

static func create(prefers_reduced_motion: bool, coarse_pointer: bool) -> SnowVisualProfile:
	var profile := SnowVisualProfile.new()
	profile.mobile = coarse_pointer
	profile.reduced_motion = prefers_reduced_motion
	profile.touch_layout = coarse_pointer
	profile.tier = Tier.REDUCED_MOTION if prefers_reduced_motion else (Tier.MOBILE if coarse_pointer else Tier.DESKTOP)
	profile.shadows_enabled = not coarse_pointer
	# Godot 4.3 GL Compatibility does not execute Environment SSAO reliably.
	# Contact depth comes from the directional/blob shadows instead.
	profile.ssao_enabled = false
	profile.particle_scale = 0.32 if prefers_reduced_motion else (0.42 if coarse_pointer else 1.0)
	profile.scenery_density = 0.72 if coarse_pointer else 1.0
	profile.camera_motion = not prefers_reduced_motion
	return profile
