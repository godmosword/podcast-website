import { useEffect, useState } from "react";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { Mesh, type BufferGeometry, type Material, Texture } from "three";
import { MODEL_PATH } from "./config";

export type WorldAssets = { environment: GLTF; vehicle: GLTF; tree: GLTF };

/** 每次掛載持有資源；離頁中止請求，包含延遲完成的解析也會釋放。 */
export function useWorldAssets(onFailure: () => void) {
  const [assets, setAssets] = useState<WorldAssets | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const owned: GLTF[] = [];
    const dispose = (gltf: GLTF) => {
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      const textures = new Set<Texture>();
      gltf.scene.traverse(object => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => {
        Object.values(m).forEach(value => { if (value instanceof Texture) textures.add(value); });
        m.dispose();
      });
      textures.forEach(t => t.dispose());
    };
    const load = async (name: string) => {
      const response = await fetch(`${MODEL_PATH}/${name}.glb`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Hero model ${response.status}`);
      const bytes = await response.arrayBuffer();
      // A service worker or CDN can return an HTML fallback with status 200.
      // Reject it before GLTFLoader allocates parser state and keep the poster
      // visible as the intentional fallback.
      const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 4));
      if (header.length !== 4 || header[0] !== 0x67 || header[1] !== 0x6c || header[2] !== 0x54 || header[3] !== 0x46) {
        throw new Error("Hero model is not a GLB binary");
      }
      const result = await new GLTFLoader().parseAsync(bytes, `${MODEL_PATH}/`);
      if (controller.signal.aborted) { dispose(result); throw new DOMException("Aborted", "AbortError"); }
      owned.push(result);
      return result;
    };
    void (async () => {
      const environment = await load("environment");
      const [vehicle, tree] = await Promise.all([load("little-red"), load("tree")]);
      if (!controller.signal.aborted) setAssets({ environment, vehicle, tree });
    })().catch(() => { if (!controller.signal.aborted) onFailure(); });
    return () => { controller.abort(); owned.forEach(dispose); };
    // 回呼由 Scene 中的 ref 穩定提供；重繪不重複下載。
  }, [onFailure]);
  return assets;
}
