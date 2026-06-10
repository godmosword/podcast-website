import { describe, expect, it } from "vitest";
import { GARAGE_VEHICLES } from "./garage";
import { VEHICLE_ABILITIES, vehicleHasAbility } from "./abilities";

describe("abilities", () => {
  it("VEHICLE_ABILITIES 覆蓋所有車庫車輛", () => {
    for (const v of GARAGE_VEHICLES) {
      expect(VEHICLE_ABILITIES[v.id]).toBeDefined();
    }
  });

  it("vehicleHasAbility 依 gateId 查詢", () => {
    expect(vehicleHasAbility("怪獸卡車", "breakable")).toBe(true);
    expect(vehicleHasAbility("小黃", "breakable")).toBe(false);
  });
});
