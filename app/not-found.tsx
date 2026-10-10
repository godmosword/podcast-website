import Link from "next/link";
import NotFoundHero from "@/components/not-found/NotFoundHero";
import SiteFooter from "@/components/SiteFooter";
import styles from "./not-found.module.css";
import Icon from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <NotFoundHero />
      <h1 className={styles.title}>這裡還沒有故事</h1>
      <p className={styles.message}>
        可能是網址打錯了，或這集故事還在準備中。
      </p>
      <Link href="/" className={styles.cta}>
        <Icon name="arrow-left" size={16} className="icon-lead" />回故事屋
      </Link>
      <SiteFooter />
    </main>
  );
}
