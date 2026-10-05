export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("作品圖片無法產生"))),
      "image/png",
    ),
  );
}
export async function decodeColoringImage(
  src: Blob | string,
): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}
export function composeColoring(
  paint: CanvasImageSource,
  line: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法開啟畫布");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(paint, 0, 0, width, height);
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(line, 0, 0, width, height);
  return canvas;
}
export function thumbnailCanvas(
  source: CanvasImageSource,
  size = 160,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d")!.drawImage(source, 0, 0, size, size);
  return canvas;
}
export function hasColoringPaint(data: Uint8ClampedArray): boolean {
  for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) return true;
  return false;
}
