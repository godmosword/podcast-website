#!/usr/bin/env python3
"""產生 iPhone 主畫面圖示候選 / 最終檔。
iOS 會自動套圓角且不支援透明，所以圖示為滿版正方形、不留透明、不自己畫圓角。
用法：
  python3 scripts/gen_icons.py preview          # 產生 3 個方案到 /tmp
  python3 scripts/gen_icons.py build <style>     # 產生最終多尺寸到 public/
"""
import sys
from PIL import Image, ImageDraw

CREAM = (255, 247, 236)
TRUCK = (228, 87, 46)       # 品牌紅
TRUCK_DARK = (178, 60, 28)
WHEEL = (74, 59, 47)


def lerp(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def v_gradient(img, top, bottom):
    d = ImageDraw.Draw(img)
    W, H = img.size
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(top, bottom, y / H))


def draw_face_truck(d, cx, cy, s):
    """笑臉卡車（紅車身 + 淺色臉窗 + 眼睛 + 微笑 + 腮紅）。"""
    def rr(box, r, fill):
        d.rounded_rectangle(box, radius=r, fill=fill)

    rr([cx - 2.2 * s, cy - 1.2 * s, cx + 0.6 * s, cy + 0.8 * s], 0.30 * s, TRUCK)
    rr([cx + 0.55 * s, cy - 0.35 * s, cx + 2.0 * s, cy + 0.8 * s], 0.30 * s, TRUCK)
    rr([cx - 1.9 * s, cy - 0.95 * s, cx + 0.35 * s, cy + 0.45 * s], 0.22 * s, CREAM)
    for ex in (cx - 1.25 * s, cx - 0.35 * s):
        d.ellipse([ex - 0.27 * s, cy - 0.62 * s, ex + 0.27 * s, cy - 0.06 * s], fill=(60, 45, 35))
        d.ellipse([ex - 0.02 * s, cy - 0.58 * s, ex + 0.13 * s, cy - 0.42 * s], fill=CREAM)
    d.arc([cx - 1.15 * s, cy - 0.35 * s, cx - 0.3 * s, cy + 0.28 * s], start=20, end=160,
          fill=(228, 120, 90), width=int(0.13 * s))
    for bx in (cx - 1.6 * s, cx + 0.02 * s):
        d.ellipse([bx - 0.17 * s, cy - 0.10 * s, bx + 0.17 * s, cy + 0.16 * s], fill=(255, 170, 140))
    for wx in (cx - 1.4 * s, cx + 1.3 * s):
        d.ellipse([wx - 0.46 * s, cy + 0.5 * s, wx + 0.46 * s, cy + 1.42 * s], fill=WHEEL)
        d.ellipse([wx - 0.18 * s, cy + 0.78 * s, wx + 0.18 * s, cy + 1.14 * s], fill=CREAM)


def render(style, size):
    SS = 4
    W = size * SS
    img = Image.new("RGB", (W, W), CREAM)
    d = ImageDraw.Draw(img)
    cx, cy, s = W // 2, int(W * 0.46), W * 0.165

    if style == "soft":
        v_gradient(img, (255, 247, 236), (255, 207, 153))
        d = ImageDraw.Draw(img)
        # 柔和的地面陰影（比背景略深的橘）
        d.ellipse([cx - 2.0 * s, cy + 1.28 * s, cx + 2.0 * s, cy + 1.66 * s], fill=(240, 180, 120))
        draw_face_truck(d, cx, cy, s)

    elif style == "sky":
        v_gradient(img, (165, 216, 255), (77, 171, 247))
        d = ImageDraw.Draw(img)
        for (cxb, cyb, rb) in [(0.24, 0.26, 0.10), (0.74, 0.20, 0.08), (0.6, 0.34, 0.06)]:
            x, y, r = W * cxb, W * cyb, W * rb
            for off in (-1.2, 0, 1.2):
                d.ellipse([x + off * r - r, y - r * 0.7, x + off * r + r, y + r * 0.7], fill=CREAM)
        draw_face_truck(d, cx, cy, s)

    elif style == "scene":
        # 黏土風場景：藍天 + 沙地 + 草叢，呼應 podcast 插圖
        v_gradient(img, (120, 192, 255), (180, 224, 255))
        d = ImageDraw.Draw(img)
        ground_y = int(W * 0.66)
        d.rectangle([0, ground_y, W, W], fill=(229, 200, 156))
        d.ellipse([-W * 0.1, ground_y - W * 0.06, W * 0.4, ground_y + W * 0.12], fill=(124, 196, 110))
        d.ellipse([W * 0.62, ground_y - W * 0.05, W * 1.1, ground_y + W * 0.12], fill=(124, 196, 110))
        for (cxb, cyb, rb) in [(0.22, 0.2, 0.075), (0.78, 0.16, 0.06)]:
            x, y, r = W * cxb, W * cyb, W * rb
            for off in (-1.2, 0, 1.2):
                d.ellipse([x + off * r - r, y - r * 0.7, x + off * r + r, y + r * 0.7], fill=CREAM)
        draw_face_truck(d, cx, int(W * 0.5), W * 0.155)

    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "preview"
    if mode == "preview":
        for st in ("soft", "sky", "scene"):
            render(st, 512).save(f"/tmp/icon-{st}.png")
            print("wrote", f"/tmp/icon-{st}.png")
    elif mode == "build":
        style = sys.argv[2]
        for size in (180, 192, 512, 1024):
            render(style, size).save(f"public/apple-touch-icon-{size}.png")
        # 同步覆蓋 PWA 圖示
        render(style, 192).save("public/icon-192.png")
        render(style, 512).save("public/icon-512.png")
        render(style, 180).save("public/apple-touch-icon.png")
        print("built icons with style:", style)
