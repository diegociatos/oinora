import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";

export const metadata = { title: "Folha de pagamento" };

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  calculando: "Calculando",
  conferencia: "Em conferência",
  fechada: "Fechada",
  paga: "Paga",
};

const STATUS_COR: Record<string, string> = {
  aberta: "var(--marinho-med)",
  calculando: "var(--amarelo)",
  conferencia: "var(--laranja)",
  fechada: "var(--verde)",
  paga: "var(--verde)",
};

export default async function FolhaPage() {
  await requireSession();
  const supabase = await createClient();
  const { data: comps } = await supabase
    .from("folha_competencias")
    .select(
      "id, competencia, status, total_proventos_centavos, total_descontos_centavos, total_liquido_centavos, total_empregados, fechada_em, esocial_enviado",
    )
    .order("competencia", { ascending: false });

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Folha de pagamento</em>
        </h1>
        <div className={layout.topbarActions}>
          {comps?.length ?? 0} competências
        </div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Competências <em>mensais</em>
          </h2>
          <p>
            Cálculo automático INSS/IRRF/FGTS (tabelas 2026), 4-eyes
            (cálculo+conferência), envio eSocial S-1200 ao final.
          </p>
        </div>

        <table style={{ width: "100%", background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: "var(--radius-sharp)", borderCollapse: "separate", borderSpacing: 0, fontFamily: "var(--ui)", fontSize: 13 }}>
          <thead>
            <tr>
              {["Competência", "Status", "Empregados", "Proventos", "Descontos", "Líquido", "eSocial", "Fechada em"].map((h) => (
                <th key={h} style={{ textAlign: h === "Empregados" || h === "Proventos" || h === "Descontos" || h === "Líquido" ? "right" : "left", padding: "12px 16px", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", fontWeight: 700, borderBottom: "1px solid var(--cinza-cl)", background: "var(--papel)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(comps ?? []).map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--cinza-cl)" }}>
                <td style={{ padding: "12px 16px", fontFamily: "var(--serif)", color: "var(--marinho)", fontStyle: "italic" }}>
                  <Link href={`/folha/${c.id}`} style={{ color: "var(--marinho)" }}>
                    {new Date(c.competencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}
                  </Link>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ color: STATUS_COR[c.status] ?? "var(--marinho)", fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                    ● {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>{c.total_empregados}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatarMoeda(c.total_proventos_centavos)}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>{formatarMoeda(c.total_descontos_centavos)}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--marinho)", fontSize: 15 }}>
                  {formatarMoeda(c.total_liquido_centavos)}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {c.esocial_enviado ? (
                    <span style={{ color: "var(--verde)" }}>✓ enviado</span>
                  ) : (
                    <span style={{ color: "var(--cinza)" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--cinza)" }}>{formatarData(c.fechada_em)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
