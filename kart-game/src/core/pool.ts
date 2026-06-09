/** 泛用物件池（Phase 5 效能）。 */
export class ObjectPool<T> {
  private free: T[] = [];

  constructor(
    private factory: () => T,
    private reset: (item: T) => void,
    initial = 16,
  ) {
    for (let i = 0; i < initial; i++) this.free.push(factory());
  }

  acquire(): T {
    return this.free.pop() ?? this.factory();
  }

  release(item: T): void {
    this.reset(item);
    this.free.push(item);
  }
}
