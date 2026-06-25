"use client";

import VehicleClayIcon from "./VehicleClayIcon";
import FilterSelect, { type FilterSelectOption } from "./FilterSelect";

const ALL_VEHICLES_VALUE = "__all__";
const ALL_LABEL = "全部車車";

type VehicleSelectProps = {
  vehicles: string[];
  value: string | null;
  onChange: (vehicle: string | null) => void;
};

export default function VehicleSelect({
  vehicles,
  value,
  onChange,
}: VehicleSelectProps) {
  const currentKey = value ?? ALL_VEHICLES_VALUE;

  const options: FilterSelectOption[] = [
    {
      value: ALL_VEHICLES_VALUE,
      label: ALL_LABEL,
      icon: <span aria-hidden>🚗</span>,
    },
    ...vehicles.map((v) => ({
      value: v,
      label: v,
      icon: <VehicleClayIcon vehicle={v} size={26} />,
    })),
  ];

  return (
    <FilterSelect
      options={options}
      value={currentKey}
      onChange={(key) =>
        onChange(key === ALL_VEHICLES_VALUE ? null : key)
      }
      ariaLabel="選擇車車"
      listLabel="車車"
    />
  );
}
