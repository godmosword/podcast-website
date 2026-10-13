import type { ReactNode } from "react";
import { DuoDuoArt, type DuoDuoFace, type DuoDuoMouth, type DuoDuoPose, type DuoDuoView } from "./duoduo-art";
import styles from "./duoduo-sheet.module.css";

/**
 * 多多角色表：正面、3/4、側面；六個表情；三個姿勢。
 * 局內遊戲不引用這份，給美術對稿用。表情名稱是圖說，不畫進角色裡。
 */

const ANGLES: Array<{ label: string; view: DuoDuoView }> = [
  { label: "正面", view: "front" },
  { label: "四分之三", view: "three-quarter" },
  { label: "側面", view: "side" },
];

const EXPRESSIONS: Array<{ label: string; face: DuoDuoFace; mouth: DuoDuoMouth }> = [
  { label: "開心", face: "idle", mouth: "closed" },
  { label: "好吃", face: "yum", mouth: "chew" },
  { label: "驚訝", face: "look", mouth: "open" },
  { label: "辣辣", face: "puff", mouth: "laugh" },
  { label: "喜歡", face: "love", mouth: "closed" },
  { label: "想睡", face: "sleepy", mouth: "closed" },
];

const POSES: Array<{ label: string; pose: DuoDuoPose; face: DuoDuoFace; mouth: DuoDuoMouth }> = [
  { label: "站好", pose: "idle", face: "idle", mouth: "closed" },
  { label: "吃東西", pose: "eat", face: "yum", mouth: "open" },
  { label: "休息", pose: "rest", face: "sleepy", mouth: "closed" },
];

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className={styles.cell}>
      {children}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export function DuoDuoSheet() {
  return (
    <div className={styles.sheet}>
      <section className={styles.block} aria-label="角度">
        <h2>角度</h2>
        <div className={styles.row}>
          {ANGLES.map((item) => (
            <Cell key={item.view} label={item.label}>
              <DuoDuoArt view={item.view} face="idle" mouth="closed" animate={false} />
            </Cell>
          ))}
        </div>
      </section>
      <section className={styles.block} aria-label="表情">
        <h2>表情</h2>
        <div className={styles.row}>
          {EXPRESSIONS.map((item) => (
            <Cell key={item.label} label={item.label}>
              <DuoDuoArt view="three-quarter" face={item.face} mouth={item.mouth} animate={false} />
            </Cell>
          ))}
        </div>
      </section>
      <section className={styles.block} aria-label="姿勢">
        <h2>姿勢</h2>
        <div className={styles.row}>
          {POSES.map((item) => (
            <Cell key={item.label} label={item.label}>
              <DuoDuoArt view="three-quarter" pose={item.pose} face={item.face} mouth={item.mouth} animate={false} />
            </Cell>
          ))}
        </div>
      </section>
    </div>
  );
}
