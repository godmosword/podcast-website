import { beforeEach, describe, expect, it } from "vitest";
import {
  EXIT_TRANSITION_MS,
  consumeEnterIntent,
  hasHandledEntryFocus,
  markEnterIntent,
  markEntryFocusHandled,
  resetEnterTransitionState,
  resolveEnterAction,
  shouldFocusLandingMain,
  type EnterActivation,
} from "./enter-transition";

const primaryClick: EnterActivation = {
  button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
  ready: true, eligible: true, failed: false, reducedMotion: false, navigating: false,
};

beforeEach(() => {
  resetEnterTransitionState();
});

describe("resolveEnterAction: Enter works from every moment of the intro", () => {
  it("plays the exit transition only when a live scene is on screen", () => {
    expect(resolveEnterAction(primaryClick)).toBe("transition");
  });

  it.each([
    ["poster (scene not ready yet)", { ready: false }],
    ["loading (eligible but still fetching)", { ready: false, eligible: true }],
    ["fallback (WebGL or model failed)", { failed: true }],
    ["ineligible (Save-Data, 2G, kill switch)", { eligible: false }],
    ["reduced motion", { reducedMotion: true }],
  ])("navigates straight to Landing during %s", (_label, overrides) => {
    // No camera push, no fade, and above all no waiting for WebGL.
    expect(resolveEnterAction({ ...primaryClick, ...overrides })).toBe("direct");
  });

  it("still enters while the journey is paused", () => {
    // Pausing only stops motion; the scene is ready, so the exit still animates.
    expect(resolveEnterAction({ ...primaryClick, ready: true })).toBe("transition");
  });

  it.each([
    ["middle click", { button: 1 }],
    ["right click", { button: 2 }],
    ["cmd click", { metaKey: true }],
    ["ctrl click", { ctrlKey: true }],
    ["shift click", { shiftKey: true }],
    ["alt click (download)", { altKey: true }],
  ])("leaves %s to the native link", (_label, overrides) => {
    expect(resolveEnterAction({ ...primaryClick, ...overrides })).toBe("native");
    // Even from a fallback state the native semantics win.
    expect(resolveEnterAction({ ...primaryClick, ...overrides, failed: true })).toBe("native");
  });

  it("swallows a second activation instead of navigating twice", () => {
    expect(resolveEnterAction({ ...primaryClick, navigating: true })).toBe("ignore");
    expect(resolveEnterAction({ ...primaryClick, navigating: true, ready: false })).toBe("ignore");
  });

  it("lets a modifier click through even while a navigation is running", () => {
    // The running transition belongs to this tab; opening a new tab must not be eaten.
    expect(resolveEnterAction({ ...primaryClick, navigating: true, metaKey: true })).toBe("native");
  });

  it("caps the decorative transition at 360ms", () => {
    expect(EXIT_TRANSITION_MS).toBeLessThanOrEqual(360);
  });
});

describe("enter intent is per tab and single use", () => {
  it("is empty until Enter or Skip is activated", () => {
    expect(consumeEnterIntent()).toBe(false);
  });

  it("is consumed exactly once", () => {
    markEnterIntent();
    expect(consumeEnterIntent()).toBe(true);
    expect(consumeEnterIntent()).toBe(false);
  });
});

describe("shouldFocusLandingMain", () => {
  const base = { fromIntro: false, search: "", navigationType: "navigate", documentHandled: false };

  it("moves focus after an enhanced entry from the intro", () => {
    expect(shouldFocusLandingMain({ ...base, fromIntro: true })).toBe(true);
  });

  it("moves focus for the no-JS entry URL", () => {
    expect(shouldFocusLandingMain({ ...base, search: "?enter=1" })).toBe(true);
  });

  it("leaves a plain Landing visit alone", () => {
    expect(shouldFocusLandingMain(base)).toBe(false);
    expect(shouldFocusLandingMain({ ...base, search: "?enter=0" })).toBe(false);
    expect(shouldFocusLandingMain({ ...base, search: "?utm_source=podcast" })).toBe(false);
  });

  it("never steals focus on Back/Forward restore", () => {
    expect(shouldFocusLandingMain({ ...base, search: "?enter=1", navigationType: "back_forward" })).toBe(false);
  });

  it("still honours the intent when Back happens to be the document's load type", () => {
    // The in-memory intent can only exist because this tab just clicked Enter.
    expect(shouldFocusLandingMain({ ...base, fromIntro: true, navigationType: "back_forward" })).toBe(true);
  });

  it("focuses at most once per document", () => {
    expect(shouldFocusLandingMain({ ...base, fromIntro: true, documentHandled: true })).toBe(false);
    expect(shouldFocusLandingMain({ ...base, search: "?enter=1", documentHandled: true })).toBe(false);
  });

  it("tracks the once-per-document flag", () => {
    expect(hasHandledEntryFocus()).toBe(false);
    markEntryFocusHandled();
    expect(hasHandledEntryFocus()).toBe(true);
  });
});
