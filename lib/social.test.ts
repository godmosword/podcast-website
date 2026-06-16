import { describe, expect, it } from "vitest";
import { visibleSocials } from "./social";

describe("visibleSocials", () => {
  it("includes the contact email in follow links", () => {
    const email = visibleSocials().find((social) => social.label === "Email");

    expect(email).toMatchObject({
      url: "mailto:bonboncarstory@gmail.com",
      icon: "email",
    });
  });
});
