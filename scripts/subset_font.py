#!/usr/bin/env python3
"""把 jf-open 粉圓(huninn) 子集化成「網站實際用到的中文字」woff2。
拉丁字母與數字交給 Baloo 2（字型堆疊在前），所以這裡只留非 ASCII 字元
（中日韓字 + 全形標點；emoji 不在字型內會自動略過）。

來源字元：掃描 data / app / components / lib 下的 .ts/.tsx 文字。
新增故事或文案後，重跑： npm run font:subset
"""
import os
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC_DIRS = ["data", "app", "components", "lib"]
TTF = os.environ.get("HUNINN_TTF", "/tmp/huninn.ttf")
OUT = os.path.join(ROOT, "app", "fonts", "huninn-subset.woff2")
CHARSET_FILE = "/tmp/huninn-charset.txt"


def collect_chars() -> set[str]:
    chars: set[str] = set()
    for d in SRC_DIRS:
        base = os.path.join(ROOT, d)
        for dirpath, _, files in os.walk(base):
            for fn in files:
                if not fn.endswith((".ts", ".tsx")):
                    continue
                with open(os.path.join(dirpath, fn), encoding="utf-8") as f:
                    for ch in f.read():
                        # 只收非 ASCII（中文字、全形標點）；emoji 不在字型中會被略過
                        if ord(ch) >= 0x80:
                            chars.add(ch)
    return chars


def main() -> int:
    if not os.path.exists(TTF):
        print(f"找不到字型來源 {TTF}（設 HUNINN_TTF 或下載至 /tmp/huninn.ttf）")
        return 1

    chars = collect_chars()
    with open(CHARSET_FILE, "w", encoding="utf-8") as f:
        f.write("".join(sorted(chars)))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    cmd = [
        sys.executable, "-m", "fontTools.subset", TTF,
        f"--text-file={CHARSET_FILE}",
        "--flavor=woff2",
        f"--output-file={OUT}",
        "--layout-features=kern,liga,calt,palt",
        "--no-hinting",
        "--desubroutinize",
        "--name-IDs=",
        "--notdef-outline",
    ]
    subprocess.run(cmd, check=True)
    size_kb = round(os.path.getsize(OUT) / 1024, 1)
    print(f"子集字元數：{len(chars)}（含標點）")
    print(f"輸出：{OUT}  ({size_kb} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
