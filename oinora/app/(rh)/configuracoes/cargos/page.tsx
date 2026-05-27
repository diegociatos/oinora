import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/utils/format";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import styles from "../page.module.css";
import { FormCargo } from "./_form";
import { BotaoDeletarCargo } from "./_actions";

export const metadata = { title: "Cargos" };

export default async function CargosPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; novo?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: cargos }, { data: deptos }] = await Promise.all([
    supabase
      .from("cargos")
      .select(
        "id, codigo, nome, cbo, nivel, departamento_id, faixa_salarial_min_centavos, faixa_salarial_max_centavos, jornada_horas_semana, departamento:departamento_id(nome, sigla)",
      )
      .order("nome"),
    supabase.from("departamentos").select("id, nome, sigla").order("nome"),
  ]);

  const lista = cargos ?? [];
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
          cbo: c.cbo,
          nivel: c.nivel,
          departamento_id: c.departamento_id,
          faixa_salarial_min_centavos: c.faixa_salarial_min_centavos,
          faixa_salarial_max_centavos: c.faixa_salarial_max_centavos,
          jornada_horas_semana: c.jornada_horas_semana,
        },
      };
    }
  }

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Cargos</em>
        </h1>
        <div className={layout.topbarActions}>{lista.length} cadastrados</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2>
              Cargos com <em>CBO e faixa salarial</em>
            </h2>
            <p>
              Cada cargo define jornada padrão, faixa salarial e código CBO para
              eSocial.
            </p>
          </div>
          {!inicial ? (
            <Link href="/configuracoes/cargos?novo=1" className={styles.btnPrincipal}>
              + Novo cargo
            </Link>
          ) : null}
        </div>

        <div className={styles.crudGrid}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Nível</th>
                <th>CBO</th>
                <th>Departamento</th>
                <th>Faixa salarial</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.vazio}>
                    Nenhum cargo cadastrado.
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
                      <td>{c.nivel ?? "—"}</td>
                      <td>{c.cbo ?? "—"}</td>
                      <td>{dep ? `${dep.sigla ?? ""} ${dep.nome}` : "—"}</td>
                      <td>
                        {c.faixa_salarial_min_centavos &&
                        c.faixa_salarial_max_centavos
                          ? `${formatarMoeda(c.faixa_salarial_min_centavos)} – ${formatarMoeda(c.faixa_salarial_max_centavos)}`
                          : "—"}
                      </td>
                      <td className={styles.tabelaActions}>
                        <Link href={`/configuracoes/cargos?editar=${c.id}`}>
                          editar
                        </Link>
                        {session.role === "owner" ? (
                          <BotaoDeletarCargo id={c.id} nome={c.nome} />
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
                  {inicial.id ? "Editar cargo" : "Novo cargo"}
                </h3>
                <FormCargo
                  id={inicial.id}
                  inicial={inicial.data as Parameters<typeof FormCargo>[0]["inicial"]}
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
