import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";

export const metadata = { title: "Treinamentos" };

export default async function TreinamentosPage() {
  await requireSession();
  const supabase = await createClient();

  const [{ data: cursos }, { data: trilhas }, { data: matriculas }] = await Promise.all([
    supabase
      .from("cursos")
      .select("id, titulo, categoria, provedor, carga_horaria_horas, nr_codigo, validade_meses, obrigatorio, ativo")
      .order("titulo"),
    supabase
      .from("trilhas")
      .select("id, nome, descricao, cargo_alvo:cargo_alvo_id(nome), carga_horaria_total, obrigatoria")
      .order("nome"),
    supabase
      .from("empregado_curso_matriculas")
      .select(
        "id, status, data_matricula, data_conclusao, data_expiracao, nota_final, percentual_concluido, empregado:empregado_id(nome_completo, matricula), curso:curso_id(titulo, nr_codigo)",
      )
      .order("data_matricula", { ascending: false })
      .limit(40),
  ]);

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Treinamentos</em>
        </h1>
        <div className={layout.topbarActions}>
          {cursos?.length ?? 0} cursos · {trilhas?.length ?? 0} trilhas
        </div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Cursos, <em>trilhas</em> e matrículas
          </h2>
          <p>
            Catálogo Oi Nora (NRs, LGPD) + cursos próprios do tenant. Trilhas
            organizam aprendizado por cargo.
          </p>
        </div>

        {/* TRILHAS */}
        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Trilhas ativas</h3>
          {(trilhas ?? []).length === 0 ? (
            <div style={{ color: "var(--cinza)", fontFamily: "var(--ui)" }}>—</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {(trilhas ?? []).map((t) => {
                const c = Array.isArray(t.cargo_alvo) ? t.cargo_alvo[0] : t.cargo_alvo;
                return (
                  <div
                    key={t.id}
                    style={{
                      padding: 14,
                      border: "1px solid var(--cinza-cl)",
                      borderRadius: "var(--radius-sharp)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--marinho)" }}>
                      {t.nome}
                      {t.obrigatoria ? (
                        <span style={{ marginLeft: 8, fontSize: 10, color: "var(--vermelho)", letterSpacing: 1, fontFamily: "var(--ui)", fontWeight: 700 }}>
                          OBRIGATÓRIA
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)", marginTop: 2 }}>
                      {t.descricao ?? ""}
                    </div>
                    <div style={{ fontFamily: "var(--ui)", fontSize: 11, color: "var(--cinza)", marginTop: 6, letterSpacing: 0.3 }}>
                      {c ? `Cargo-alvo: ${c.nome} · ` : ""}{t.carga_horaria_total ? `${t.carga_horaria_total}h` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CURSOS */}
        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Catálogo de cursos</h3>
          <table style={tableStyle()}>
            <thead>
              <tr>
                {["Título", "Categoria", "NR", "Carga", "Validade", "Obrigatório"].map((h) => (
                  <th key={h} style={thStyle()}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cursos ?? []).map((c) => (
                <tr key={c.id} style={trStyle()}>
                  <td style={{ ...tdStyle(), fontWeight: 500 }}>{c.titulo}</td>
                  <td style={tdStyle()}>{c.categoria ?? "—"}</td>
                  <td style={tdStyle()}>{c.nr_codigo ?? "—"}</td>
                  <td style={tdStyle()}>{c.carga_horaria_horas ?? "—"}h</td>
                  <td style={tdStyle()}>{c.validade_meses ? `${c.validade_meses} meses` : "—"}</td>
                  <td style={tdStyle()}>
                    {c.obrigatorio ? (
                      <span style={{ color: "var(--vermelho)", fontSize: 10, letterSpacing: 1, fontWeight: 700 }}>SIM</span>
                    ) : (
                      <span style={{ color: "var(--cinza)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MATRÍCULAS RECENTES */}
        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Matrículas recentes (40)</h3>
          <table style={tableStyle()}>
            <thead>
              <tr>
                {["Empregado", "Curso", "Status", "Progresso", "Conclusão", "Expira"].map((h) => (
                  <th key={h} style={thStyle()}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(matriculas ?? []).map((m) => {
                const e = Array.isArray(m.empregado) ? m.empregado[0] : m.empregado;
                const c = Array.isArray(m.curso) ? m.curso[0] : m.curso;
                const vencida = m.data_expiracao && new Date(m.data_expiracao) < new Date();
                return (
                  <tr key={m.id} style={trStyle()}>
                    <td style={tdStyle()}>{e?.nome_completo} · {e?.matricula}</td>
                    <td style={tdStyle()}>
                      {c?.titulo}
                      {c?.nr_codigo ? <span style={{ marginLeft: 4, fontSize: 10, color: "var(--cinza)" }}>· {c.nr_codigo}</span> : null}
                    </td>
                    <td style={tdStyle()}>{m.status}</td>
                    <td style={tdStyle()}>{m.percentual_concluido}%</td>
                    <td style={tdStyle()}>{formatarData(m.data_conclusao)}</td>
                    <td style={{ ...tdStyle(), color: vencida ? "var(--vermelho)" : "var(--marinho)" }}>
                      {formatarData(m.data_expiracao)}
                      {vencida ? " · vencida" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function tableStyle(): React.CSSProperties {
  return { width: "100%", fontFamily: "var(--ui)", fontSize: 13, borderCollapse: "separate", borderSpacing: 0 };
}
function thStyle(): React.CSSProperties {
  return {
    textAlign: "left",
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: 700,
    color: "var(--cinza)",
    padding: "8px 12px 8px 0",
    borderBottom: "1px solid var(--cinza-cl)",
  };
}
function tdStyle(): React.CSSProperties {
  return { padding: "10px 12px 10px 0", color: "var(--marinho)" };
}
function trStyle(): React.CSSProperties {
  return { borderBottom: "1px dashed var(--cinza-cl)" };
}
