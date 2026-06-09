import * as THREE from "three";

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(62, 1, 0.1, 500);

  constructor(private mount: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.mount.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 60, 140);
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  dispose(): void {
    window.removeEventListener("resize", this.resize);
    this.renderer.dispose();
    this.mount.removeChild(this.renderer.domElement);
  }

  private resize = (): void => {
    const w = this.mount.clientWidth;
    const h = this.mount.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
  };

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
