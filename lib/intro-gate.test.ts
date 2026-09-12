// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  INTRO_GATE_ATTRIBUTE,
  INTRO_GATE_INERT_MARK,
  INTRO_GATE_INERT_SCRIPT,
  INTRO_GATE_INIT_SCRIPT,
  INTRO_GATE_ON,
  INTRO_GATE_STORAGE_KEY,
  INTRO_PORTAL_ENABLED,
  dismissIntroGate,
  evaluateIntroGate,
  isIntroGateOpen,
  reopenIntroGate,
  sealIntroBackground,
  shouldOpenIntroGate,
  shouldReplayIntroOverlay,
  type IntroGateInput,
} from "./intro-gate";

const base: IntroGateInput = {
  pathname: "/",
  search: "",
  seen: false,
  reducedMotion: false,
  saveData: false,
  effectiveType: "4g",
  heroDisabled: false,
};

describe("shouldOpenIntroGate", () => {
  it("產品關掉開場時一律不打開", () => {
    expect(INTRO_PORTAL_ENABLED).toBe(false);
    expect(shouldOpenIntroGate(base)).toBe(false);
    expect(shouldOpenIntroGate({ ...base, seen: true })).toBe(false);
    expect(shouldOpenIntroGate({ ...base, search: "?enter=1" })).toBe(false);
  });
});

describe("evaluateIntroGate", () => {
  it("只在首次進首頁時打開", () => {
    expect(evaluateIntroGate(base)).toBe(true);
    expect(evaluateIntroGate({ ...base, seen: true })).toBe(false);
    expect(evaluateIntroGate({ ...base, pathname: "/stories" })).toBe(false);
  });

  it("尊重使用者已表達的限制偏好——這正是 ADR-0003 指出舊自動導向的核心缺陷", () => {
    expect(evaluateIntroGate({ ...base, reducedMotion: true })).toBe(false);
    expect(evaluateIntroGate({ ...base, saveData: true })).toBe(false);
    expect(evaluateIntroGate({ ...base, effectiveType: "2g" })).toBe(false);
    expect(evaluateIntroGate({ ...base, effectiveType: "slow-2g" })).toBe(false);
    expect(evaluateIntroGate({ ...base, effectiveType: "3g" })).toBe(true);
  });

  it("?enter=1 是已表達的進站意圖，不再攔一次", () => {
    expect(evaluateIntroGate({ ...base, search: "?enter=1" })).toBe(false);
    expect(evaluateIntroGate({ ...base, search: "?enter=0" })).toBe(true);
  });

  it("部署層關掉 3D 時完全不出現", () => {
    expect(evaluateIntroGate({ ...base, heroDisabled: true })).toBe(false);
  });
});

/**
 * init script 是字串，純函式是 TypeScript——兩份實作會漂移。這組測試在 jsdom
 * 裡真的執行那支 script，逐一比對它與純函式的判斷。
 */
describe("INTRO_GATE_INIT_SCRIPT 與純函式一致", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(INTRO_GATE_ATTRIBUTE);
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  const run = (input: Omit<IntroGateInput, "heroDisabled">) => {
    history.replaceState(null, "", `${input.pathname}${input.search}`);
    if (input.seen) sessionStorage.setItem(INTRO_GATE_STORAGE_KEY, "1");
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query.includes("reduced-motion") ? input.reducedMotion : false,
      media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList);
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: input.saveData, effectiveType: input.effectiveType },
    });
    new Function(INTRO_GATE_INIT_SCRIPT)();
    return isIntroGateOpen();
  };

  const cases: Array<Omit<IntroGateInput, "heroDisabled">> = [
    base,
    { ...base, seen: true },
    { ...base, pathname: "/stories" },
    { ...base, reducedMotion: true },
    { ...base, saveData: true },
    { ...base, effectiveType: "2g" },
    { ...base, effectiveType: "slow-2g" },
    { ...base, search: "?enter=1" },
  ];

  for (const input of cases) {
    it(`${input.pathname}${input.search} seen=${input.seen} rm=${input.reducedMotion} save=${input.saveData} net=${input.effectiveType}`, () => {
      expect(run(input)).toBe(evaluateIntroGate({ ...input, heroDisabled: false }));
    });
  }

  it("storage 讀取丟例外時 fail-safe：不打開、也不讓首頁壞掉", () => {
    history.replaceState(null, "", "/");
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList);
    // 真實情況（Safari 無痕、封鎖 cookie）是「存取 sessionStorage 本身就丟」，
    // 不是某個方法丟，所以測試也要在同一層模擬。
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() { throw new DOMException("blocked", "SecurityError"); },
    });
    try {
      expect(() => new Function(INTRO_GATE_INIT_SCRIPT)()).not.toThrow();
      expect(isIntroGateOpen()).toBe(false);
    } finally {
      if (original) Object.defineProperty(window, "sessionStorage", original);
    }
  });
});

describe("dismissIntroGate", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(INTRO_GATE_ATTRIBUTE);
    document.body.innerHTML = "";
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("移屬性、記住這個分頁、並把 Landing 交還給鍵盤", () => {
    document.documentElement.setAttribute(INTRO_GATE_ATTRIBUTE, INTRO_GATE_ON);
    document.body.innerHTML = `<main data-landing-root inert ${INTRO_GATE_INERT_MARK}></main>`;
    dismissIntroGate();
    expect(isIntroGateOpen()).toBe(false);
    expect(document.querySelector("[data-landing-root]")?.hasAttribute("inert")).toBe(false);
    expect(sessionStorage.getItem(INTRO_GATE_STORAGE_KEY)).toBe("1");
  });

  it("storage 寫入失敗時仍然關得掉", () => {
    document.documentElement.setAttribute(INTRO_GATE_ATTRIBUTE, INTRO_GATE_ON);
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() { throw new DOMException("blocked", "SecurityError"); },
    });
    try {
      expect(() => dismissIntroGate()).not.toThrow();
      expect(isIntroGateOpen()).toBe(false);
    } finally {
      if (original) Object.defineProperty(window, "sessionStorage", original);
    }
  });
});

