// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { CandyMatchTitleSteps } from "./CandyMatchTitleSteps";
afterEach(cleanup);
test("three ordered steps read only their short verbs; artwork stays decorative", () => {
  render(<CandyMatchTitleSteps />);
  const list = screen.getByRole("list", { name: "玩法三步驟" });
  expect(list.tagName).toBe("OL");
  const items = within(list).getAllByRole("listitem");
  expect(items.map((li) => li.textContent)).toEqual(["找一找", "排一排", "消一消"]);
  for (const svg of list.querySelectorAll("svg"))
    expect(svg.closest("[aria-hidden]")).not.toBeNull();
});
