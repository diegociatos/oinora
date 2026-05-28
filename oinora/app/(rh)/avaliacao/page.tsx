import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import layout from "../layout.module.css";
import shared from "../_form.module.css";
import { CalibrarBotao } from "./_calibrar";

export const metadata = { title: "Avaliação 9-Box" };

const QUADRANTES = [
  // [desempenho, potencial] -> rótulo
  { d: 3, p: 3, label: "★ Estrela", cor: "#2D7D5A", bg: "#EAF5EE" },
  { d: 2, p: 3, label: "Sucessor", cor: "#1F2A44", bg: "#EEF1F6" },
  { d: 1, p: 3, label: "Enigma", cor: "#7E5BCC", bg: "#EFE9FB" },

  { d: 3, p: 2, label: "Profissional sólido", cor: "#2D7D5A", bg: "#EAF5EE" },
  { d: 2, p: 2, label: "Profissional mediano", cor: "#5C6478", bg: "#F2EEE6" },
  { d: 1, p: 2, label: "Profissional em transição", cor: "#7E5BCC", bg: "#EFE9FB" },

  { d: 3, p: 1, label: "Cavalo de batalha", cor: "#D4A02C", bg: "#FAF1DA" },
  { d: 2, p: 1, label: "Eficaz limitado", cor: "#D4A02C", bg: "#FAF1DA" },
  { d: 1, p: 1, label: "Insuficiente", cor: "#C44545", bg: "#FBEAEA" },
];

export default async function AvaliacaoPage() {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops", "gestor"].includes(session.role)) {
    redirect("/empregados");
  }

  const supabase = await createClient();

  const { data: empregados } = await supabase
    .from("empregados")
    .select(
      "id, nome_completo, matricula, nine_box_desempenho, nine_box_potencial, cargo:cargo_id(nome, nivel), departamento:departamento_id(sigla)",
    )
    .eq("status", "ativo");

  // Agrupa por quadrante
  const grupos: Record<string, typeof empregados> = {};
  for (const e of empregados ?? []) {
    if (e.nine_box_desempenho && e.nine_box_potencial) {
      const key = `${e.nine_box_desempenho}-${e.nine_box_potencial}`;
      (grupos[key] ??= []).push(e);
    }
  }
  const semCalibracao = (empregados ?? []).filter(
    (e) => !e.nine_box_desempenho || !e.nine_box_potencial,
  );

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Avaliação <em>9-Box</em>
        </h1>
        <div className={layout.topbarActions}>
          {(empregados?.length ?? 0) - semCalibracao.length} / {empregados?.length ?? 0} calibrados
        </div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Matriz de <em>desempenho × potencial</em>
          </h2>
          <p>
            Calibração 1-3 em cada eixo. Resultado classifica entre 9 quadrantes
            estratégicos para sucessão e PDI.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, marginBottom: 32 }}>
          {/* Eixo Y label */}
          <div
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontFamily: "var(--ui)",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--cinza)",
              alignSelf: "center",
              justifySelf: "center",
              padding: "0 8px",
            }}
          >
            Potencial ↑
          </div>

          {/* Grid 3x3 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[3, 2, 1].map((p) =>
              [1, 2, 3].map((d) => {
                const quad = QUADRANTES.find((q) => q.d === d && q.p === p)!;
                const items = grupos[`${d}-${p}`] ?? [];
                return (
                  <div
                    key={`${d}-${p}`}
                    style={{
                      background: quad.bg,
                      border: `1px solid ${quad.cor}40`,
                      borderRadius: "var(--radius-sharp)",
                      padding: 12,
                      minHeight: 140,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 13,
                        fontStyle: "italic",
                        color: quad.cor,
                        marginBottom: 8,
                      }}
                    >
                      {quad.label}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {items.map((e) => {
                        const c = Array.isArray(e.cargo) ? e.cargo[0] : e.cargo;
                        const dept = Array.isArray(e.departamento) ? e.departamento[0] : e.departamento;
                        return (
                          <div
                            key={e.id}
                            style={{
                              fontFamily: "var(--ui)",
                              fontSize: 11,
                              padding: "4px 8px",
                              background: "var(--branco)",
                              borderRadius: 2,
                              border: "1px solid var(--cinza-cl)",
                            }}
                          >
                            <strong style={{ color: "var(--marinho)" }}>{e.nome_completo}</strong>
                            <div style={{ color: "var(--cinza)", fontSize: 10 }}>
                              {dept?.sigla} · {c?.nome ?? ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Eixo X label */}
        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--ui)",
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 700,
            color: "var(--cinza)",
            marginBottom: 24,
          }}
        >
          Desempenho →
        </div>

        {semCalibracao.length > 0 ? (
          <div className={shared.painel}>
            <h3 className={shared.painelTitulo}>Sem calibração ({semCalibracao.length})</h3>
            <p style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--cinza)", marginBottom: 12 }}>
              Empregados ativos sem avaliação 9-Box no ciclo atual.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {semCalibracao.map((e) => (
                <div
                  key={e.id}
                  style={{
                    padding: 12,
                    background: "var(--branco)",
                    border: "1px solid var(--cinza-cl)",
                    borderRadius: "var(--radius-sharp)",
                  }}
                >
                  <div style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--marinho)" }}>
                    {e.nome_completo}
                  </div>
                  <CalibrarBotao
                    empregadoId={e.id}
                    nome={e.nome_completo}
                    desempenhoAtual={null}
                    potencialAtual={null}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
