#!/usr/bin/env python3
"""一次性產生佔位素材：red-truck 的 10 張圖 + PWA 圖示。
真正的圖片/音檔請依 public/stories/red-truck/README.txt 替換。"""
import os
from PIL import Image, ImageDraw, ImageFont

FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
COLOR = (228, 87, 46)        # #e4572e 紅色大卡車主題色
COLOR_DARK = (180, 60, 28)
CREAM = (255, 247, 236)      # #fff7ec
ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
TRUCK_DIR = os.path.join(ROOT, "stories", "red-truck")

CAPTIONS = [
    "這是一台紅色的大卡車，它最喜歡載東西了。",
    "早上太陽公公起床，大卡車也發動引擎，嘟嘟！",
    "第一站，大卡車載了滿滿一車新鮮的蘋果。",
    "經過彎彎的山路，大卡車開得又穩又慢。",
    "下雨了，雨刷刷刷刷，把擋風玻璃擦得亮亮的。",
    "大卡車把蘋果送到市場，大家都好開心。",
    "中午休息時間，大卡車在大樹下乘涼。",
    "傍晚，大卡車載著小朋友的玩具回家。",
    "天黑了，大卡車打開亮亮的大燈，照著回家的路。",
    "辛苦了一天，大卡車說晚安，明天再出發！",
]


def font(size):
    return ImageFont.truetype(FONT, size, index=0)


def draw_truck(d, cx, cy, s, body=CREAM, wheel=COLOR_DARK):
    """畫一台簡單的卡車（置中於 cx,cy，大小比例 s）。"""
    # 車斗 + 車頭
    d.rounded_rectangle([cx - 2.2 * s, cy - 1.2 * s, cx + 0.6 * s, cy + 0.8 * s],
                        radius=0.25 * s, fill=body)
    d.rounded_rectangle([cx + 0.6 * s, cy - 0.4 * s, cx + 2.0 * s, cy + 0.8 * s],
                        radius=0.25 * s, fill=body)
    # 車窗
    d.rounded_rectangle([cx + 0.85 * s, cy - 0.2 * s, cx + 1.75 * s, cy + 0.3 * s],
                        radius=0.12 * s, fill=COLOR)
    # 輪子
    for wx in (cx - 1.4 * s, cx + 1.3 * s):
        d.ellipse([wx - 0.45 * s, cy + 0.5 * s, wx + 0.45 * s, cy + 1.4 * s], fill=wheel)
        d.ellipse([wx - 0.18 * s, cy + 0.77 * s, wx + 0.18 * s, cy + 1.13 * s], fill=body)


def wrap(d, text, fnt, max_w):
    lines, line = [], ""
    for ch in text:
        if d.textlength(line + ch, font=fnt) <= max_w:
            line += ch
        else:
            lines.append(line)
            line = ch
    if line:
        lines.append(line)
    return lines


def make_page(idx, caption):
    W, H = 1200, 900
    img = Image.new("RGB", (W, H), COLOR)
    d = ImageDraw.Draw(img)
    # 漸層底（上深下淺）
    for y in range(H):
        t = y / H
        r = int(COLOR[0] * (1 - t) + 255 * t)
        g = int(COLOR[1] * (1 - t) + 200 * t)
        b = int(COLOR[2] * (1 - t) + 150 * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    # 卡車
    draw_truck(d, W // 2, 360, 120)
    # 頁碼大字
    pf = font(140)
    num = f"{idx:02d}"
    d.text((W // 2, 560), num, font=pf, fill=CREAM, anchor="mm")
    # 字幕
    cf = font(46)
    lines = wrap(d, caption, cf, W - 160)
    y = 680
    for ln in lines:
        d.text((W // 2, y), ln, font=cf, fill=(255, 255, 255), anchor="mm")
        y += 62
    # 浮水印
    sf = font(28)
    d.text((W // 2, H - 36), "佔位圖 · 請替換成真正的插畫", font=sf,
           fill=(255, 255, 255), anchor="mm")
    path = os.path.join(TRUCK_DIR, f"{idx:02d}.jpg")
    img.save(path, "JPEG", quality=88)
    return path


def make_mascot():
    """擬人化的吉祥物紅卡車（有眼睛、笑臉），透明背景，給首頁 Header 用。"""
    S = 4  # 超取樣後縮小，邊緣較平滑
    W, H = 480 * S, 360 * S
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, s = W // 2, int(H * 0.42), 70 * S

    def rr(box, r, fill):
        d.rounded_rectangle(box, radius=r, fill=fill)

    # 車身（紅）
    rr([cx - 2.2 * s, cy - 1.2 * s, cx + 0.6 * s, cy + 0.8 * s], 0.28 * s, COLOR)
    rr([cx + 0.55 * s, cy - 0.35 * s, cx + 2.0 * s, cy + 0.8 * s], 0.28 * s, COLOR)
    # 車窗（當作臉，淺色）
    rr([cx - 1.9 * s, cy - 0.95 * s, cx + 0.35 * s, cy + 0.45 * s], 0.2 * s, CREAM)
    # 眼睛
    for ex in (cx - 1.25 * s, cx - 0.35 * s):
        d.ellipse([ex - 0.26 * s, cy - 0.62 * s, ex + 0.26 * s, cy - 0.1 * s],
                  fill=(60, 45, 35))
        d.ellipse([ex - 0.02 * s, cy - 0.58 * s, ex + 0.12 * s, cy - 0.44 * s],
                  fill=CREAM)
    # 微笑
    d.arc([cx - 1.1 * s, cy - 0.35 * s, cx - 0.3 * s, cy + 0.25 * s],
          start=20, end=160, fill=(228, 120, 90), width=int(0.12 * s))
    # 腮紅
    for bx in (cx - 1.55 * s, cx + 0.0 * s):
        d.ellipse([bx - 0.16 * s, cy - 0.12 * s, bx + 0.16 * s, cy + 0.12 * s],
                  fill=(255, 170, 140, 180))
    # 輪子
    for wx in (cx - 1.4 * s, cx + 1.3 * s):
        d.ellipse([wx - 0.45 * s, cy + 0.5 * s, wx + 0.45 * s, cy + 1.4 * s],
                  fill=COLOR_DARK)
        d.ellipse([wx - 0.18 * s, cy + 0.77 * s, wx + 0.18 * s, cy + 1.13 * s],
                  fill=CREAM)
    img = img.resize((W // S, H // S), Image.LANCZOS)
    path = os.path.join(ROOT, "mascot.png")
    img.save(path, "PNG")
    return path


def make_icon(size):
    img = Image.new("RGB", (size, size), COLOR)
    d = ImageDraw.Draw(img)
    draw_truck(d, size // 2, int(size * 0.42), size * 0.11)
    f = font(int(size * 0.16))
    d.text((size // 2, int(size * 0.78)), "車車", font=f, fill=CREAM, anchor="mm")
    path = os.path.join(ROOT, f"icon-{size}.png")
    img.save(path, "PNG")
    return path


if __name__ == "__main__":
    os.makedirs(TRUCK_DIR, exist_ok=True)
    for i, cap in enumerate(CAPTIONS, start=1):
        print("wrote", make_page(i, cap))
    print("wrote", make_mascot())
    for s in (192, 512):
        print("wrote", make_icon(s))
