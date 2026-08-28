// @vitest-environment jsdom
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PARENT_GATE_COPY,
  PARENT_GATE_PASSED_VALUE,
  PARENT_GATE_STORAGE_KEY,
  type ParentGateChallenge,
} from "@/lib/parent-gate";

const challenge14x3: ParentGateChallenge = {
  multiplicand: 14,
  multiplier: 3,
  prompt: "14 × 3",
  answer: 42,
};

const challenge19x9: ParentGateChallenge = {
  multiplicand: 19,
  multiplier: 9,
  prompt: "19 × 9",
  answer: 171,
};

const mocks = vi.hoisted(() => ({
  createParentGateChallenge: vi.fn(),
}));

vi.stubGlobal("React", React);

vi.mock("@/lib/parent-gate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/parent-gate")>();
  return {
    ...actual,
    createParentGateChallenge: mocks.createParentGateChallenge,
  };
});

import { ParentGate } from "./ParentGate";

const SECRET = "儀表板祕密內容";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

beforeEach(() => {
  sessionStorage.clear();
  mocks.createParentGateChallenge.mockReset();
  mocks.createParentGateChallenge.mockReturnValue(challenge14x3);
});

describe("ParentGate", () => {
  it("伺服器首屏不渲染 children", () => {
    const html = renderToStaticMarkup(
      <ParentGate>
        <p>{SECRET}</p>
      </ParentGate>,
    );
    expect(html).not.toContain(SECRET);
    expect(html).not.toContain(PARENT_GATE_COPY.title);
  });

  it("未通過時 children 不在 DOM", async () => {
    render(
      <ParentGate>
        <p>{SECRET}</p>
      </ParentGate>,
    );
    expect(screen.queryByText(SECRET)).toBeNull();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: PARENT_GATE_COPY.title }),
      ).toBeTruthy();
    });
    expect(screen.queryByText(SECRET)).toBeNull();
    const input = screen.getByLabelText(`請算出 ${challenge14x3.prompt}`);
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
  });

  it("答對後 children 出現", async () => {
    render(
      <ParentGate>
        <p>{SECRET}</p>
      </ParentGate>,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(`請算出 ${challenge14x3.prompt}`)).toBeTruthy();
    });
    fireEvent.change(screen.getByLabelText(`請算出 ${challenge14x3.prompt}`), {
      target: { value: "42" },
    });
    fireEvent.click(screen.getByRole("button", { name: PARENT_GATE_COPY.submit }));
    expect(screen.getByText(SECRET)).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: PARENT_GATE_COPY.title }),
    ).toBeNull();
  });

  it("答錯後題目改變且 children 仍不在 DOM", async () => {
    mocks.createParentGateChallenge
      .mockReturnValueOnce(challenge14x3)
      .mockReturnValueOnce(challenge19x9);
    render(
      <ParentGate>
        <p>{SECRET}</p>
      </ParentGate>,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(`請算出 ${challenge14x3.prompt}`)).toBeTruthy();
    });
    fireEvent.change(screen.getByLabelText(`請算出 ${challenge14x3.prompt}`), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: PARENT_GATE_COPY.submit }));
    expect(screen.queryByText(SECRET)).toBeNull();
    expect(screen.getByLabelText(`請算出 ${challenge19x9.prompt}`)).toBeTruthy();
    expect(screen.queryByLabelText(`請算出 ${challenge14x3.prompt}`)).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe(PARENT_GATE_COPY.retry);
  });

  it("sessionStorage 拋錯時仍出題，不放行", async () => {
    const exploding = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
      clear: () => {
        throw new Error("denied");
      },
    };
    vi.stubGlobal("sessionStorage", exploding);
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: exploding,
    });

    render(
      <ParentGate>
        <p>{SECRET}</p>
      </ParentGate>,
    );
    expect(screen.queryByText(SECRET)).toBeNull();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: PARENT_GATE_COPY.title }),
      ).toBeTruthy();
    });
    expect(screen.queryByText(SECRET)).toBeNull();

    vi.unstubAllGlobals();
    vi.stubGlobal("React", React);
  });

  it("session 已通過則直接放行", async () => {
    sessionStorage.setItem(PARENT_GATE_STORAGE_KEY, PARENT_GATE_PASSED_VALUE);
    render(
      <ParentGate>
        <p>{SECRET}</p>
      </ParentGate>,
    );
    await waitFor(() => {
      expect(screen.getByText(SECRET)).toBeTruthy();
    });
    expect(
      screen.queryByRole("heading", { name: PARENT_GATE_COPY.title }),
    ).toBeNull();
  });
});
