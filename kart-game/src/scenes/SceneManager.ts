export interface GameScene {
  fixedUpdate(dt: number): void;
  render(alpha: number): void;
  dispose(): void;
}

export class SceneManager {
  private current: GameScene | null = null;

  set(scene: GameScene): void {
    this.current?.dispose();
    this.current = scene;
  }

  fixedUpdate(dt: number): void {
    this.current?.fixedUpdate(dt);
  }

  render(alpha: number): void {
    this.current?.render(alpha);
  }

  dispose(): void {
    this.current?.dispose();
    this.current = null;
  }
}
