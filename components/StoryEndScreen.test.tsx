import React, { type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import StoryEndScreen from "./StoryEndScreen";

vi.stubGlobal("React", React);

type ReflectionProps = ComponentProps<NonNullable<
  ComponentProps<typeof StoryEndScreen>["ReflectionComponent"]
>>;

function FakeReflectionPrompt({ child, parentFollowUp }: ReflectionProps) {
  return (
    <section>
      <h2>一起想想看</h2>
      <p>{child}</p>
      <p>{parentFollowUp}</p>
    </section>
  );
}

const baseProps = {
  slug: "quiet-story",
  title: "安靜聽故事",
  color: "#2f7d58",
  backHref: "/stories",
  onReplay: () => undefined,
  reflectionPrompt: {
    child: "你最喜歡哪一段？",
    parentFollowUp: "睡前可以讓孩子自由說一句就好。",
  },
  ReflectionComponent: FakeReflectionPrompt,
};

describe("StoryEndScreen", () => {
  it("does not mount the reflection prompt by default", () => {
    const html = renderToStaticMarkup(<StoryEndScreen {...baseProps} />);

    expect(html).toContain("故事聽完囉");
    expect(html).toContain("再聽一次");
    expect(html).toContain("回故事屋");
    expect(html).toContain("想聊一下");
    expect(html).not.toContain("一起想想看");
    expect(html).not.toContain("睡前可以讓孩子自由說一句就好。");
  });

  it("can render the reflection prompt only after it is opened", () => {
    const html = renderToStaticMarkup(
      <StoryEndScreen {...baseProps} initialReflectionOpen />,
    );

    expect(html).toContain("一起想想看");
    expect(html).toContain("睡前可以讓孩子自由說一句就好。");
  });
});
