#!/usr/bin/env python3
"""電腦版「聽聽看繪本」21:9 主圖。

以 Kaiyi 的直式黏土原圖（segment-picture-books-portrait.jpg）為中心，
左右只延伸同一張圖裡的天空紋理、雲、草地與遠景工地。
不重繪水泥車與彩色高塔，不加台北 101、不加任何文字或數字。

PR #330 的 1536×864 是把直式圖擺進橫式畫布、兩側鋪平塗藍。
這支腳本改掉那兩塊色塊，並把畫布拉到約 21:9。

用法：
  python3 assets/landing/segment-picture-books/compose-wide-hero.py
  python3 assets/landing/segment-picture-books/compose-wide-hero.py --debug-dir /tmp/hero-debug
"""

from __future__ import annotations

import argparse
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
PORTRAIT = ROOT / "public/landing/segment-picture-books-portrait.jpg"
OUTPUT = ROOT / "public/landing/segment-picture-books.jpg"

# 2560×1097 = 21:9（2560 / (21/9) = 1097.14）。
CANVAS_W = 2560
CANVAS_H = 1097
# 直式原圖 1:1 放進畫布高度，不放大。裁切保留高塔頂、水泥車與一段草地。
CROP_Y = 220
PLATE_X = (CANVAS_W - 1024) // 2  # 768
FEATHER = 36
SEED = 330

# 遠景道具（原圖像素）。只取吊車與小吊車，不取水泥車、不取彩色高塔。
LEFT_CRANE_BOX = (104, 448, 400, 690)
CLOUD_BOXES = (
    (214, 376, 372, 456),
    (494, 448, 644, 532),
    (824, 428, 932, 498),
)

# 電腦版區段高 = 100svh - --nav-h（≥980px 為 66px）。用來確認主體沒被 cover 裁掉。
VIEWPORTS = (
    ("1280x720", 1280, 720 - 66),
    ("1440x900", 1440, 900 - 66),
    ("1920x1080", 1920, 1080 - 66),
    ("2560x1440", 2560, 1440 - 66),
    ("2560x1080", 2560, 1080 - 66),
)


def is_sky(rgb: np.ndarray) -> np.ndarray:
    r = rgb[..., 0].astype(np.int16)
    g = rgb[..., 1].astype(np.int16)
    b = rgb[..., 2].astype(np.int16)
    return (b > 165) & (r < 80) & ((b - r) > 70) & ((b - g) > 8)


def is_grass(rgb: np.ndarray) -> np.ndarray:
    r = rgb[..., 0].astype(np.int16)
    g = rgb[..., 1].astype(np.int16)
    b = rgb[..., 2].astype(np.int16)
    return (g > 90) & (b < 120) & ((g - b) > 28) & ((g - r) > 4) & (r < 210)


def margin_runs(plate: np.ndarray) -> list[tuple[int, int]]:
    """左右緣整條都是天空接到草地的直欄，用來往外延，筆觸才跟原圖同一方向。"""
    r = plate[..., 0].astype(np.int16)
    g = plate[..., 1].astype(np.int16)
    b = plate[..., 2].astype(np.int16)
    sky = (b > 165) & (r < 80) & ((b - r) > 70) & ((b - g) > 8)
    frac = sky[:900].mean(axis=0)
    cols = np.nonzero(frac > 0.92)[0]
    if len(cols) == 0:
        raise SystemExit("原圖左右緣沒有可延伸的天空")
    runs: list[tuple[int, int]] = []
    start = prev = int(cols[0])
    for col in cols[1:]:
        col = int(col)
        if col != prev + 1:
            if prev + 1 - start >= 24:
                runs.append((start, prev + 1))
            start = col
        prev = col
    if prev + 1 - start >= 24:
        runs.append((start, prev + 1))
    return runs


