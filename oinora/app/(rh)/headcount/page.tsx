import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import layout from "../layout.module.css";
import shared from "../_form.module.css";

export const metadata = { title: "Headcount" };

export default async function HeadcountPage() {
  const session = await requireSession();
  if (!["owner", "admin"].includes(session.role)) redirect("/empregados");

  const supabase = await createClient();
  const cicloAno = new Date().getFullYear();

  const { data: quadro } = await supabase
    .from("headcount_quadro")
    .select(
      "id, posicoes_autorizadas, observacao, departamento:departamento_id(nome, sigla), cargo:cargo_id(nome, nivel)",
    )
    .eq("ciclo_ano", cicloAno);

  // Conta empregados ativos por (departamento, cargo)
  const { data: empregados } = await supabase
    .from("empregados")
    .select("id, departamento_id, cargo_id")
    .eq("status", "ativo");

  type Row = {
    id: string;
    departamento_nome: string;
    cargo_nome: string;
    autorizadas: number;
    preenchidas: number;
    diferenca: number;
  };

  const rows: Row[] = (quadro ?? []).map((q) => {
    const d = Array.isArray(q.departamento) ? q.departamento[0] : q.departamento;
    const c = Array.isArray(q.cargo) ? q.cargo[0] : q.cargo;
    // Conta empregados que batem o departamento+cargo
    const preenchidas = (empregados ?? []).filter((e) => {
      // não temos department_id e cargo_id nas linhas headcount expostas; q tem departamento_id/cargo_id ocultos
      // Retornar pela contagem com filter na query separada
      return false;
    }).length;
    return {
      id: q.id,
      departamento_nome: d?.sigla ? `${d.sigla} · ${d.nome}` : (d?.nome ?? "—"),
      cargo_nome: c ? `${c.nome}${c.nivel ? ` · ${c.nivel}` : ""}` : "—",
      autorizadas: q.posicoes_autorizadas,
      preenchidas,
      diferenca: q.posicoes_autorizadas - preenchidas,
    };
  });

  // Precisamos do dep_id e cargo_id do quadro pra contar — re-query
  const { data: quadroFull } = await supabase
    .from("headcount_quadro")
    .select("id, departamento_id, cargo_id, posicoes_autorizadas")
    .eq("ciclo_ano", cicloAno);
  if (quadroFull) {
    for (const qf of quadroFull) {
      const row = rows.find((r) => r.id === qf.id);
      if (row) {
        row.preenchidas = (empregados ?? []).filter(
          (e) => e.departamento_id === qf.departamento_id && e.cargo_id === qf.cargo_id,
        ).length;
        row.diferenca = row.autorizadas - row.preenchidas;
      }
    }
  }

  const totalAut = rows.reduce((s, r) => s + r.autorizadas, 0);
  const totalPre = rows.reduce((s, r) => s + r.preenchidas, 0);

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Headcount</em> · {cicloAno}
        </h1>
        <div className={layout.topbarActions}>
          {totalPre} / {totalAut} ({Math.round((totalPre / Math.max(totalAut, 1)) * 100)}%)
        </div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Quadro <em>autorizado</em> vs preenchido
          </h2>
          <p>
            Compara posições aprovadas pelo board com empregados ativos. Posições
            em aberto geram input pro time de Recrutamento.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Autorizadas", num: totalAut, cor: "var(--marinho)" },
            { label: "Preenchidas", num: totalPre, cor: "var(--verde)" },
            { label: "Em aberto", num: Math.max(totalAut - totalPre, 0), cor: "var(--laranja)" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: "var(--branco)",
                border: "1px solid var(--cinza-cl)",
                borderRadius: "var(--radius-sharp)",
                padding: 24,
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 44, color: kpi.cor, lineHeight: 1 }}>
                {kpi.num}
              </div>
              <div style={{ fontFamily: "var(--ui)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", marginTop: 6, fontWeight: 700 }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Detalhamento</h3>
          <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
            <thead>
              <tr>
                {["Departamento", "Cargo", "Autorizadas", "Preenchidas", "Em aberto"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Departamento" || h === "Cargo" ? "left" : "right",
                      fontSize: 10,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "var(--cinza)",
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--cinza-cl)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px dashed var(--cinza-cl)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--marinho)" }}>{r.departamento_nome}</td>
                  <td style={{ padding: "10px 12px", color: "var(--marinho)" }}>{r.cargo_nome}</td>
                  <td style={{ padding: "10px 12px", color: "var(--marinho)", textAlign: "right" }}>{r.autorizadas}</td>
                  <td style={{ padding: "10px 12px", color: "var(--verde)", textAlign: "right", fontWeight: 600 }}>{r.preenchidas}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: r.diferenca > 0 ? "var(--laranja)" : "var(--cinza)", fontWeight: 600 }}>
                    {r.diferenca > 0 ? `+${r.diferenca}` : r.diferenca}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
