import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LEGAL_POLICY_VERSION } from "@/lib/legal-policy";

describe("公開留言牆 legal 契約", () => {
  const legal = readFileSync(join(import.meta.dirname, "page.tsx"), "utf8");

  it("政策版本已因留言牆用途 bump，不是沿用 2026-08-26", () => {
    expect(LEGAL_POLICY_VERSION).toBe("2026-09-05");
    expect(LEGAL_POLICY_VERSION).not.toBe("2026-08-26");
  });

  it("有 #guestbook 專章，且許願仍寫明不直接公開", () => {
    expect(legal).toContain('id="guestbook"');
    expect(legal).toContain("公開留言牆");
    expect(legal).toMatch(/許願[\s\S]*不會[\s\S]*直接公開/);
    expect(legal).toContain("/feedback");
    expect(legal).toContain("信箱");
    expect(legal).toMatch(/不會[\s\S]*顯示在公開頁面/);
  });
});
