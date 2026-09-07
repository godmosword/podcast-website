import { describe, expect, it } from "vitest";
import { shouldInviteToIntro } from "./IntroVisit";

describe("intro visit policy", () => {
  const base = {
    pathname: "/",
    search: "",
    hash: "",
    seen: false,
    online: true,
    historyRestored: false,
  };

  it("invites only a fresh, online, bare home visit", () => {
    expect(shouldInviteToIntro(base)).toBe(true);
    expect(shouldInviteToIntro({ ...base, seen: true })).toBe(false);
    expect(shouldInviteToIntro({ ...base, online: false })).toBe(false);
    expect(shouldInviteToIntro({ ...base, historyRestored: true })).toBe(false);
  });

  it("keeps direct and deep links on their requested content", () => {
    expect(shouldInviteToIntro({ ...base, search: "?enter=1" })).toBe(false);
    expect(shouldInviteToIntro({ ...base, search: "?enter=0" })).toBe(true);
    expect(shouldInviteToIntro({ ...base, hash: "#stories" })).toBe(false);
    expect(shouldInviteToIntro({ ...base, pathname: "/stories" })).toBe(false);
    expect(shouldInviteToIntro({ ...base, pathname: "/intro" })).toBe(false);
  });
});
