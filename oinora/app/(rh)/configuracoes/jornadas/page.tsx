import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import styles from "../page.module.css";
import { FormJornada } from "./_form";
import { BotaoDeletarJornada } from "./_actions";

export const metadata = { title: "Jornadas" };

export default async function JornadasPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; novo?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: jornadas } = await supabase
    .from("jornadas")
    .select("id, nome, horas_semana, configuracao")
    .order("horas_semana");

  const lista = jornadas ?? [];

  let inicial:
    | { id: string | null; data?: Record<string, unknown> }
    | null = null;
  if (sp.novo) inicial = { id: null };
  else if (sp.editar) {
    const j = lista.find((j) => j.id === sp.editar);
    if (j) {
      inicial = { id: j.id, data: { nome: j.nome, horas_semana: j.horas_semana } };
    }
  }

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Jornadas</em>
        </h1>
        <div className={layout.topbarActions}>{lista.length} cadastradas</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2>
              Padrões de <em>horários</em>
            </h2>
            <p>
              Jornadas definem horas semanais e janelas de trabalho. Configuração
              detalhada (entrada/saída por dia) será exposta no módulo de Ponto.
            </p>
          </div>
          {!inicial ? (
            <Link href="/configuracoes/jornadas?novo=1" className={styles.btnPrincipal}>
              + Nova jornada
            </Link>
          ) : null}
        </div>

        <div className={styles.crudGrid}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Horas/semana</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.vazio}>
                    Nenhuma jornada cadastrada.
                  </td>
                </tr>
              ) : (
                lista.map((j) => (
                  <tr key={j.id}>
                    <td style={{ fontWeight: 500 }}>{j.nome}</td>
                    <td>{j.horas_semana}h</td>
                    <td className={styles.tabelaActions}>
                      <Link href={`/configuracoes/jornadas?editar=${j.id}`}>
                        editar
                      </Link>
                      {session.role === "owner" ? (
                        <BotaoDeletarJornada id={j.id} nome={j.nome} />
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {inicial ? (
            <aside>
              <div className={shared.painel}>
                <h3 className={shared.painelTitulo}>
                  {inicial.id ? "Editar jornada" : "Nova jornada"}
                </h3>
                <FormJornada
                  id={inicial.id}
                  inicial={inicial.data as Parameters<typeof FormJornada>[0]["inicial"]}
                />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
