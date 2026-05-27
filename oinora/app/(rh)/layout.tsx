import type { ReactNode } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import styles from "./layout.module.css";

const NAV_GROUPS: Array<{
  titulo: string;
  itens: Array<{
    href: string;
    label: string;
    sigla: string;
    roles?: string[];
    soon?: boolean;
  }>;
}> = [
  {
    titulo: "Pessoas",
    itens: [
      { href: "/empregados", label: "Empregados", sigla: "E" },
      { href: "/onboarding", label: "Onboarding", sigla: "O", soon: true },
      { href: "/treinamentos", label: "Treinamentos", sigla: "T", soon: true },
    ],
  },
  {
    titulo: "Operação",
    itens: [
      { href: "/folha", label: "Folha", sigla: "F", soon: true },
      { href: "/ponto", label: "Ponto", sigla: "P", soon: true },
    ],
  },
  {
    titulo: "Recrutamento",
    itens: [
      { href: "/recrutamento", label: "Vagas", sigla: "V", soon: true },
      { href: "/candidatos", label: "Candidatos", sigla: "C", soon: true },
    ],
  },
  {
    titulo: "Jurídico",
    itens: [
      { href: "/juridico", label: "Processos", sigla: "J", soon: true },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      { href: "/auditoria", label: "Auditoria", sigla: "A", roles: ["owner"] },
      { href: "/configuracoes", label: "Configurações", sigla: "C" },
    ],
  },
];

function initials(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    recrutador_oinora: "Recrutador Oi Nora",
    owner: "Owner",
    admin: "Admin",
    gestor: "Gestor",
    hr_ops: "DP / RH Ops",
    empregado: "Empregado",
    advogado_externo: "Advogado externo",
    advogado_interno: "Advogado interno",
  };
  return map[role] ?? role;
}

export default async function RHLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegação principal">
        <Link href="/empregados" className={styles.sidebarLogo}>
          <span className="oi">Oi</span>
          <span className="nora">Nora</span>
        </Link>
        <div className={styles.sidebarTenant}>
          Tenant atual
          <span className={styles.sidebarTenantNome}>{session.tenantNome}</span>
        </div>

        <nav className={styles.nav}>
          {NAV_GROUPS.map((grupo) => {
            const visiveis = grupo.itens.filter(
              (it) => !it.roles || it.roles.includes(session.role),
            );
            if (visiveis.length === 0) return null;
            return (
              <div key={grupo.titulo}>
                <div className={styles.navSecao}>{grupo.titulo}</div>
                {visiveis.map((item) => (
                  <Link
                    key={item.href}
                    href={item.soon ? "#" : item.href}
                    className={styles.navItem}
                    aria-disabled={item.soon}
                    title={item.soon ? "Em breve" : undefined}
                  >
                    <span className={styles.navItemIc}>{item.sigla}</span>
                    {item.label}
                    {item.soon ? (
                      <span className={styles.navItemBadge}>soon</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <form action="/auth/signout" method="post" className={styles.sidebarFooter}>
          <span className={styles.sidebarAvatar} aria-hidden="true">
            {initials(session.nomeCompleto)}
          </span>
          <div className={styles.sidebarUserInfo}>
            <div className={styles.sidebarUserNome}>{session.nomeCompleto}</div>
            <div className={styles.sidebarUserRole}>{roleLabel(session.role)}</div>
          </div>
          <button
            type="submit"
            className={styles.sidebarSignout}
            aria-label="Sair"
          >
            Sair
          </button>
        </form>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
