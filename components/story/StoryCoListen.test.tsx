// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getStories } from "@/data/content";
import StoryCoListen, { hasStoryCoListen } from "./StoryCoListen";

vi.stubGlobal("React", React);

afterEach(cleanup);

describe("StoryCoListen", () => {
  const story = getStories().find(
    (entry) => entry.familyActivity && entry.parentGuide && entry.reflectionPrompt,
  )!;

  it("預設展開在本集頁的「給爸媽：一起聊聊」，錨點是 #co-listen", () => {
    const { container } = render(<StoryCoListen story={story} />);
    const details = container.querySelector("details#co-listen");
    expect(details).toBeTruthy();
    expect(details?.hasAttribute("open")).toBe(true);
    expect(screen.getAllByText("給爸媽：一起聊聊")).toHaveLength(1);
    expect(container.textContent).toContain(story.reflectionPrompt!.child);
    expect(container.textContent).toContain(story.reflectionPrompt!.parentFollowUp);
  });

  it("沒有共讀內容的集數不渲染", () => {
    const bare = { ...story, familyActivity: undefined, parentGuide: undefined, reflectionPrompt: undefined };
    expect(hasStoryCoListen(bare)).toBe(false);
    const { container } = render(<StoryCoListen story={bare} />);
    expect(container.innerHTML).toBe("");
  });
});
