# 沃特 · `watt`

家族：people · 車種：小機器人 · 特徵：天線圓球 · Tier 1

把下面英文 fence **整段**貼給 image model。改恆定層請先改 [`_shared.md`](./_shared.md)。

```
Create one highly simplified IP mascot logo, not a character illustration.

Background: fully opaque edge-to-edge solid OKLCH(L 0.52 C 0.10 H 320) / #8A5C82 (people family, 人與夥伴). Use this color for the background only. Background stays visually flat: no vignette, spotlight, or directional wash.

Subject: 沃特 the 小機器人, reduced to one continuous rounded silhouette with exactly one defining feature: 天線圓球.
Antenna sphere on a short thick stalk. The sphere must be obviously round — never a needle or thin spike. Pale teal panel is the secondary region.

Complexity: 6–10 basic shapes, at most two internal color regions, exactly two eyes and one mouth, readable at 32×32. One continuous rounded outer silhouette.

Color: exactly three semantic colors total — two IP base colors (#F0D8B8 primary, #B8E4DE secondary) plus the background. Keep the secondary color as one large continuous region. Silhouette-to-background contrast uses the hue-weighted gate (2.8 / 3.6 / 4.5) with margin >= 0.2; facial marks on the lighter IP region >= 5:1.

Composition: upright, horizontally centered, cropped flush at the bottom edge, filling 75–85% of canvas height with 15–25% headroom. Canvas is not rotated or tilted. Silhouette may differ from the vehicle cast, but eye style, canvas rules, and the three-color system stay identical. Both members of every paired feature fully visible and uncropped.

Eyes: two identical solid dark circles near #1A1410, no highlights, no iris, no white outline. Inter-eye distance divided by eye radius is exactly 3.0 for every character. Place both eyes on the lighter of the two IP colors, slightly above the canvas horizontal midline. Mouth is one rounded mark using an existing IP color, not a third color. No eyebrows, nostrils, blush, screws, digits, or letters.

Style: flat-first geometry with continuous-gradient micro-volume. One uninterrupted low-frequency diffuse gradient per large color region, sharing an upper-left to lower-right light direction. Each transition spans at least 50% of the dominant form. Local highlight area is greater than 20% of the main form; no small glossy hotspots. Total OKLCH lightness variation <= 0.08, highlight +0.025 to +0.04, shadow -0.03 to -0.05, hue drift <= 3 degrees, chroma drift <= 0.015. Micro-volume is visible at full size and nearly invisible at 32×32.

Forbid: discrete highlight patches, closed highlight blobs, overlay bands, cel-shading steps, stepped tonal swatches, hard internal shadow edges, small glossy hotspots, independent lighting on facial marks, illustration detail, repeated anatomy, thin lines, sharp points, extra colors, pure flatness, strong 3D, clay, plasticine, claymation, plastic, plush, toy rendering, texture, gloss, bevel, extrusion, rim light, drop shadow, text, numbers, border, transparency, app icon mask, rounded canvas corners.

Output: 1:1 square, 1536×1536, square corners, fully opaque. Keep the native size if the service caps at 1254×1254; do not resample to pad the pixel count.
Asset paths: public/characters/logo/watt-512.webp, watt-128.webp, watt-32.webp.
```
