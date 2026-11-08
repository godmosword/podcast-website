import type { GameSessionResult } from "@/lib/gamekit/progress/session";

type Send = ((result: GameSessionResult) => void) | undefined;

/**
 * 一局的結算回報先排進來再寫。寫不進去（localStorage 滿了）不丟例外：
 * 留著等「再存一次」或下一局存得進去時照順序補寫；寫好的那筆就移掉，不會重複發獎。
 * 每局只回報一次的去重仍由各 adapter 負責。
 *
 * 重送同一筆必須安全：reportGameSession 的寫入都是冪等的（獎牌 OR 進去、星星按 id 記帳、
 * 貼紙只發一次）；中途丟例外時，丟例外那一步之後的寫入要到重送才第一次發生。
 */
export class SessionOutbox {
  private pending: readonly GameSessionResult[] = [];

  constructor(private readonly send: Send) {}

  /** 排進去並試著寫出全部；全部寫好回傳 true。 */
  push(result: GameSessionResult): boolean {
    this.pending = [...this.pending, result];
    return this.flush();
  }

  /** 把排著的照順序寫出；寫到一半失敗就停，回傳 false。 */
  flush(): boolean {
    while (this.pending.length > 0) {
      try {
        this.send?.(this.pending[0]!);
      } catch {
        return false;
      }
      this.pending = this.pending.slice(1);
    }
    return true;
  }

  hasPending(): boolean {
    return this.pending.length > 0;
  }
}
