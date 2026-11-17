#!/usr/bin/env python3
"""把 Kaiyi 選定的補畫原檔複製成電腦版 hero JPG。

來源：wide-source-outpainted.jpg（2560×1440，16:9）。
原本是 1280×720，已用 Lanczos 放大並輕微銳化。不要再裁切，也不要拉邊緣。

WebP／AVIF 交給既有管線（品質與其他 landing hero 相同）：

  npx tsx -e 'import { writeModernSiblings } from "./scripts/lib/lcp-image-optimize.ts"; void writeModernSiblings("public/landing/segment-picture-books.jpg").catch((err) => { console.error(err); process.exit(1); });'
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "assets/landing/segment-picture-books/wide-source-outpainted.jpg"
OUTPUT = ROOT / "public/landing/segment-picture-books.jpg"
EXPECTED = (2560, 1440)


def main() -> None:
    with Image.open(SOURCE) as image:
        if image.size != EXPECTED:
            raise SystemExit(f"補畫原檔應為 {EXPECTED[0]}×{EXPECTED[1]}，實際是 {image.size[0]}×{image.size[1]}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE, OUTPUT)
    print(f"複製 {SOURCE.relative_to(ROOT)} → {OUTPUT.relative_to(ROOT)} {EXPECTED[0]}×{EXPECTED[1]} {OUTPUT.stat().st_size // 1024}KB")
    print("接著對這張 JPG 跑 writeModernSiblings，產出同尺寸 WebP／AVIF。")


if __name__ == "__main__":
    main()
