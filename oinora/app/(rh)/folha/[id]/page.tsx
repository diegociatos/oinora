import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/utils/format";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import { AcoesCompetencia } from "../_acoes";

export const metadata = { title: "Competência" };

export default async function CompetenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();
  const { data: comp } = await supabase
    .from("folha_competencias")
    .select(
      "id, competencia, status, total_proventos_centavos, total_descontos_centavos, total_liquido_centavos, total_empregados, encargos_inss_patronal_centavos, encargos_fgts_centavos",
    )
    .eq("id", id)
    .maybeSingle();
  if (!comp) notFound();

  const { data: holerites } = await supabase
    .from("folha_holerites")
    .select(
      "id, salario_base_centavos, total_proventos_centavos, total_descontos_centavos, total_liquido_centavos, inss_desconto_centavos, irrf_desconto_centavos, fgts_centavos, liberado_para_empregado, empregado:empregado_id(nome_completo, matricula)",
    )
    .eq("competencia_id", id)
    .order("empregado(nome_completo)");

  const compLabel = new Date(comp.competencia).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Folha · <em>{compLabel}</em>
        </h1>
        <div className={layout.topbarActions}>{comp.status}</div>
      </header>
      <div className={layout.content}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Link href="/folha" style={{ color: "var(--cinza)", fontFamily: "var(--ui)", fontSize: 13 }}>
            ← Voltar
          </Link>
          <AcoesCompetencia competenciaId={comp.id} status={comp.status} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Proventos", v: comp.total_proventos_centavos, cor: "var(--marinho)" },
            { label: "Descontos", v: comp.total_descontos_centavos, cor: "var(--vermelho)" },
            { label: "Líquido", v: comp.total_liquido_centavos, cor: "var(--verde)" },
            { label: "FGTS empresa", v: comp.encargos_fgts_centavos, cor: "var(--laranja)" },
          ].map((k) => (
            <div key={k.label} style={{ background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: "var(--radius-sharp)", padding: 20, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 24, color: k.cor }}>
                {formatarMoeda(k.v)}
              </div>
              <div style={{ fontFamily: "var(--ui)", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", marginTop: 6, fontWeight: 700 }}>
                {k.label}
              </div>
            </div>
          ))}
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Holerites ({holerites?.length ?? 0})</h3>
          <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
            <thead>
              <tr>
                {["Empregado", "Salário base", "Proventos", "INSS", "IRRF", "Descontos", "Líquido", "FGTS", "Liberado?"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? "left" : "right", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, color: "var(--cinza)", padding: "8px 12px", borderBottom: "1px solid var(--cinza-cl)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(holerites ?? []).map((h) => {
                const e = Array.isArray(h.empregado) ? h.empregado[0] : h.empregado;
                return (
                  <tr key={h.id} style={{ borderBottom: "1px dashed var(--cinza-cl)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--marinho)", fontWeight: 500 }}>
                      <Link
                        href={`/folha/${comp.id}/holerite/${h.id}`}
                        style={{ color: "var(--marinho)" }}
                      >
                        {e?.nome_completo} · {e?.matricula}
                      </Link>
                    </td>
                    <td style={tdRight()}>{formatarMoeda(h.salario_base_centavos)}</td>
                    <td style={tdRight()}>{formatarMoeda(h.total_proventos_centavos)}</td>
                    <td style={tdRight()}>{formatarMoeda(h.inss_desconto_centavos)}</td>
                    <td style={tdRight()}>{formatarMoeda(h.irrf_desconto_centavos)}</td>
                    <td style={{ ...tdRight(), color: "var(--vermelho)" }}>{formatarMoeda(h.total_descontos_centavos)}</td>
                    <td style={{ ...tdRight(), fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--verde)" }}>
                      {formatarMoeda(h.total_liquido_centavos)}
                    </td>
                    <td style={tdRight()}>{formatarMoeda(h.fgts_centavos)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      {h.liberado_para_empregado ? (
                        <span style={{ color: "var(--verde)" }}>✓</span>
                      ) : (
                        <span style={{ color: "var(--cinza)" }}>—</span>
                      )}
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

function tdRight(): React.CSSProperties {
  return { padding: "10px 12px", textAlign: "right", color: "var(--marinho)" };
}
