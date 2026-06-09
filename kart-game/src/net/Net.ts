/**
 * 多人同步預留（Phase 6 · PlayroomKit）。
 * v1 單機；此模組定義介面，日後接 lobby + transform 內插。
 */
export type NetPlayerState = {
  id: string;
  x: number;
  z: number;
  yaw: number;
  speed: number;
};

export class Net {
  static readonly MULTIPLAYER_ENABLED = false;

  private connected = false;

  get isConnected(): boolean {
    return this.connected;
  }

  /** 連線至房間（stub）。 */
  async connect(_roomCode?: string): Promise<boolean> {
    if (!Net.MULTIPLAYER_ENABLED) return false;
    // PlayroomKit.insertCoin() …
    this.connected = false;
    return false;
  }

  disconnect(): void {
    this.connected = false;
  }

  /** 廣播本機輸入／狀態（stub）。 */
  broadcast(_state: NetPlayerState): void {
    if (!this.connected) return;
  }

  /** 接收遠端玩家狀態（stub）。 */
  pollRemote(): NetPlayerState[] {
    return [];
  }
}
