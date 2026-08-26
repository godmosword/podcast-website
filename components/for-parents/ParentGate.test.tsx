// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ParentGate from "./ParentGate";
import { PARENT_GATE_SESSION_KEY } from "@/lib/parent-gate";

vi.stubGlobal("React", React);

const FIXED_CHALLENGE = {
  a: 8,
  b: 13,
  prompt: "8 + 13",
  answer: 21,
};

describe("ParentGate", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("答對後呼叫 onPass 並寫入 session", async () => {
    const onPass = vi.fn();
    render(
      <ParentGate
        onPass={onPass}
        createChallenge={() => FIXED_CHALLENGE}
      />,
    );

    expect(screen.getByRole("heading", { name: "先確認是家長" })).toBeTruthy();
    const input = await screen.findByLabelText("8 + 13 等於多少？");
    fireEvent.change(input, {
      target: { value: "21" },
    });
    fireEvent.click(screen.getByRole("button", { name: "打開儀表板" }));

    expect(onPass).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(PARENT_GATE_SESSION_KEY)).toBe("1");
  });

  it("答錯顯示提示且不放行", async () => {
    const onPass = vi.fn();
    let calls = 0;
    render(
      <ParentGate
        onPass={onPass}
        createChallenge={() => {
          calls += 1;
          return calls === 1
            ? FIXED_CHALLENGE
            : { a: 7, b: 7, prompt: "7 + 7", answer: 14 };
        }}
      />,
    );

    const input = await screen.findByLabelText("8 + 13 等於多少？");
    fireEvent.change(input, {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "打開儀表板" }));

    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("答案不對");
    expect(screen.getByLabelText("7 + 7 等於多少？")).toBeTruthy();
    expect(sessionStorage.getItem(PARENT_GATE_SESSION_KEY)).toBeNull();
  });
});
