import styles from "./RoamerGreeting.module.css";

type Props = {
  message: string;
  reduced?: boolean;
};

export default function RoamerGreeting({ message, reduced = false }: Props) {
  return (
    <span
      className={`${styles.bubble} ${reduced ? styles.bubbleReduced : ""}`}
      aria-hidden="true"
    >
      {message}
    </span>
  );
}
