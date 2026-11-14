# Gate 1 腳本審核表（EP4 英文重創）

> 規格：[../SPEC.md](../SPEC.md) §10。流程停點 S1：[../WORKFLOW.md](../WORKFLOW.md)。  
> 全數勾完，且英文名已逐項寫下決定，才可以進 TTS。進 TTS 之前還要另一張花費核准（本表不代替）。

## 結論欄（先填）

| 欄位 | 填寫 |
|---|---|
| 集數 | `ep-4` |
| 腳本檔 | |
| script 版號 | |
| 日期 | |
| 華語審稿者（熟悉原作；不得是寫稿的人） | |
| 英語審稿者（幼兒英語；不得是寫稿的人） | |
| 結果 | 通過／退回修改／否決 |
| Kaiyi 確認 | |

退回或否決時，在文末寫原因。通過時，英文名表每一列都要有「採用拼法」，不能留空。

## 節拍與事實

- [ ] Part 1 清單與 JSON 的 `locked_beats`、`facts_checked` 一致。
- [ ] B1–B15 全部 `covered: true`。沒有被合併或跳過。
- [ ] F1–F10 沒有 violated。故障原因、叫醒順序（先車燈／小紅，再雨刷／安安）、診斷（只是進水）、寓意（守信用）對得上中文時間戳。
- [ ] `summary_zh_review` 寫的是這份英文稿實際在說的事。至少 3 場逐句對過英文。

抽查場次：______、______、______

## 英文名（未定案，本表才鎖定）

採用拼法請 Kaiyi 填。不要沿用提案就當已經決定。

| 項目 | 提案（僅供對照） | 採用拼法 | speaker id 是否維持暫用值 |
|---|---|---|---|
| 鈴鈴清潔車 | Lingling the Street Sweeper | | `lingling` 或改為 `ling-ling`： |
| 小紅賽車 | Ruby the Little Race Car；備案拼音 Xiao Hong | | `ruby` 或改為 `xiao-hong`： |
| 安安救護車 | Andy the Ambulance；備案 An-An | | `andy` 或改為 `an-an`： |
| 黃色計程車 | Sunny the Taxi；或不具名 | | `sunny` 或改為 `huang-ji-cheng`／旁白代述： |
| 站名 | CheChe Playground | | |
| 維修廠叔叔 | Mr. Fix／the Repair Uncle／Uncle Fix | | `mr_fix`： |
| 東東（僅旁白） | Dongdong | | |
| 警車 | the Police Car，不具名 | 維持不具名 | 不得使用亮亮 |

安安若採用 Andy，審稿者已看過 SPEC OD-1 的 canon 摘記（場景用 An An／An-An 與 it；口播「他」不能單獨當性別鎖）：是／否

小紅若採用 Ruby，審稿者已注意這會和中文名、場景裡的 Xiao Hong、id `xiao-hong` 分開：是／否

## 句子與用詞

- [ ] 句長、時態、每場新詞密度符合 SPEC §6。
- [ ] 每行都有 `tts_text`。不覆寫的是空字串。`text` 仍是要給人看的拼法。
- [ ] `vocab_flagged` 每一項已裁決：保留、換詞或刪除。

| 詞 | line_ref | 裁決 |
|---|---|---|
| | | |

## 說話者與禁止項

- [ ] 不確定的 speaker 已逐項確認。
- [ ] 警車沒有被寫成亮亮。維修廠叔叔沒有被加上背景或口頭禪（除非上表核准了功能稱呼）。
- [ ] 沒有新增衝突、反派、遲到受罰、逐字翻譯句序、俚語、雙關、原作沒有的品牌梗。
- [ ] Bonbon 沒有獨立克隆聲線。Pilot 預設由旁白代述開場。
- [ ] AI 標示文案與 toggle 文案已寫下核准句子。

核准的 toggle：

核准的 AI 標示（英文）：

核准的 AI 標示（中文）：

## 結果說明

（通過時可寫「可以進花費核准」。退回時列出要改的 beat／句。否決時寫停止理由。）
