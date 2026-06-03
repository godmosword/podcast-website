import styles from "./StoryAge.module.css";

type StoryAgeProps = {
  ageRange?: string;
  className?: string;
};

/** 年齡建議標示；未填 ageRange 時不渲染。 */
export default function StoryAge({ ageRange, className = "" }: StoryAgeProps) {
  if (!ageRange?.trim()) return null;

  return (
    <span className={`${styles.age} ${className}`.trim()} title="建議年齡">
      {ageRange}
    </span>
  );
}
