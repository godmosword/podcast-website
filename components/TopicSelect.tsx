"use client";

import FilterSelect, { type FilterSelectOption } from "./FilterSelect";
import TopicIcon from "./TopicIcon";

export const ALL_TOPICS_VALUE = "__all__";
const ALL_LABEL = "全部主題";

type TopicSelectProps = {
  tags: string[];
  value: string | null;
  onChange: (tag: string | null) => void;
};

export default function TopicSelect({ tags, value, onChange }: TopicSelectProps) {
  const currentKey = value ?? ALL_TOPICS_VALUE;

  const options: FilterSelectOption[] = [
    {
      value: ALL_TOPICS_VALUE,
      label: ALL_LABEL,
      icon: <TopicIcon tag={null} />,
    },
    ...tags.map((tag) => ({
      value: tag,
      label: tag,
      icon: <TopicIcon tag={tag} />,
    })),
  ];

  return (
    <FilterSelect
      options={options}
      value={currentKey}
      onChange={(key) => onChange(key === ALL_TOPICS_VALUE ? null : key)}
      ariaLabel="選擇主題"
      listLabel="主題"
      bareIcon
    />
  );
}
