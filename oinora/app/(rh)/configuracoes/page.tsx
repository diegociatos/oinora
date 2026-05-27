import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import layout from "../layout.module.css";
import styles from "./page.module.css";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireSession();
  const supabase = await createClient();

  const [
    { count: cDept },
    { count: cCargos },
    { count: cCentros },
    { count: cLocais },
    { count: cJornadas },
  ] = await Promise.all([
    supabase.from("departamentos").select("id", { count: "exact", head: true }),
    supabase.from("cargos").select("id", { count: "exact", head: true }),
    supabase.from("centros_custo").select("id", { count: "exact", head: true }),
    supabase
      .from("locais_trabalho")
      .select("id", { count: "exact", head: true }),
    supabase.from("jornadas").select("id", { count: "exact", head: true }),
  ]);

  const ITENS = [
    {
      href: "/configuracoes/departamentos",
      titulo: "Departamentos",
      desc: "Estrutura organizacional do tenant. Editar nome, sigla e hierarquia.",
      count: cDept ?? 0,
    },
    {
      href: "/configuracoes/cargos",
      titulo: "Cargos",
      desc: "Cargos com CBO, faixa salarial, jornada padrão e nível.",
      count: cCargos ?? 0,
    },
    {
      href: "/configuracoes/centros-custo",
      titulo: "Centros de custo",
      desc: "Códigos para alocação contábil de empregados e folha.",
      count: cCentros ?? 0,
    },
    {
      href: "#",
      titulo: "Locais de trabalho",
      desc: `${cLocais ?? 0} cadastrados. CRUD via SQL por enquanto — UI no MVP 2.`,
      count: cLocais ?? 0,
      disabled: true,
    },
    {
      href: "#",
      titulo: "Jornadas",
      desc: `${cJornadas ?? 0} cadastradas. CRUD via SQL por enquanto — UI no MVP 2.`,
      count: cJornadas ?? 0,
      disabled: true,
    },
  ];

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Configurações</em>
        </h1>
      </header>
      <div className={layout.content}>
        <div className={styles.hubGrid}>
          {ITENS.map((item) => (
            <Link
              key={item.titulo}
              href={item.href}
              className={styles.hubCard}
              aria-disabled={item.disabled}
              style={item.disabled ? { opacity: 0.5, pointerEvents: "none" } : undefined}
            >
              <h3>
                <em>{item.titulo}</em>
              </h3>
              <p>{item.desc}</p>
              <span className={styles.contador}>{item.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
