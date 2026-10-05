export function downloadColoringBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function shareColoringBlob(
  blob: Blob,
  name: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], `${name}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: name });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancelled";
    }
  }
  downloadColoringBlob(blob, name);
  return "downloaded";
}
/** Same-origin iframe avoids pop-up blocking; @page and contain preserve the full character. */
export async function printColoringImage(
  source: Blob | string,
  title: string,
): Promise<void> {
  const frame = document.createElement("iframe");
  frame.setAttribute("title", "作品列印");
  frame.style.cssText =
    "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;";
  document.body.append(frame);
  const doc = frame.contentDocument!,
    win = frame.contentWindow!;
  const style = doc.createElement("style");
  style.textContent =
    "@page{size:A4 portrait;margin:15mm}html,body{margin:0}img{display:block;width:100%;height:250mm;object-fit:contain;page-break-inside:avoid}";
  doc.head.append(style);
  doc.title = title;
  const img = doc.createElement("img");
  img.alt = title;
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  img.src = url;
  doc.body.append(img);
  try {
    await img.decode();
    win.addEventListener(
      "afterprint",
      () => {
        frame.remove();
        if (typeof source !== "string") URL.revokeObjectURL(url);
      },
      { once: true },
    );
    win.focus();
    win.print();
  } catch (error) {
    frame.remove();
    if (typeof source !== "string") URL.revokeObjectURL(url);
    throw error;
  }
}
