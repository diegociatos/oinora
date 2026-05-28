import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import styles from "./layout.module.css";

export const metadata = { title: "Minha área · Oi Nora" };

function initials(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function MeusDadosLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  if (!session.empregadoId) {
    // Usuário não vinculado a empregado — provavelmente é externo
    redirect("/sem-acesso");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/meus-dados" className={styles.logo}>
          <span className="oi">Oi</span>
          <span className="nora">Nora</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/meus-dados">Início</Link>
          <Link href="/meus-dados/holerites">Holerites</Link>
          <Link href="/meus-dados/cursos">Cursos</Link>
          <Link href="/meus-dados/ponto">Ponto</Link>
          <Link href="/meus-dados/ficha">Minha ficha</Link>
        </nav>
        <form action="/auth/signout" method="post" className={styles.userInfo}>
          <span className={styles.avatar}>{initials(session.nomeCompleto)}</span>
          <span style={{ color: "var(--papel)" }}>{session.nomeCompleto.split(" ")[0]}</span>
          <button type="submit" className={styles.signout}>Sair</button>
        </form>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
