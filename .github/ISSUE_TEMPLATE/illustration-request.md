---
name: 新集待生圖
description: Apple 同步後多頁黏土風插圖 checklist（通常由 GHA 自動開單）
title: "[illustrate] 新集待生圖：ep-N"
labels:
  - illustration
body:
  - type: markdown
    value: |
      MVP（單圖 + 字幕草稿）應已由 GHA 上線。以下在本機執行，需 `OPENAI_API_KEY`，審圖後才 `--approve`。

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: 抽查站上 /story/ep-N 能播、封面正確
        - label: 校對 data/subtitles/ep-N.json（Bonbon／馬米等人名）
        - label: 確認車種／標籤（必要時 apple-sync.defaults.json overrides）
        - label: npm run illustrate -- ep-N --segment-only
        - label: npm run illustrate -- ep-N
        - label: 審 public/.illustrate-staging/ep-N/contact.html
        - label: npm run illustrate -- ep-N --approve
        - label: npm run sync:apple && npm run build → commit push
