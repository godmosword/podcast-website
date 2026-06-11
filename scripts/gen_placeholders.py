#!/usr/bin/env python3
"""產生佔位素材：每則故事的封面/內頁圖 + 吉祥物 + PWA 圖示。
故事內容對應 podcast《車車遊樂園》的真實集數；圖片為佔位，
請之後替換成真正的插畫（檔名 01.jpg ~ NN.jpg，補零兩位）。"""
import os
from PIL import Image, ImageDraw, ImageFont

FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
CREAM = (255, 255, 255)  # #ffffff（白底）
BRAND = (228, 87, 46)    # #e4572e 品牌色（吉祥物/圖示）
ROOT = os.path.join(os.path.dirname(__file__), "..", "public")

# slug -> (主題色, 標題, 頁數)
REAL_STORIES = {
    "ep-6": ((224, 49, 49), "安安救護車", 6),
    "ep-5": ((245, 159, 0), "東東挖土機", 6),
    "ep-4": ((12, 166, 120), "鈴鈴清潔車", 6),
    "ep-3": ((230, 73, 128), "小紅賽車", 6),
    "ep-2": ((66, 99, 235), "小小無人機", 6),
    "ep-1": ((112, 72, 232), "未來電動車", 6),
}


def font(size):
    return ImageFont.truetype(FONT, size, index=0)


def darker(c, f=0.78):
    return tuple(int(x * f) for x in c)


def draw_truck(d, cx, cy, s, color, body=CREAM):
    d.rounded_rectangle([cx - 2.2 * s, cy - 1.2 * s, cx + 0.6 * s, cy + 0.8 * s],
                        radius=0.25 * s, fill=body)
    d.rounded_rectangle([cx + 0.6 * s, cy - 0.4 * s, cx + 2.0 * s, cy + 0.8 * s],
                        radius=0.25 * s, fill=body)
    d.rounded_rectangle([cx + 0.85 * s, cy - 0.2 * s, cx + 1.75 * s, cy + 0.3 * s],
                        radius=0.12 * s, fill=color)
    for wx in (cx - 1.4 * s, cx + 1.3 * s):
        d.ellipse([wx - 0.45 * s, cy + 0.5 * s, wx + 0.45 * s, cy + 1.4 * s], fill=darker(color))
        d.ellipse([wx - 0.18 * s, cy + 0.77 * s, wx + 0.18 * s, cy + 1.13 * s], fill=body)


def make_page(slug, idx, title, color):
    path = os.path.join(ROOT, "stories", slug, f"{idx:02d}.jpg")
    if os.path.exists(path):
        return  # 已有真實插圖，不覆蓋
    W, H = 1200, 900
    img = Image.new("RGB", (W, H), color)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(color[0] * (1 - t) + 255 * t)
        g = int(color[1] * (1 - t) + 220 * t)
        b = int(color[2] * (1 - t) + 190 * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    draw_truck(d, W // 2, 360, 120, color)
    d.text((W // 2, 560), f"{idx:02d}", font=font(140), fill=CREAM, anchor="mm")
    d.text((W // 2, 700), title, font=font(56), fill=(255, 255, 255), anchor="mm")
    d.text((W // 2, H - 36), "佔位圖 · 請替換成真正的插畫", font=font(28),
           fill=(255, 255, 255), anchor="mm")
    img.save(path, "JPEG", quality=88)


def make_mascot():
    S = 4
    W, H = 480 * S, 360 * S
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, s = W // 2, int(H * 0.42), 70 * S

    def rr(box, r, fill):
        d.rounded_rectangle(box, radius=r, fill=fill)

    rr([cx - 2.2 * s, cy - 1.2 * s, cx + 0.6 * s, cy + 0.8 * s], 0.28 * s, BRAND)
    rr([cx + 0.55 * s, cy - 0.35 * s, cx + 2.0 * s, cy + 0.8 * s], 0.28 * s, BRAND)
    rr([cx - 1.9 * s, cy - 0.95 * s, cx + 0.35 * s, cy + 0.45 * s], 0.2 * s, CREAM)
    for ex in (cx - 1.25 * s, cx - 0.35 * s):
        d.ellipse([ex - 0.26 * s, cy - 0.62 * s, ex + 0.26 * s, cy - 0.1 * s], fill=(60, 45, 35))
        d.ellipse([ex - 0.02 * s, cy - 0.58 * s, ex + 0.12 * s, cy - 0.44 * s], fill=CREAM)
    d.arc([cx - 1.1 * s, cy - 0.35 * s, cx - 0.3 * s, cy + 0.25 * s], start=20, end=160,
          fill=(228, 120, 90), width=int(0.12 * s))
    for bx in (cx - 1.55 * s, cx + 0.0 * s):
        d.ellipse([bx - 0.16 * s, cy - 0.12 * s, bx + 0.16 * s, cy + 0.12 * s], fill=(255, 170, 140, 180))
    for wx in (cx - 1.4 * s, cx + 1.3 * s):
        d.ellipse([wx - 0.45 * s, cy + 0.5 * s, wx + 0.45 * s, cy + 1.4 * s], fill=darker(BRAND))
        d.ellipse([wx - 0.18 * s, cy + 0.77 * s, wx + 0.18 * s, cy + 1.13 * s], fill=CREAM)
    img = img.resize((W // S, H // S), Image.LANCZOS)
    img.save(os.path.join(ROOT, "mascot.png"), "PNG")


def make_icon(size):
    img = Image.new("RGB", (size, size), BRAND)
    d = ImageDraw.Draw(img)
    draw_truck(d, size // 2, int(size * 0.42), size * 0.11, BRAND)
    d.text((size // 2, int(size * 0.78)), "車車", font=font(int(size * 0.16)),
           fill=CREAM, anchor="mm")
    img.save(os.path.join(ROOT, f"icon-{size}.png"), "PNG")


if __name__ == "__main__":
    for slug, (color, title, pages) in REAL_STORIES.items():
        os.makedirs(os.path.join(ROOT, "stories", slug), exist_ok=True)
        for i in range(1, pages + 1):
            make_page(slug, i, title, color)
        print(f"wrote {pages} pages for {slug}")
    make_mascot()
    for s in (192, 512):
        make_icon(s)
    print("wrote mascot + icons")
