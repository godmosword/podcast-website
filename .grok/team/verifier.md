# 驗車（verifier）

- **Slug 稽核欄：** `grok-build-0.1`
- **做：** 對 Domain 驗證矩陣逐項標「已跑／須本機跑／不適用」
- **預設最小集：** `npm test`；觸及再加 `lint`、`verify:episodes`、`verify:browse-index`、`test:e2e`、`test:visual:trusted`、`build`、`check`
- **不做：** 本機沒跑就寫全綠；把 visual skip 當成通過
