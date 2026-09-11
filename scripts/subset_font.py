#!/usr/bin/env python3
"""把站內中文字型子集化成「網站實際用到的中文字」woff2。

兩個自託管字型共用同一份字集（非 ASCII：中日韓字 + 全形標點；emoji 不在字型內會略過）：

- huninn（jf-open 粉圓）：內文。來源 env ``HUNINN_TTF``（預設 ``/tmp/huninn.ttf``），
  輸出 ``app/fonts/huninn-subset.woff2``。
- gensen-rounded-tw-bold（源泉圓體 TW Bold）：中文標題真字重。來源 env
  ``GENSEN_BOLD_OTF``（預設 ``/tmp/GenSenRounded2TW-B.otf``），輸出
  ``app/fonts/gensen-rounded-tw-bold-subset.woff2``。

拉丁字母與數字交給 Fredoka（``next/font`` 字型堆疊在前），所以這裡只留非 ASCII。

來源字元：掃描 data / app / components / lib 下的 .ts/.tsx，以及 data/ 下的 .json
（排除不上畫面的 sync／queue／blur JSON）。新增故事或文案後重跑： npm run font:subset
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from typing import TypedDict

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC_DIRS = ["data", "app", "components", "lib"]
CHARSET_FILE = "/tmp/site-charset.txt"
JSON_EXCLUDE = {
    "apple-sync-state.json",
    "apple-sync.defaults.json",
    "illustration-queue.json",
    "story-image-blurs.json",
}


class FontSpec(TypedDict):
    id: str
    src_env: str
    src_default: str
    out_rel: str
    download: str


FONTS: list[FontSpec] = [
    {
        "id": "huninn",
        "src_env": "HUNINN_TTF",
        "src_default": "/tmp/huninn.ttf",
        "out_rel": os.path.join("app", "fonts", "huninn-subset.woff2"),
        "download": (
            "curl -sL https://github.com/justfont/open-huninn-font/releases/"
            "download/v2.1/jf-openhuninn-2.1.ttf -o /tmp/huninn.ttf"
        ),
    },
    {
        "id": "gensen-rounded-tw-bold",
        "src_env": "GENSEN_BOLD_OTF",
        "src_default": "/tmp/GenSenRounded2TW-B.otf",
        "out_rel": os.path.join("app", "fonts", "gensen-rounded-tw-bold-subset.woff2"),
        "download": (
            "curl -sL https://raw.githubusercontent.com/ButTaiwan/gensen-font/"
            "master/otf/TW/GenSenRounded2TW-B.otf -o /tmp/GenSenRounded2TW-B.otf"
        ),
    },
]


def collect_chars() -> set[str]:
    chars: set[str] = set()
    for d in SRC_DIRS:
        base = os.path.join(ROOT, d)
        for dirpath, _, files in os.walk(base):
            for fn in files:
                path = os.path.join(dirpath, fn)
                if fn.endswith((".ts", ".tsx")):
                    pass
                elif d == "data" and fn.endswith(".json") and fn not in JSON_EXCLUDE:
                    pass
                else:
                    continue
                with open(path, encoding="utf-8") as f:
                    for ch in f.read():
                        # 只收非 ASCII（中文字、全形標點）；emoji 不在字型中會被略過
                        if ord(ch) >= 0x80:
                            chars.add(ch)
    return chars


def subset_argv(src: str, charset_file: str, out: str) -> list[str]:
    flags = [
        f"--text-file={charset_file}",
        "--flavor=woff2",
        f"--output-file={out}",
        "--layout-features=kern,liga,calt,palt",
        "--no-hinting",
        "--desubroutinize",
        "--name-IDs=",
        "--notdef-outline",
    ]
    # Homebrew `fonttools` 提供 pyftsubset；系統 python3 沒有 fontTools 模組。
    pyft = shutil.which("pyftsubset")
    if pyft:
        return [pyft, src, *flags]
    return [sys.executable, "-m", "fontTools.subset", src, *flags]


def subset_one(spec: FontSpec, src: str, charset_file: str) -> None:
    out = os.path.join(ROOT, spec["out_rel"])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(subset_argv(src, charset_file, out), check=True)
    size_kb = round(os.path.getsize(out) / 1024, 1)
    print(f"輸出：{out}  ({size_kb} KB)")


def main() -> int:
    missing: list[FontSpec] = []
    resolved: list[tuple[FontSpec, str]] = []
    for spec in FONTS:
        src = os.environ.get(spec["src_env"], spec["src_default"])
        if not os.path.exists(src):
            missing.append(spec)
        else:
            resolved.append((spec, src))

    if missing:
        print("找不到以下字型來源（設對應 env 或依指令下載）。未產生任何子集。")
        for spec in missing:
            print(f"- {spec['id']}: {os.environ.get(spec['src_env'], spec['src_default'])}")
            print(f"  {spec['download']}")
        return 1

    chars = collect_chars()
    with open(CHARSET_FILE, "w", encoding="utf-8") as f:
        f.write("".join(sorted(chars)))

    print(f"子集字元數：{len(chars)}（含標點）")
    print(f"字集：{CHARSET_FILE}")
    for spec, src in resolved:
        subset_one(spec, src, CHARSET_FILE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
