import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUBSCRIBE_HONESTY_NEEDLE,
  SUBSCRIBE_NO_EPISODE_MAIL_NEEDLE,
  SUBSCRIBE_PAGE_LEDE,
  SUBSCRIBE_PRIVACY_NOTE,
  SUBSCRIBE_SUBMIT_LABEL,
  SUBSCRIBE_SUCCESS,
} from "./subscribe-copy";

describe("subscribe copy honesty", () => {
  it("頁面導言與表單都寫明只收名單、不寄新集上線信", () => {
    expect(SUBSCRIBE_PAGE_LEDE).toContain(SUBSCRIBE_HONESTY_NEEDLE);
    expect(SUBSCRIBE_PAGE_LEDE).toContain(SUBSCRIBE_NO_EPISODE_MAIL_NEEDLE);
    expect(SUBSCRIBE_PRIVACY_NOTE).toContain(SUBSCRIBE_HONESTY_NEEDLE);
    expect(SUBSCRIBE_SUCCESS).toContain("尚未寄發新集上線通知");
    expect(SUBSCRIBE_SUBMIT_LABEL).toBe("加入通知名單");
  });

  it("legal／DISCLAIMER 同步誠實聲明（用途變更須對齊三份政策）", () => {
    const legal = readFileSync(
      join(process.cwd(), "app/legal/page.tsx"),
      "utf8",
    );
    const disclaimer = readFileSync(
      join(process.cwd(), "DISCLAIMER.md"),
      "utf8",
    );
    expect(legal).toContain("目前尚未寄發新集上線通知或電子報");
    expect(legal).toContain("同意留痕");
    expect(disclaimer).toContain("目前不寄新集上線通知或電子報");
    expect(disclaimer).toContain("同意留痕");
  });

  it("確認信本文也寫明只收名單", () => {
    const emailSrc = readFileSync(
      join(process.cwd(), "lib/subscribe-email.ts"),
      "utf8",
    );
    expect(emailSrc).toContain(SUBSCRIBE_HONESTY_NEEDLE);
    expect(emailSrc).toContain(SUBSCRIBE_NO_EPISODE_MAIL_NEEDLE);
  });
});
