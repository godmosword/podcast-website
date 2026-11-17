import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export type ReleaseAsset = { path: string; sha256: string };

/** 目錄內每個檔的 sha256。路徑相對於 repo root，使用 /。 */
export function hashTree(root: string, dir: string): ReleaseAsset[] {
  const abs = join(root, dir);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) return [];
  const out: ReleaseAsset[] = [];

  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      const stat = statSync(path);
      if (stat.isDirectory()) {
        walk(path);
        continue;
      }
      if (!stat.isFile()) continue;
      const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
      out.push({ path: relative(root, path).split("\\").join("/"), sha256 });
    }
  };

  walk(abs);
  out.sort((left, right) => left.path.localeCompare(right.path));
  return out;
}
