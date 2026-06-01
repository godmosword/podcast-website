#!/usr/bin/env python3
"""一次性產生佔位素材：每則故事的 10 張圖 + 吉祥物 + PWA 圖示。
真正的圖片/音檔請依各故事資料夾的 README.txt 替換。"""
import os
from PIL import Image, ImageDraw, ImageFont

FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
CREAM = (255, 247, 236)  # #fff7ec
ROOT = os.path.join(os.path.dirname(__file__), "..", "public")

# 每則故事：slug、主題色、字幕（10 句）。佔位圖會用主題色繪製。
STORIES = {
    "red-truck": {
        "color": (228, 87, 46),  # #e4572e
        "captions": [
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
        ],
    },
    "police-car": {
        "color": (28, 109, 208),  # #1c6dd0
        "captions": [
            "這是一台藍色的小警車，閃著亮亮的警示燈。",
            "早上，小警車出門巡邏，保護大家的安全。",
            "公園裡有小朋友迷路了，小警車馬上趕過去。",
            "小警車輕聲說：「別怕，我帶你找媽媽。」",
            "經過熱鬧的市場，大家都跟小警車揮揮手。",
            "紅綠燈壞掉了，小警車幫忙指揮交通。",
            "一隻小貓卡在樹上，小警車想辦法救牠下來。",
            "傍晚，小警車把走失的小狗送回家。",
            "天黑了，小警車的燈還亮著，守護整座城市。",
            "辛苦了一天，小警車說：「大家晚安，明天見！」",
        ],
    },
    "excavator": {
        "color": (245, 159, 0),  # #f59f00
        "captions": [
            "這是一台黃色的挖土機，力氣大得不得了。",
            "今天要和好朋友一起蓋一座新公園。",
            "挖土機先用大鏟子，把土挖得鬆鬆軟軟。",
            "「我來幫忙！」傾卸卡車把土載走。",
            "大家分工合作，工地一點都不亂。",
            "挖到一顆大石頭，挖土機和卡車一起搬。",
            "中午，大家坐在一起吃飯，聊得好開心。",
            "下午，挖土機把地整理得平平整整。",
            "種上小樹和花，新公園越來越漂亮。",
            "公園蓋好了！大家擊掌說：「合作真棒！」",
        ],
    },
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


def make_page(slug, idx, caption, color):
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
    pf = font(140)
    d.text((W // 2, 560), f"{idx:02d}", font=pf, fill=CREAM, anchor="mm")
    cf = font(46)
    y = 680
    for ln in wrap(d, caption, cf, W - 160):
        d.text((W // 2, y), ln, font=cf, fill=(255, 255, 255), anchor="mm")
        y += 62
    d.text((W // 2, H - 36), "佔位圖 · 請替換成真正的插畫", font=font(28),
           fill=(255, 255, 255), anchor="mm")
    path = os.path.join(ROOT, "stories", slug, f"{idx:02d}.jpg")
    img.save(path, "JPEG", quality=88)


def make_mascot():
    S = 4
    W, H = 480 * S, 360 * S
    COLOR = STORIES["red-truck"]["color"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, s = W // 2, int(H * 0.42), 70 * S

    def rr(box, r, fill):
        d.rounded_rectangle(box, radius=r, fill=fill)

    rr([cx - 2.2 * s, cy - 1.2 * s, cx + 0.6 * s, cy + 0.8 * s], 0.28 * s, COLOR)
    rr([cx + 0.55 * s, cy - 0.35 * s, cx + 2.0 * s, cy + 0.8 * s], 0.28 * s, COLOR)
    rr([cx - 1.9 * s, cy - 0.95 * s, cx + 0.35 * s, cy + 0.45 * s], 0.2 * s, CREAM)
    for ex in (cx - 1.25 * s, cx - 0.35 * s):
        d.ellipse([ex - 0.26 * s, cy - 0.62 * s, ex + 0.26 * s, cy - 0.1 * s], fill=(60, 45, 35))
        d.ellipse([ex - 0.02 * s, cy - 0.58 * s, ex + 0.12 * s, cy - 0.44 * s], fill=CREAM)
    d.arc([cx - 1.1 * s, cy - 0.35 * s, cx - 0.3 * s, cy + 0.25 * s], start=20, end=160,
          fill=(228, 120, 90), width=int(0.12 * s))
    for bx in (cx - 1.55 * s, cx + 0.0 * s):
        d.ellipse([bx - 0.16 * s, cy - 0.12 * s, bx + 0.16 * s, cy + 0.12 * s], fill=(255, 170, 140, 180))
    for wx in (cx - 1.4 * s, cx + 1.3 * s):
        d.ellipse([wx - 0.45 * s, cy + 0.5 * s, wx + 0.45 * s, cy + 1.4 * s], fill=darker(COLOR))
        d.ellipse([wx - 0.18 * s, cy + 0.77 * s, wx + 0.18 * s, cy + 1.13 * s], fill=CREAM)
    img = img.resize((W // S, H // S), Image.LANCZOS)
    img.save(os.path.join(ROOT, "mascot.png"), "PNG")


def make_icon(size):
    COLOR = STORIES["red-truck"]["color"]
    img = Image.new("RGB", (size, size), COLOR)
    d = ImageDraw.Draw(img)
    draw_truck(d, size // 2, int(size * 0.42), size * 0.11, COLOR)
    d.text((size // 2, int(size * 0.78)), "車車", font=font(int(size * 0.16)),
           fill=CREAM, anchor="mm")
    img.save(os.path.join(ROOT, f"icon-{size}.png"), "PNG")


if __name__ == "__main__":
    for slug, cfg in STORIES.items():
        os.makedirs(os.path.join(ROOT, "stories", slug), exist_ok=True)
        for i, cap in enumerate(cfg["captions"], start=1):
            make_page(slug, i, cap, cfg["color"])
        print("wrote 10 pages for", slug)
    make_mascot()
    for s in (192, 512):
        make_icon(s)
    print("wrote mascot + icons")
