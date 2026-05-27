import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import styles from "../page.module.css";
import { FormCentroCusto } from "./_form";
import { BotaoDeletarCentro } from "./_actions";

export const metadata = { title: "Centros de custo" };

export default async function CentrosCustoPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; novo?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: centros }, { data: deptos }] = await Promise.all([
    supabase
      .from("centros_custo")
      .select(
        "id, codigo, nome, departamento_id, departamento:departamento_id(nome, sigla)",
      )
      .order("codigo"),
    supabase.from("departamentos").select("id, nome, sigla").order("nome"),
  ]);

  const lista = centros ?? [];
  const departamentos = (deptos ?? []).map((d) => ({
    id: d.id,
    label: d.sigla ? `${d.sigla} · ${d.nome}` : d.nome,
  }));

  let inicial:
    | { id: string | null; data?: Record<string, unknown> }
    | null = null;
  if (sp.novo) inicial = { id: null };
  else if (sp.editar) {
    const c = lista.find((c) => c.id === sp.editar);
    if (c) {
      inicial = {
        id: c.id,
        data: {
          codigo: c.codigo,
          nome: c.nome,
          departamento_id: c.departamento_id,
        },
      };
    }
  }

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Centros de custo</em>
        </h1>
        <div className={layout.topbarActions}>{lista.length} cadastrados</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2>
              Códigos para <em>alocação contábil</em>
            </h2>
            <p>
              Centros de custo agrupam empregados e folha para análises por
              obra, projeto ou departamento.
            </p>
          </div>
          {!inicial ? (
            <Link href="/configuracoes/centros-custo?novo=1" className={styles.btnPrincipal}>
              + Novo centro
            </Link>
          ) : null}
        </div>

        <div className={styles.crudGrid}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Departamento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.vazio}>
                    Nenhum centro de custo cadastrado.
                  </td>
                </tr>
              ) : (
                lista.map((c) => {
                  const dep = Array.isArray(c.departamento)
                    ? c.departamento[0]
                    : c.departamento;
                  return (
                    <tr key={c.id}>
                      <td style={{ fontFamily: "var(--serif)", color: "var(--cinza)" }}>
                        {c.codigo}
                      </td>
                      <td style={{ fontWeight: 500 }}>{c.nome}</td>
                      <td>{dep ? `${dep.sigla ?? ""} ${dep.nome}` : "—"}</td>
                      <td className={styles.tabelaActions}>
                        <Link href={`/configuracoes/centros-custo?editar=${c.id}`}>
                          editar
                        </Link>
                        {session.role === "owner" ? (
                          <BotaoDeletarCentro id={c.id} nome={c.nome} />
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {inicial ? (
            <aside>
              <div className={shared.painel}>
                <h3 className={shared.painelTitulo}>
                  {inicial.id ? "Editar centro" : "Novo centro"}
                </h3>
                <FormCentroCusto
                  id={inicial.id}
                  inicial={inicial.data as Parameters<typeof FormCentroCusto>[0]["inicial"]}
                  departamentos={departamentos}
                />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
