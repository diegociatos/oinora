import type { ReactNode } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { contarAlertas } from "@/lib/db/alertas";
import styles from "./layout.module.css";

const NAV_GROUPS: Array<{
  titulo: string;
  itens: Array<{
    href: string;
    label: string;
    sigla: string;
    roles?: string[];
    soon?: boolean;
    badgeKind?: "alertas";
  }>;
}> = [
  {
    titulo: "Pessoas",
    itens: [
      { href: "/empregados", label: "Empregados", sigla: "E" },
      { href: "/alertas", label: "Alertas", sigla: "A", badgeKind: "alertas" as const },
      { href: "/onboarding", label: "Onboarding", sigla: "O" },
      { href: "/treinamentos", label: "Treinamentos", sigla: "T" },
      { href: "/headcount", label: "Headcount", sigla: "H", roles: ["owner", "admin"] },
      { href: "/avaliacao", label: "Avaliação 9-Box", sigla: "9", roles: ["owner", "admin", "hr_ops", "gestor"] },
    ],
  },
  {
    titulo: "Operação",
    itens: [
      { href: "/folha", label: "Folha", sigla: "F" },
      { href: "/ponto", label: "Ponto", sigla: "P" },
    ],
  },
  {
    titulo: "Recrutamento",
    itens: [
      { href: "/recrutamento/vagas", label: "Vagas", sigla: "V" },
      { href: "/candidatos", label: "Candidatos", sigla: "C" },
    ],
  },
  {
    titulo: "Jurídico",
    itens: [
      { href: "/juridico", label: "Processos", sigla: "J", roles: ["owner", "admin", "advogado_externo", "advogado_interno"] },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      { href: "/usuarios", label: "Usuários", sigla: "U", roles: ["owner", "admin"] },
      { href: "/auditoria", label: "Auditoria", sigla: "A", roles: ["owner"] },
      { href: "/modulos-planos", label: "Módulos & Planos", sigla: "M" },
      { href: "/configuracoes", label: "Configurações", sigla: "C" },
    ],
  },
  {
    titulo: "Oi Nora",
    itens: [
      { href: "/console", label: "Console", sigla: "★", roles: ["super_admin"] },
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
  const alertasInfo = await contarAlertas();

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
                    {"badgeKind" in item &&
                    item.badgeKind === "alertas" &&
                    alertasInfo.total > 0 ? (
                      <span
                        className={styles.navItemBadge}
                        style={
                          alertasInfo.criticos > 0
                            ? { background: "var(--vermelho)" }
                            : undefined
                        }
                      >
                        {alertasInfo.total}
                      </span>
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
