import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./layout.module.css";

export const metadata = { title: "Portal do candidato · Oi Nora" };

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.portalShell}>
      <header className={styles.portalTopbar}>
        <Link href="/portal" className={styles.portalLogo}>
          <span className="oi">Oi</span>
          <span className="nora">Nora</span>
        </Link>
        <nav className={styles.portalNav}>
          <Link href="/portal">Vagas</Link>
          <Link href="/login">Sou empresa</Link>
        </nav>
      </header>
      <main className={styles.portalContent}>{children}</main>
      <footer className={styles.portalFooter}>
        © {new Date().getFullYear()} Oi Nora · Vagas via empresas-clientes ·
        LGPD compliant
      </footer>
    </div>
  );
}
