export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("作品圖片無法產生"))),
      "image/png",
    ),
  );
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