def stitch_columns(plate: np.ndarray, width: int, rng: random.Random) -> np.ndarray:
    """用原圖邊緣的直欄拼出側邊。重疊交叉淡化，避免平塗色塊。"""
    runs = margin_runs(plate)
    overlap = 36
    pieces: list[np.ndarray] = []
    total = 0
    guard = 0
    while total < width + overlap and guard < 80:
        guard += 1
        a, b = runs[rng.randrange(len(runs))]
        take = min(b - a, rng.randint(48, min(110, b - a)))
        sx = rng.randint(a, b - take)
        chunk = plate[:, sx : sx + take].astype(np.float32)
        if rng.random() < 0.5:
            chunk = chunk[:, ::-1].copy()
        pieces.append(chunk)
        total += take - overlap
    out = pieces[0]
    for chunk in pieces[1:]:
        ov = min(overlap, out.shape[1], chunk.shape[1])
        ramp = np.linspace(1.0, 0.0, ov, dtype=np.float32)[None, :, None]
        blended = out[:, -ov:] * ramp + chunk[:, :ov] * (1.0 - ramp)
        out = np.concatenate([out[:, :-ov], blended, chunk[:, ov:]], axis=1)
    if out.shape[1] < width:
        pad = np.repeat(out[:, -1:], width - out.shape[1], axis=1)
        out = np.concatenate([out, pad], axis=1)
    return out[:, :width]


def soften_bands(strip: np.ndarray, radius: int = 18) -> np.ndarray:
    """只抹平橫向的低頻色帶，留下直向黏土紋。"""
    src = strip.astype(np.float32)
    padded = np.pad(src, ((0, 0), (radius, radius), (0, 0)), mode="reflect")
    kernel = radius * 2 + 1
    cum = np.cumsum(padded, axis=1)
    cum = np.pad(cum, ((0, 0), (1, 0), (0, 0)), mode="constant")
    low = (cum[:, kernel : kernel + src.shape[1]] - cum[:, : src.shape[1]]) / kernel
    high = src - low
    # 再模糊一次低頻，接縫的寬色帶會散掉，細紋還在。
    return np.clip(low + high, 0, 255)


def soften_horizon(strip: np.ndarray, horizon: int, radius: int = 5, band: int = 18) -> np.ndarray:
    """遠景地平線稍微化開。原圖左右緣是桌面切線，拉寬之後會變成一條硬線。"""
    y0 = max(0, horizon - band)
    y1 = min(strip.shape[0], horizon + band)
    region = strip[y0:y1].astype(np.float32)
    kernel = np.exp(-0.5 * (np.arange(-radius, radius + 1) / (radius / 2)) ** 2)
    kernel /= kernel.sum()
    padded = np.pad(region, ((radius, radius), (0, 0), (0, 0)), mode="edge")
    blurred = np.zeros_like(region)
    for index, weight in enumerate(kernel):
        blurred += padded[index : index + region.shape[0]] * weight
    out = strip.copy()
    out[y0:y1] = np.clip(blurred, 0, 255).astype(np.uint8)
    return out


def lay_varied_grass(strip: np.ndarray, portrait: np.ndarray, horizon: int, flip: bool) -> np.ndarray:
    """下緣改鋪原圖較寬的草地，避免左右緣直欄重複出扇貝紋。"""
    src = portrait[1240:1500]
    if flip:
        src = src[:, ::-1]
    band_h = strip.shape[0] - (horizon + 8)
    if band_h < 12:
        return strip
    grass = np.array(Image.fromarray(src).resize((strip.shape[1], band_h), Image.Resampling.LANCZOS))
    target = strip[horizon + 24 :].mean(axis=(0, 1))
    grass = np.clip(grass.astype(np.float32) + (target - grass.mean(axis=(0, 1))), 0, 255)
    out = strip.astype(np.float32)
    fade = 26
    for i in range(band_h):
        amount = min(1.0, i / fade)
        y = horizon + 8 + i
        out[y] = out[y] * (1.0 - amount) + grass[i] * amount
    return np.clip(out, 0, 255).astype(np.uint8)


