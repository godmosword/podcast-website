/** 車輛能力（canonical id 對齊 `lib/gamekit/garage.ts` 中文車名）。 */
export type VehicleAbility = {
  id: string;
  /** Tiled `ability-gate` 物件上的 required ability */
  gateId: string;
  label: string;
};

export const VEHICLE_ABILITIES: Record<string, VehicleAbility[]> = {
  小黃: [],
  怪獸卡車: [{ id: "breakable", gateId: "breakable", label: "撞碎障礙" }],
  小紅賽車: [{ id: "speed", gateId: "speed", label: "加速衝刺" }],
  安安救護車: [{ id: "rescue", gateId: "rescue", label: "溫柔通行" }],
  恐龍車多多: [{ id: "secret", gateId: "secret", label: "發現祕密" }],
};

export function abilitiesForVehicle(vehicleId: string): VehicleAbility[] {
  return VEHICLE_ABILITIES[vehicleId] ?? [];
}

export function vehicleHasAbility(vehicleId: string, gateId: string): boolean {
  return abilitiesForVehicle(vehicleId).some((a) => a.gateId === gateId);
}
