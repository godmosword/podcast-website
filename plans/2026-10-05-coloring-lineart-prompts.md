# 簡易著色線稿製作紀錄

2026-10-05。使用內建 image_gen，以既有角色圖作為 reference image。輸出經既有 postprocessAiLineArt 正規化為 1024×1024 不透明黑白 PNG，通過 character 線稿品質 gate。

## 文字例外（2026-10-12）

線稿固定規則是「圖內不得有文字、字母或數字」。唯一例外是小紅賽車車身的數字「2」（定裝照 `public/characters/小紅賽車.jpg` 的白圓底號碼）。角色在畫面中時只畫這一個描線「2」，不得再加別的文字或數字。沒有小紅賽車的線稿仍然完全沒有文字與數字。

現行模板在 `scripts/lib/coloring-ai-prompts.ts`。下面小紅賽車那則歷史 prompt 寫了 number 2，符合這個例外，不是跟禁字規則打架。

## 恐龍車多多

資產：`public/coloring/char-恐龍車多多-simple/line.png`

參考：`public/characters/恐龍車多多.jpg`

```text
Create one square simple preschool coloring book page for 恐龍車多多. The attached image is character reference only. Match recognizable character silhouette, expression and car features: Friendly dinosaur car with big muzzle, open smile teeth, dorsal triangular plates and visible complete wheels. One big toothbrush beside it. Large uncluttered closed coloring regions, thick smooth pure black outlines (about 8px at 1024px), pure white opaque background and white interiors. Keep entire character including all visible wheels inside generous 8% margins. No crop, no gradients, no shading, no gray, no hatching, no dense background, no candies. Exactly two simple clouds above. Only black pupils may be solid. Keep teeth broad, at most six upper and six lower teeth. Preserve character identity. Every paintable shape fully closed. Output 1024 square PNG.
```

## 小紅賽車

資產：`public/coloring/char-小紅賽車-simple/line.png`

參考：`public/characters/小紅賽車.jpg`

```text
Create one square simple preschool coloring book page for 小紅賽車. The attached image is character reference only. Match recognizable character silhouette, expression and car features: Friendly rounded racing car with number 2 outlined on hood and side, big eyes on windshield, stripes, spoiler and complete wheels. Large uncluttered closed coloring regions, thick smooth pure black outlines (about 8px at 1024px), pure white opaque background and white interiors. Keep entire character including all visible wheels inside generous 8% margins. No crop, no gradients, no shading, no gray, no hatching, no dense background, no candies. Exactly two simple clouds above. Only black pupils may be solid. Keep teeth broad, at most six upper and six lower teeth. Preserve character identity. Every paintable shape fully closed. Output 1024 square PNG.
```
