import type { ReactNode } from "react";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import Icon from "@/components/ui/Icon";
import styles from "./ParentSectionPage.module.css";

export function ParentSectionPage({
  title,
  lede = "這一區的內容還在整理。",
  children,
}: {
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <main className={styles.main}>
      <p className={styles.eyebrow}>給爸媽</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lede}>{lede}</p>
      {children}
      <Link href="/" className={styles.back}>
        <Icon name="arrow-left" size={16} className="icon-lead" />回首頁
      </Link>
      <SiteFooter />
    </main>
  );
}
