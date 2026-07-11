import DuduMoment from "@/components/dudu/DuduMoment";
import styles from "./NotFoundHero.module.css";

/** 404 頁嘟嘟裝飾（server 可渲染的靜態區塊）。 */
export default function NotFoundHero() {
  return (
    <DuduMoment
      variant="inline"
      emotion="surprised"
      label="找不到這裡"
      className={styles.hero}
    />
  );
}
