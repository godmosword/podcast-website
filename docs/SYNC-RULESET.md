# 讓路徑有限的 sync PR 只被 `sync-validate` 擋下來

這份是給 Kaiyi 的操作說明。Cloud agent 改不了 GitHub ruleset，下面每一步都要在網頁上自己按。

## 先知道 UI 做不到什麼

`protect-main-web` 的 required status checks **不能**依檔案路徑分開。

GitHub 的 ruleset 沒有「sync PR 只要 `sync-validate`，人開的 PR 仍要 `quality`、`build-and-public-e2e`、`Vercel`」這種開關。你加上或拿掉的 check，會套在**所有**要進 `main` 的 PR。

不要為了 sync 把 `quality`、`build-and-public-e2e` 或 `Vercel` 從 ruleset 拿掉。拿掉之後，人開的 PR 也不再被那些檢查擋住。

## 這個 repo 已經補上的行為

路徑有限是指：head 分支是 `sync/apple` 或舊的 `sync/apple-<run>`，而且 diff 只在 `data/` 與 `public/stories/`。

- `ci.yml` 有一個 job，名字就是 **`sync-validate`**。`workflow_dispatch` 就算只跑 required checks，這個 job 也會跑。
- 同一個 job 先跑路徑閘門。sync 分支若改到那兩個目錄以外，job 失敗。
- `quality` 和 `build-and-public-e2e` 在確認「這是路徑有限的 sync PR」之後立刻成功，不再跑全站測試、build、Playwright。job 名字不變，ruleset 還是看得到這兩個 context。
- 人開的 PR 不會走這條捷徑，三個 job 都照舊跑完。
- `Vercel` 是 Vercel 自己寫上 commit 的 status，不是這個 repo 的 job。路徑閘門管不到它。sync PR 仍然會等 Vercel 部署成功，ruleset 才放行。

所以合進 main 之後，路徑有限的 sync PR 實際等待的是：很快變綠的 `quality`、很快變綠的 `build-and-public-e2e`、真正檢查同步產物的 `sync-validate`，以及 Vercel。

## 你要在 GitHub 網頁上做的事

先等這幾支 sync PR 合進 `main`，並且 `main` 上的 CI 至少成功跑完一次。ruleset 的搜尋框只列**已經出現過**的 check 名稱。`sync-validate` 沒跑過之前，搜尋框裡不會有它。

1. 打開 [Rulesets](https://github.com/godmosword/podcast-website/settings/rules)。
2. 點 **protect-main-web**，再點 **Edit**。
3. 確認目標分支仍是 `main`。不要改 bypass。現在 bypass 只有 Admin（Repository role）。不要加 GitHub Actions，也不要加 `github-actions[bot]`。個人倉加了也無法讓 `GITHUB_TOKEN` 直推 `main`。
4. 找到 **Require status checks to pass before merging**。這個開關維持打開。
5. 在 “Add checks” 的搜尋框輸入 `sync-validate`。點同名的那一筆，把它加進清單。不要選別的 workflow 名稱。
6. 清單裡必須同時還有這三個，不要刪：
   - `quality`
   - `build-and-public-e2e`
   - `Vercel`
7. 按 **Save changes**。

如果搜尋框沒有 `sync-validate`：

1. 打開 [Actions → CI](https://github.com/godmosword/podcast-website/actions/workflows/ci.yml)。
2. 看 `main` 上最近一次成功的 run，左側 job 列表要有 **sync-validate**。
3. 回到 ruleset 頁面重新整理，再搜一次。

## 不要做的事

- 不要刪 `Vercel`。UI 不能只對 sync PR 豁免它；刪了，所有 PR 都不再等 Vercel。
- 不要再加第二套 ruleset 來「只套在 sync 分支」。ruleset 是看目標分支 `main`，不是看 PR 的 head 分支，也不是看改了哪些檔。
- 不要用 API 或 agent 改這條 ruleset。上面的網頁步驟就是全部。
