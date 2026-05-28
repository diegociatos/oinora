import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/utils/format";

export default async function MeusHoleritesPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: holerites } = await supabase
    .from("folha_holerites")
    .select(
      `id, salario_base_centavos, total_proventos_centavos, total_descontos_centavos,
       total_liquido_centavos, inss_desconto_centavos, irrf_desconto_centavos, fgts_centavos,
       liberado_para_empregado, competencia:competencia_id(competencia, status)`,
    )
    .eq("empregado_id", session.empregadoId!)
    .eq("liberado_para_empregado", true)
    .order("competencia(competencia)" as never, { ascending: false });

  return (
    <>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: 28,
          color: "var(--marinho)",
          fontWeight: 400,
          marginBottom: 8,
        }}
      >
        Meus <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>holerites</em>
      </h1>
      <p
        style={{
          fontFamily: "var(--ui)",
          fontSize: 14,
          color: "var(--cinza)",
          marginBottom: 24,
        }}
      >
        Holerites liberados pelo RH. Clique em um mês pra ver detalhamento dos eventos.
      </p>

      {(holerites ?? []).length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: "var(--branco)",
            border: "1px dashed var(--cinza-cl)",
            borderRadius: "var(--radius-sharp)",
            fontFamily: "var(--ui)",
            color: "var(--cinza)",
          }}
        >
          Nenhum holerite liberado ainda. Quando o RH liberar a competência, ela aparece aqui.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {(holerites ?? []).map((h) => {
            const c = Array.isArray(h.competencia) ? h.competencia[0] : h.competencia;
            const compLabel = c
              ? new Date(c.competencia).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })
              : "—";
            return (
              <article
                key={h.id}
                style={{
                  background: "var(--branco)",
                  border: "1px solid var(--cinza-cl)",
                  borderRadius: "var(--radius-sharp)",
                  padding: 20,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontStyle: "italic",
                      fontSize: 20,
                      color: "var(--marinho)",
                      textTransform: "capitalize",
                    }}
                  >
                    {compLabel}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--ui)",
                      fontSize: 12,
                      color: "var(--cinza)",
                      marginTop: 4,
                    }}
                  >
                    Base: {formatarMoeda(h.salario_base_centavos)} · INSS:{" "}
                    {formatarMoeda(h.inss_desconto_centavos)} · IRRF:{" "}
                    {formatarMoeda(h.irrf_desconto_centavos)} · FGTS:{" "}
                    {formatarMoeda(h.fgts_centavos)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--ui)",
                      fontSize: 10,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: "var(--cinza)",
                      fontWeight: 700,
                    }}
                  >
                    Líquido a receber
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontStyle: "italic",
                      fontSize: 28,
                      color: "var(--verde)",
                      lineHeight: 1.1,
                    }}
                  >
                    {formatarMoeda(h.total_liquido_centavos)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
