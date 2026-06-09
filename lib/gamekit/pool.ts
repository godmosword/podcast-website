/** 泛用物件池，減少遊戲執行期配置（Phase 8）。 */
export class ObjectPool<T> {
  private free: T[] = [];

  constructor(
    private readonly factory: () => T,
    private readonly reset: (item: T) => void,
    initialSize = 0,
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.free.push(factory());
    }
  }

  acquire(): T {
    return this.free.pop() ?? this.factory();
  }

  release(item: T): void {
    this.reset(item);
    this.free.push(item);
  }

  get size(): number {
    return this.free.length;
  }

  clear(): void {
    this.free.length = 0;
  }
}
