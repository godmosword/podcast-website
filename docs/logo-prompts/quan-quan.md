# 圈圈 · `quan-quan`

家族：rescue · 車種：消防車 · 特徵：雲梯 · Tier 2

把下面英文 fence **整段**貼給 image model。改恆定層請先改 [`_shared.md`](./_shared.md)。

```
Create one highly simplified IP mascot logo, not a character illustration.

Background: fully opaque edge-to-edge solid OKLCH(L 0.28 C 0.06 H 250) / #1B2A44 (rescue family, 緊急救援). Use this color for the background only. Background stays visually flat: no vignette, spotlight, or directional wash.

Subject: 圈圈 the 消防車, reduced to one continuous rounded silhouette with exactly one defining feature: 雲梯. Front three-quarter-low view; the vehicle's front IS the face — grille as mouth, headlights as eyes.
Share the fire-engine silhouette with Diandian. Only feature: a blunt ladder whose top edge is a diagonal line. Quanquan is slightly larger. No water cannon.

Complexity: 6–10 basic shapes, at most two internal color regions, exactly two eyes and one mouth, readable at 32×32. One continuous rounded outer silhouette.

Color: exactly three semantic colors total — two IP base colors (#F45242 primary, #55CAF0 secondary) plus the background. Keep the secondary color as one large continuous region. Eyes sit on the primary IP color. Silhouette-to-background contrast uses the hue-weighted gate (2.8 / 3.6 / 4.5) with margin >= 0.2. If the secondary region forms the outer contour, secondary-to-background >= 3.6 with margin >= 0.2; otherwise secondary-to-primary >= 1.8 with margin >= 0.2. Secondary must also be distinguishable from primary at 32px: contrast >= 1.6 or hue distance >= 30. Facial marks on the faceSurface region >= 5:1 with margin >= 0.2.

Composition: front three-quarter-low view; the vehicle's front IS the face — grille as mouth, headlights as eyes. Upright, horizontally centered, cropped flush at the bottom edge, filling 75–85% of canvas height with 15–25% headroom. Canvas is not rotated or tilted. Both members of every paired feature fully visible and uncropped.

Eyes: two identical solid dark circles near #1A1410, no highlights, no iris, no white outline. Inter-eye distance divided by eye radius is exactly 3.0 for every character. Place both eyes on the lighter of the two IP colors, slightly above the canvas horizontal midline. Mouth is one rounded mark using an existing IP color, not a third color. No eyebrows, nostrils, blush, screws, digits, or letters.

Style: flat-first geometry with continuous-gradient micro-volume. One uninterrupted low-frequency diffuse gradient per large color region, sharing an upper-left to lower-right light direction. Each transition spans at least 50% of the dominant form. Local highlight area is greater than 20% of the main form; no small glossy hotspots. Total OKLCH lightness variation <= 0.08, highlight +0.025 to +0.04, shadow -0.03 to -0.05, hue drift <= 3 degrees, chroma drift <= 0.015. Micro-volume is visible at full size and nearly invisible at 32×32.

Forbid: discrete highlight patches, closed highlight blobs, overlay bands, cel-shading steps, stepped tonal swatches, hard internal shadow edges, small glossy hotspots, independent lighting on facial marks, illustration detail, repeated anatomy, thin lines, sharp points, extra colors, pure flatness, strong 3D, clay, plasticine, claymation, plastic, plush, toy rendering, texture, gloss, bevel, extrusion, rim light, drop shadow, text, numbers, border, transparency, app icon mask, rounded canvas corners.

Output: 1:1 square, 1536×1536, square corners, fully opaque. Keep the native size if the service caps at 1254×1254; do not resample to pad the pixel count.
Asset paths: public/characters/logo/quan-quan-512.webp, quan-quan-128.webp, quan-quan-32.webp.
```
