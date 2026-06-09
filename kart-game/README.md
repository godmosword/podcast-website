# 車車卡丁車（cheche-kart）

原創 arcade 卡丁車：漂移手感優先，Vite + TypeScript + Three.js。

## 開發

```bash
cd kart-game
npm install
npm run dev
```

開啟 http://localhost:5174/kart/

## 建置（嵌入故事屋 `public/kart/`）

```bash
npm run build
```

產出至 `../public/kart/`，由 Next.js 靜態提供，或獨立部署至 subdomain。

## 路線圖

- **P0** ✅ Scaffold：平面／spline 練習道、方塊車、跟隨相機、kinematic WASD
- **P1** 漂移手感調校 + 煙霧 FX
- **P2** 完整檢查點／圈速
- **P3** AI 對手 + 結算
- **P4** GLB 美術 + 音效 + 車庫
- **P5** 觸控打磨
- **P6** 多人（選配）

## IP

僅使用車車故事屋原創卡司與類型機制；不得使用任天堂等第三方識別元素。