def anchor_edge(strip: np.ndarray, plate: np.ndarray, side: str, overlap: int = 48) -> np.ndarray:
    """靠中心圖的那一側改接原圖邊緣，接縫用同一批像素。"""
    out = strip.astype(np.float32)
    ramp = np.linspace(0.0, 1.0, overlap, dtype=np.float32)[None, :, None]
    if side == "left":
        # 翻過來：最靠中心圖的一欄等於原圖左緣。
        edge = plate[:, :overlap].astype(np.float32)[:, ::-1]
        out[:, -overlap:] = out[:, -overlap:] * (1.0 - ramp) + edge * ramp
    else:
        edge = plate[:, -overlap:].astype(np.float32)[:, ::-1]
        out[:, :overlap] = out[:, :overlap] * ramp + edge * (1.0 - ramp)
    return np.clip(out, 0, 255).astype(np.uint8)


def horizon_y(plate: np.ndarray) -> int:
    column = plate[:, 8].astype(np.int16)
    for y in range(plate.shape[0]):
        r, g, b = column[y]
        if g > 100 and g > b + 24:
            return int(y)
    return int(plate.shape[0] * 0.85)


def paste_feather(canvas: np.ndarray, plate: np.ndarray, plate_x: int, feather: int) -> np.ndarray:
    out = canvas.copy()
    pw = plate.shape[1]
    alpha = np.ones(pw, np.float32)
    ramp = np.linspace(0.0, 1.0, feather, endpoint=False)
    alpha[:feather] = ramp
    alpha[-feather:] = ramp[::-1]
    region = out[:, plate_x : plate_x + pw].astype(np.float32)
    blended = region * (1.0 - alpha)[None, :, None] + plate.astype(np.float32) * alpha[None, :, None]
    out[:, plate_x : plate_x + pw] = np.clip(blended, 0, 255).astype(np.uint8)
    return out


def fade_bottom(im: Image.Image, fade: int = 28) -> Image.Image:
    arr = np.array(im)
    fade = min(fade, arr.shape[0])
    ramp = np.linspace(1.0, 0.0, fade, dtype=np.float32)
    arr[-fade:, :, 3] = (arr[-fade:, :, 3].astype(np.float32) * ramp[:, None]).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def sprite_from_box(portrait: np.ndarray, box: tuple[int, int, int, int], pad: int = 6) -> Image.Image:
    h, w = portrait.shape[:2]
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(w, x1 + pad), min(h, y1 + pad)
    crop = portrait[y0:y1, x0:x1]
    alpha = np.where(is_sky(crop) | is_grass(crop), 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(0.7))
    rgba = np.dstack([crop, np.array(alpha_img)])
    return Image.fromarray(rgba, "RGBA")


def cloud_sprite(portrait: np.ndarray, box: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - 10), max(0, y0 - 10)
    x1, y1 = min(portrait.shape[1], x1 + 10), min(portrait.shape[0], y1 + 10)
    crop = portrait[y0:y1, x0:x1].astype(np.int16)
    white = crop.min(axis=2)
    alpha = np.clip((white - 168) * 4, 0, 255).astype(np.uint8)
    sky = is_sky(crop.astype(np.uint8))
    alpha[sky] = 0
    alpha_img = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(1.4))
    rgba = np.dstack([crop.astype(np.uint8), np.array(alpha_img)])
    return Image.fromarray(rgba, "RGBA")


def haze(im: Image.Image, amount: float, sky: tuple[int, int, int] = (8, 136, 214)) -> Image.Image:
    arr = np.array(im).astype(np.float32)
    for channel, value in enumerate(sky):
        arr[..., channel] = arr[..., channel] * (1.0 - amount) + value * amount
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def paste_rgba(base: Image.Image, sprite: Image.Image, x: int, y: int) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    layer.paste(sprite, (x, y), sprite)
    composed = Image.alpha_composite(base, layer)
    base.paste(composed)


