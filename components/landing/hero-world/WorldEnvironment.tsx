import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  PMREMGenerator,
  SRGBColorSpace,
} from "three";
import { WORLD_LIGHT } from "./art-direction";

/**
 * 程序式環境光。
 *
 * 場景之前只有 hemisphere + 一盞平行光、metallic 全 0、無貼圖，所以除了幾何
 * 形狀之外表面沒有任何資訊——這正是它看起來比平面黏土圖「乾」的主因。一張
 * 天空→地面的漸層 equirect 經 PMREM 之後就能給曲面方向性的柔反射，成本是
 * 一張 16×128 的 canvas，沒有外部 HDRI、沒有新增相依。
 */
function gradientTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, WORLD_LIGHT.sky);
    gradient.addColorStop(0.55, WORLD_LIGHT.horizon);
    gradient.addColorStop(1, WORLD_LIGHT.ground);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new CanvasTexture(canvas);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export default function WorldEnvironment({ intensity }: { intensity: number }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const source = gradientTexture();
    const target = generator.fromEquirectangular(source);
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;
    invalidate();
    // 五次進出不得累積資源（PLAN F11）：PMREM、render target 與來源貼圖都要收。
    return () => {
      scene.environment = null;
      target.dispose();
      source.dispose();
      generator.dispose();
    };
  }, [gl, scene, intensity, invalidate]);

  return null;
}
