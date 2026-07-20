import { describe, expect, it } from "vitest";
import { allVehicles, getStoriesByVehicle } from "@/data/content";
import { vehicleDefinitionSummary, vehicleFaqs } from "./vehicle-geo";

describe("vehicleDefinitionSummary", () => {
  it("每個車種產生含集數與代表例子的導言", () => {
    const summaries = new Set<string>();
    for (const vehicle of allVehicles()) {
      const stories = getStoriesByVehicle(vehicle);
      const summary = vehicleDefinitionSummary(vehicle, stories);

      expect(summary, vehicle).toContain(vehicle);
      expect(summary, vehicle).toContain(String(stories.length));
      expect(summary, vehicle).toContain("EP ");
      summaries.add(summary);
    }
    expect(summaries.size).toBeGreaterThan(1);
  });
});

describe("vehicleFaqs", () => {
  it("每個車種產生 3 題 FAQ", () => {
    const vehicle = allVehicles()[0];
    const stories = getStoriesByVehicle(vehicle);
    const faqs = vehicleFaqs(vehicle, stories);

    expect(faqs).toHaveLength(3);
    expect(faqs[0].question).toContain(vehicle);
    expect(faqs.every((faq) => faq.question && faq.answer)).toBe(true);
  });
});
