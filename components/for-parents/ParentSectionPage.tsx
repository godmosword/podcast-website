import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import Icon from "@/components/ui/Icon";
import styles from "./ParentSectionPage.module.css";

export function ParentSectionPage({ title }: { title: string }) {
  return (
    <main className={styles.main}>
      <p className={styles.eyebrow}>給爸媽</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lede}>這一區的內容還在整理。</p>
      <Link href="/for-parents" className={styles.back}>
        <Icon name="arrow-left" size={16} className="icon-lead" />回到親子指南
      </Link>
      <SiteFooter />
    </main>
  );
}
