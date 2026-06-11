#!/usr/bin/env python3
"""從首頁主視覺 hero-home.jpg 產生「加入主畫面」用的 App 圖示。

做法：自動找出畫面中最醒目的紅色車車當主角，置中裁成方形（留出
安全邊距，讓 Android 圓形遮罩 / iOS 圓角不會切到車車），再輸出
各尺寸 PNG。風格自然與站上黏土插畫一致。

重跑：python3 scripts/gen_icons.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
SRC = os.path.join(ROOT, "hero-home.jpg")
CREAM = (255, 255, 255)  # #ffffff，與網站底色一致（白底）

# 輸出檔名 -> 邊長(px)
OUTPUTS = {
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
    "apple-touch-icon-180.png": 180,
    "apple-touch-icon-192.png": 192,
    "apple-touch-icon-512.png": 512,
}


def red_car_center(im: Image.Image) -> tuple[int, int]:
    """以紅色像素重心估計紅車中心（限定畫面下半部，避開摩天輪等紅點）。"""
    px = im.load()
    w, h = im.size
    sx = sy = n = 0
    for y in range(int(h * 0.55), h, 2):
        for x in range(0, w, 2):
            r, g, b = px[x, y][:3]
            if r > 150 and g < 110 and b < 90 and r - g > 70:
                sx += x
                sy += y
                n += 1
    if n == 0:
        return w // 2, int(h * 0.78)
    return sx // n, sy // n


def build_master(im: Image.Image) -> Image.Image:
    """裁出以紅車為中心的方形主視覺（1024×1024）。"""
    w, h = im.size
    cx, cy = red_car_center(im)

    # 車車約佔 width 的 0.32；讓它在 icon 中佔約 56%，留安全邊距。
    side = int(w * 0.32 / 0.56)
    side = min(side, w, h)

    left = cx - side // 2
    top = cy - side // 2
    # 夾在邊界內
    left = max(0, min(left, w - side))
    top = max(0, min(top, h - side))

    crop = im.crop((left, top, left + side, top + side))
    return crop.resize((1024, 1024), Image.LANCZOS)


def rounded(im: Image.Image, radius_ratio: float = 0.0) -> Image.Image:
    """選用：加圓角（這裡輸出方形全幅，圓角交給系統處理）。"""
    if radius_ratio <= 0:
        return im
    w, h = im.size
    r = int(w * radius_ratio)
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, w, h], radius=r, fill=255)
    out = Image.new("RGB", (w, h), CREAM)
    out.paste(im, (0, 0), mask)
    return out


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    master = build_master(im)
    # 輕微銳化，讓縮圖後車車輪廓更清楚
    master = master.filter(ImageFilter.UnsharpMask(radius=2, percent=80, threshold=2))

    for name, size in OUTPUTS.items():
        out = master.resize((size, size), Image.LANCZOS)
        # 量化到 256 色 + optimize，照片風 PNG 也能壓到很小，
        # 對黏土插畫的觀感幾乎無損。
        out_q = out.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.NONE)
        out_q.save(os.path.join(ROOT, name), "PNG", optimize=True)
        print(f"wrote {name} ({size}x{size})")


if __name__ == "__main__":
    main()
