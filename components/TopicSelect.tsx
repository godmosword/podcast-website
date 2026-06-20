"use client";

import FilterSelect, { type FilterSelectOption } from "./FilterSelect";

export const ALL_TOPICS_VALUE = "__all__";
const ALL_LABEL = "全部主題";

const TOPIC_ICONS: Record<string, string> = {
  勇氣: "💪",
  成長: "🌱",
  安全: "🛡️",
  合作: "🤝",
  情緒: "💛",
  守信用: "⭐",
};

function topicIcon(tag: string): string {
  return TOPIC_ICONS[tag] ?? "🏷️";
}

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
      icon: <span aria-hidden>🏷️</span>,
    },
    ...tags.map((tag) => ({
      value: tag,
      label: tag,
      icon: <span aria-hidden>{topicIcon(tag)}</span>,
    })),
  ];

  return (
    <FilterSelect
      options={options}
      value={currentKey}
      onChange={(key) => onChange(key === ALL_TOPICS_VALUE ? null : key)}
      ariaLabel="選擇主題"
      listLabel="主題"
    />
  );
}
