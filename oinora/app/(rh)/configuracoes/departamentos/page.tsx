import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import styles from "../page.module.css";
import { FormDepartamento } from "./_form";
import { BotaoDeletar } from "./_actions";

export const metadata = { title: "Departamentos" };

export default async function DepartamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; novo?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: departamentos } = await supabase
    .from("departamentos")
    .select(
      "id, nome, sigla, parent_id, parent:parent_id(nome), diretor:diretor_id(nome_completo)",
    )
    .order("nome");

  const lista = departamentos ?? [];

  let inicial:
    | { id: string | null; data?: { nome?: string; sigla?: string | null; parent_id?: string | null } }
    | null = null;
  if (sp.novo) {
    inicial = { id: null };
  } else if (sp.editar) {
    const dep = lista.find((d) => d.id === sp.editar);
    if (dep) {
      inicial = {
        id: dep.id,
        data: { nome: dep.nome, sigla: dep.sigla, parent_id: dep.parent_id },
      };
    }
  }

  const parents = lista
    .filter((d) => d.id !== inicial?.id)
    .map((d) => ({ id: d.id, label: d.sigla ? `${d.sigla} · ${d.nome}` : d.nome }));

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Departamentos</em>
        </h1>
        <div className={layout.topbarActions}>{lista.length} cadastrados</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2>
              Estrutura <em>organizacional</em>
            </h2>
            <p>
              Departamentos hierarquizam pessoas, cargos e centros de custo. Use
              sigla curta (3-4 letras) para uso em telas compactas.
            </p>
          </div>
          {!inicial ? (
            <Link href="/configuracoes/departamentos?novo=1" className={styles.btnPrincipal}>
              + Novo departamento
            </Link>
          ) : null}
        </div>

        <div className={styles.crudGrid}>
          <div>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Sigla</th>
                  <th>Nome</th>
                  <th>Pai</th>
                  <th>Diretor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.vazio}>
                      Nenhum departamento cadastrado.
                    </td>
                  </tr>
                ) : (
                  lista.map((d) => {
                    const parent = Array.isArray(d.parent) ? d.parent[0] : d.parent;
                    const diretor = Array.isArray(d.diretor) ? d.diretor[0] : d.diretor;
                    return (
                      <tr key={d.id}>
                        <td style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--cinza)" }}>
                          {d.sigla ?? "—"}
                        </td>
                        <td style={{ fontWeight: 500 }}>{d.nome}</td>
                        <td>{parent?.nome ?? "—"}</td>
                        <td>{diretor?.nome_completo ?? "—"}</td>
                        <td className={styles.tabelaActions}>
                          <Link href={`/configuracoes/departamentos?editar=${d.id}`}>editar</Link>
                          {session.role === "owner" ? (
                            <BotaoDeletar id={d.id} nome={d.nome} />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {inicial ? (
            <aside>
              <div className={shared.painel}>
                <h3 className={shared.painelTitulo}>
                  {inicial.id ? "Editar departamento" : "Novo departamento"}
                </h3>
                <FormDepartamento
                  id={inicial.id}
                  inicial={inicial.data}
                  departamentosParent={parents}
                />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
