import { describe, expect, it } from "vitest";
import { visibleNavSocials, visibleSocials } from "./social";

describe("visibleSocials", () => {
  it("includes the contact email in follow links", () => {
    const email = visibleSocials().find((social) => social.label === "Email");

    expect(email).toMatchObject({
      url: "mailto:carcarplayground@gmail.com",
      icon: "email",
    });
  });

  it("頂欄社群不含 Email，頁尾清單仍有", () => {
    expect(visibleNavSocials().some((social) => social.icon === "email")).toBe(
      false,
    );
    expect(visibleNavSocials().map((social) => social.icon)).toEqual([
      "instagram",
      "threads",
      "facebook",
    ]);
    expect(visibleSocials().some((social) => social.icon === "email")).toBe(true);
  });

  it("points Threads and Instagram at the brand handles", () => {
    const threads = visibleSocials().find((social) => social.icon === "threads");
    const instagram = visibleSocials().find((social) => social.icon === "instagram");

    expect(threads?.url).toBe("https://www.threads.com/@carcarplayground");
    expect(instagram?.url).toBe("https://www.instagram.com/carcarplayground");
  });
});