def ground_shadow(base: Image.Image, cx: int, base_y: int, width: int) -> None:
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ellipse = Image.new("RGBA", base.size, (0, 0, 0, 0))
    # 短接地影，跟風格聖經的柔影一致，不拉成長投影。
    px = np.zeros((base.size[1], base.size[0], 4), np.uint8)
    yy, xx = np.ogrid[: base.size[1], : base.size[0]]
    rx = max(8, width // 2)
    ry = 7
    mask = ((xx - cx) / rx) ** 2 + ((yy - base_y) / ry) ** 2 <= 1.0
    px[mask] = (50, 60, 24, 78)
    ellipse = Image.fromarray(px, "RGBA").filter(ImageFilter.GaussianBlur(3.5))
    paste_rgba(base, ellipse, 0, 0)
    del shadow


# 直式原圖上的主體（左側吊車、水泥車、彩色高塔、輪子）。不含天空、雲和草地小芽。
SUBJECT_PORTRAIT = (100, 440, 930, 1210)


def subject_bbox(plate: np.ndarray) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = SUBJECT_PORTRAIT
    local = (x0, y0 - CROP_Y, x1, y1 - CROP_Y)
    if local[1] < 0 or local[3] > plate.shape[0]:
        raise SystemExit(f"主體超出中心裁切：{local}")
    return local


def cover_window(
    viewport_w: int,
    viewport_h: int,
    focus_x: float,
    focus_y: float,
) -> tuple[int, int, int, int]:
    """object-fit: cover 後，原圖還看得到的矩形。focus 是 object-position（0–1）。"""
    scale = max(viewport_w / CANVAS_W, viewport_h / CANVAS_H)
    vis_w = viewport_w / scale
    vis_h = viewport_h / scale
    left = (CANVAS_W - vis_w) * focus_x
    top = (CANVAS_H - vis_h) * focus_y
    return (
        int(round(left)),
        int(round(top)),
        int(round(left + vis_w)),
        int(round(top + vis_h)),
    )


def assert_subjects_visible(bbox: tuple[int, int, int, int], focus_x: float, focus_y: float) -> None:
    x0, y0, x1, y1 = bbox
    # 留 12px，避免抗鋸齒貼到裁切線。
    pad = 12
    for name, vw, vh in VIEWPORTS:
        left, top, right, bottom = cover_window(vw, vh, focus_x, focus_y)
        ok = left <= x0 - pad and top <= y0 - pad and right >= x1 + pad and bottom >= y1 + pad
        print(
            f"  {name} 可見 x={left}–{right} y={top}–{bottom} "
            f"主體 {'完整' if ok else '被裁到'}"
        )
        if not ok:
            raise SystemExit(f"{name} 會裁到水泥車或高塔")


def compose(debug_dir: Path | None) -> None:
    rng = random.Random(SEED)
    portrait = np.array(Image.open(PORTRAIT).convert("RGB"))
    plate = portrait[CROP_Y : CROP_Y + CANVAS_H, :, :]
    if plate.shape[0] != CANVAS_H or plate.shape[1] != 1024:
        raise SystemExit(f"中心裁切尺寸不對：{plate.shape}")

    horizon = horizon_y(plate)
    print(f"地平線約 y={horizon}")
    left_w = PLATE_X
    right_w = CANVAS_W - (PLATE_X + plate.shape[1])
    left = soften_bands(stitch_columns(plate, left_w, rng))
    right = soften_bands(stitch_columns(plate, right_w, random.Random(SEED + 7)))
    left = soften_horizon(left, horizon)
    right = soften_horizon(right, horizon)
    left = lay_varied_grass(left, portrait, horizon, flip=False)
    right = lay_varied_grass(right, portrait, horizon, flip=True)
    left = anchor_edge(left, plate, "left")
    right = anchor_edge(right, plate, "right")
    base = np.concatenate([left, plate, right], axis=1)
    canvas = paste_feather(base, plate, PLATE_X, FEATHER)

    image = Image.fromarray(canvas, "RGB").convert("RGBA")

    # 遠景吊車：同一台原圖吊車縮小、加霧。右側不另抠高塔旁的小吊車，
    # 那一刀會把彩色塔身切進來。左右尺度和方向不同，避免看起來像蓋章。
    # 位置落在 1440×900 的 cover 還看得到的範圍（約 x=334–2228）。
    crane_src = fade_bottom(haze(sprite_from_box(portrait, LEFT_CRANE_BOX), 0.3))
    left_crane = crane_src.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    lw = int(left_crane.width * 0.46)
    lh = int(left_crane.height * 0.46)
    left_crane = left_crane.resize((lw, lh), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.55))
    left_x, left_y = 400, horizon - lh + 16
    ground_shadow(image, left_x + lw // 2, horizon + 6, int(lw * 0.7))
    paste_rgba(image, left_crane, left_x, left_y)

    right_crane = haze(crane_src, 0.18)
    rw = int(right_crane.width * 0.30)
    rh = int(right_crane.height * 0.30)
    right_crane = right_crane.resize((rw, rh), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.7))
    right_x, right_y = 2060, horizon - rh + 12
    ground_shadow(image, right_x + rw // 2, horizon + 4, int(rw * 0.72))
    paste_rgba(image, right_crane, right_x, right_y)

    cloud_placements = (
        (0, 160, 70, 0.92, False),
        (2, 470, 120, 0.78, True),
        (1, 1960, 86, 1.05, False),
        (0, 2280, 150, 0.7, True),
    )
    for index, cx, cy, scale, flip in cloud_placements:
        cloud = cloud_sprite(portrait, CLOUD_BOXES[index])
        if flip:
            cloud = cloud.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        cloud = cloud.resize(
            (max(1, int(cloud.width * scale)), max(1, int(cloud.height * scale))),
            Image.Resampling.LANCZOS,
        )
        paste_rgba(image, cloud, cx, cy)

    rgb = np.array(image.convert("RGB"))
    sx0, sy0, sx1, sy1 = subject_bbox(plate)
    bbox = (PLATE_X + sx0, sy0, PLATE_X + sx1, sy1)
    focus_x = ((bbox[0] + bbox[2]) / 2) / CANVAS_W
    focus_y = ((bbox[1] + bbox[3]) / 2) / CANVAS_H
    print(
        f"主體 bbox x={bbox[0]}–{bbox[2]} y={bbox[1]}–{bbox[3]} "
        f"object-position {focus_x * 100:.1f}% {focus_y * 100:.1f}%"
    )
    assert_subjects_visible(bbox, focus_x, focus_y)

    # 兩側不該再是大片無紋理的平塗藍。
    side = np.concatenate([rgb[:, :180], rgb[:, -180:]], axis=1)
    upper = side[:horizon, :, :]
    print(
        f"兩側天空標準差 R{upper[..., 0].std():.1f} "
        f"G{upper[..., 1].std():.1f} B{upper[..., 2].std():.1f}"
    )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgb, "RGB").save(
        OUTPUT,
        quality=88,
        optimize=True,
        subsampling=1,
    )
    print(f"寫入 {OUTPUT} {CANVAS_W}×{CANVAS_H} {OUTPUT.stat().st_size // 1024}KB")

    if debug_dir:
        debug_dir.mkdir(parents=True, exist_ok=True)
        preview = image.resize((1280, 548), Image.Resampling.LANCZOS)
        preview.convert("RGB").save(debug_dir / "wide-preview.jpg", quality=85)
        left_crane.save(debug_dir / "left-crane.png")
        right_crane.save(debug_dir / "right-crane.png")
        for name, vw, vh in VIEWPORTS:
            left, top, right, bottom = cover_window(vw, vh, focus_x, focus_y)
            crop = rgb[max(0, top) : bottom, max(0, left) : right]
            shot = Image.fromarray(crop, "RGB")
            shot.thumbnail((960, 540))
            shot.save(debug_dir / f"cover-{name}.jpg", quality=85)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--debug-dir", type=Path)
    args = parser.parse_args()
    compose(args.debug_dir)


if __name__ == "__main__":
    main()