describe("shouldReplayIntroOverlay", () => {
  it("一般主鍵點擊才攔截成同頁重開", () => {
    const click = {
      heroDisabled: false,
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    };
    expect(shouldReplayIntroOverlay(click)).toBe(true);
    expect(shouldReplayIntroOverlay({ ...click, heroDisabled: true })).toBe(false);
    expect(shouldReplayIntroOverlay({ ...click, metaKey: true })).toBe(false);
    expect(shouldReplayIntroOverlay({ ...click, ctrlKey: true })).toBe(false);
    expect(shouldReplayIntroOverlay({ ...click, shiftKey: true })).toBe(false);
    expect(shouldReplayIntroOverlay({ ...click, button: 1 })).toBe(false);
  });
});

describe("reopenIntroGate", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(INTRO_GATE_ATTRIBUTE);
    document.body.innerHTML = "";
    sessionStorage.clear();
  });

  const chrome = (withOverlay = true) => {
    document.body.innerHTML = `
      <a class="skip-link" href="#main-content">跳到主內容</a>
      <nav data-testid="site-nav-bar"></nav>
      <div id="main-content">
        ${withOverlay ? '<div data-intro-overlay></div>' : ""}
        <main data-landing-root></main>
      </div>`;
  };

  it("即使這個分頁已經看過，仍打開閘門並封住 Landing、不封頂欄", () => {
    chrome();
    sessionStorage.setItem(INTRO_GATE_STORAGE_KEY, "1");
    reopenIntroGate();
    expect(isIntroGateOpen()).toBe(true);
    expect(sessionStorage.getItem(INTRO_GATE_STORAGE_KEY)).toBe("1");
    expect(document.querySelector("[data-landing-root]")?.hasAttribute("inert")).toBe(true);
    expect(document.querySelector(".skip-link")?.hasAttribute("inert")).toBe(true);
    expect(document.querySelector("[data-testid='site-nav-bar']")?.hasAttribute("inert")).toBe(false);
    expect(document.querySelector("[data-intro-overlay]")?.hasAttribute("inert")).toBe(false);
  });

  it("覆蓋層還沒掛上時仍打開閘門，seal 是 no-op", () => {
    chrome(false);
    reopenIntroGate();
    expect(isIntroGateOpen()).toBe(true);
    expect(document.querySelector("[data-landing-root]")?.hasAttribute("inert")).toBe(false);
    sealIntroBackground();
    expect(document.querySelector("[data-landing-root]")?.hasAttribute("inert")).toBe(false);
  });
});

describe("INTRO_GATE_INERT_SCRIPT", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(INTRO_GATE_ATTRIBUTE);
    document.body.innerHTML = "";
    sessionStorage.clear();
  });

  const chrome = () => {
    document.body.innerHTML = `
      <a class="skip-link" href="#main-content">跳到主內容</a>
      <nav data-testid="site-nav-bar"></nav>
      <div id="main-content">
        <div data-intro-overlay></div>
        <main data-landing-root></main>
      </div>`;
  };

  it("閘門開著才封住覆蓋層以外的節點", () => {
    chrome();
    new Function(INTRO_GATE_INERT_SCRIPT)();
    expect(document.querySelector("[data-landing-root]")?.hasAttribute("inert")).toBe(false);
    document.documentElement.setAttribute(INTRO_GATE_ATTRIBUTE, INTRO_GATE_ON);
    new Function(INTRO_GATE_INERT_SCRIPT)();
    expect(document.querySelector("[data-landing-root]")?.hasAttribute("inert")).toBe(true);
    // skip link 不在 [data-landing-root] 裡，只擋 Landing 會讓 Tab 跑到背後。
    // 頂欄留下：開場期間訂閱／留言／漢堡要能點。
    expect(document.querySelector(".skip-link")?.hasAttribute("inert")).toBe(true);
    expect(document.querySelector("[data-testid='site-nav-bar']")?.hasAttribute("inert")).toBe(false);
    expect(document.querySelector("[data-intro-overlay]")?.hasAttribute("inert")).toBe(false);
  });

  // hydration 之前覆蓋層的按鈕沒有 React handler；沒有這層保底，慢裝置上會有
  // 一段「蓋著且按不掉」的時間。
  it("Esc 在 hydration 之前就能關掉覆蓋層", () => {
    chrome();
    document.documentElement.setAttribute(INTRO_GATE_ATTRIBUTE, INTRO_GATE_ON);
    new Function(INTRO_GATE_INERT_SCRIPT)();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(isIntroGateOpen()).toBe(false);
    expect(document.querySelector("[data-landing-root]")?.hasAttribute("inert")).toBe(false);
    expect(document.querySelector(".skip-link")?.hasAttribute("inert")).toBe(false);
    expect(sessionStorage.getItem(INTRO_GATE_STORAGE_KEY)).toBe("1");
  });

  it("出口按鈕在 hydration 之前就能關掉覆蓋層", () => {
    document.body.innerHTML = `<div data-intro-overlay><button data-intro-dismiss><span>進入</span></button></div><main data-landing-root></main>`;
    document.documentElement.setAttribute(INTRO_GATE_ATTRIBUTE, INTRO_GATE_ON);
    new Function(INTRO_GATE_INERT_SCRIPT)();
    // 點在按鈕內的 <span> 上，保底必須往上找到帶標記的祖先。
    document.querySelector("span")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(isIntroGateOpen()).toBe(false);
  });
});
