# 角色 Logo — 共用 prompt 區塊

各 `docs/logo-prompts/{slug}.md` 的英文 fence **已內嵌**下列區塊，可整份複製 fence 給 image model。  
改恆定層：先改本檔對應 `BLOCK`，再重產角色檔。契約測試會檢查 35 份都含這些原文。

角色獨有句（姓名、特徵、IP 色、撞型）只寫在各 slug 檔，不寫在這裡。

<!-- BLOCK:lead -->
Create one highly simplified IP mascot logo, not a character illustration.
<!-- /BLOCK:lead -->

<!-- BLOCK:complexity -->
Complexity: 6–10 basic shapes, at most two internal color regions, exactly two eyes and one mouth, readable at 32×32. One continuous rounded outer silhouette.
<!-- /BLOCK:complexity -->

<!-- BLOCK:eyes -->
Eyes: two identical solid dark circles near #1A1410, no highlights, no iris, no white outline. Inter-eye distance divided by eye radius is exactly 3.0 for every character. Place both eyes on the face surface named in the Color section, slightly above the canvas horizontal midline; never infer the surface by picking the lighter of the two IP colors. Mouth is one rounded mark using an existing IP color, not a third color. No eyebrows, nostrils, blush, screws, digits, or letters.
<!-- /BLOCK:eyes -->

<!-- BLOCK:composition-vehicle -->
Composition: front three-quarter-low view; the vehicle's front IS the face — the grille is the mouth. Headlights are never the eyes and are never a separate color region: draw them as blunt rounded shapes in the body color, or omit them. The eyes follow the eye rule and sit on the specified face surface. Unless wheels are this character's defining feature, draw two blunt rounded wheels in the body color tucked under the body so they shape the lower contour; they are structural, not a defining feature, and add no color region. Upright, horizontally centered, filling 75–85% of canvas height with 15–25% headroom. The lowest body pixels meet the bottom canvas edge directly: no gap, no ground plane, no contact shadow, no cast shadow between the subject and that edge. Canvas is not rotated or tilted. Both members of every paired feature fully visible and uncropped.
<!-- /BLOCK:composition-vehicle -->

<!-- BLOCK:composition-non-vehicle -->
Composition: upright, horizontally centered, filling 75–85% of canvas height with 15–25% headroom. The lowest body pixels meet the bottom canvas edge directly: no gap, no ground plane, no contact shadow, no cast shadow between the subject and that edge. Canvas is not rotated or tilted. Silhouette may differ from the vehicle cast, but eye style, canvas rules, and the three-color system stay identical. Both members of every paired feature fully visible and uncropped.
<!-- /BLOCK:composition-non-vehicle -->

<!-- BLOCK:style -->
Style: flat-first geometry with continuous-gradient micro-volume. One uninterrupted low-frequency diffuse gradient per large color region, sharing an upper-left to lower-right light direction. Each transition spans at least 50% of the dominant form. Local highlight area is greater than 20% of the main form; no small glossy hotspots. Total OKLCH lightness variation <= 0.08, highlight +0.025 to +0.04, shadow -0.03 to -0.05, hue drift <= 3 degrees, chroma drift <= 0.015. Micro-volume is visible at full size and nearly invisible at 32×32.
<!-- /BLOCK:style -->

<!-- BLOCK:forbid -->
Forbid: discrete highlight patches, closed highlight blobs, overlay bands, cel-shading steps, stepped tonal swatches, hard internal shadow edges, small glossy hotspots, independent lighting on facial marks, illustration detail, repeated anatomy, thin lines, sharp points, extra colors, pure flatness, strong 3D, clay, plasticine, claymation, plastic, plush, toy rendering, texture, gloss, bevel, extrusion, rim light, drop shadow, text, numbers, border, transparency, app icon mask, rounded canvas corners.
<!-- /BLOCK:forbid -->

<!-- BLOCK:output -->
Output: 1:1 square, 1536×1536, square corners, fully opaque. Keep the native size if the service caps at 1254×1254; do not resample to pad the pixel count.
<!-- /BLOCK:output -->
