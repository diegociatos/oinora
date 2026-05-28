import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";

export const metadata = { title: "Console Oi Nora" };

const PLANO_VALOR: Record<string, number> = {
  essencial: 99000,
  profissional: 249000,
  premium: 499000,
};

export default async function ConsolePage() {
  const session = await requireSession();
  if (session.role !== "super_admin") redirect("/empregados");

  const admin = createAdminClient();

  const [{ data: tenants }, { data: ia30d }, { count: totalEmpregados }] = await Promise.all([
    admin
      .from("tenants")
      .select("id, nome_fantasia, razao_social, cnpj, plano, status, trial_termina_em, criado_em")
      .order("criado_em", { ascending: false }),
    admin
      .from("ia_chamadas")
      .select("custo_centavos, modelo, tenant_id, criado_em")
      .gte("criado_em", new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from("empregados").select("id", { count: "exact", head: true }),
  ]);

  const mrr = (tenants ?? [])
    .filter((t) => t.status === "ativo")
    .reduce((s, t) => s + (PLANO_VALOR[t.plano] ?? 0), 0);

  const arr = mrr * 12;

  const custoIa = (ia30d ?? []).reduce((s, c) => s + (c.custo_centavos ?? 0), 0);

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Console <em>Oi Nora</em>
        </h1>
        <div className={layout.topbarActions}>Super Admin · {session.email}</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Visão <em>cross-tenant</em>
          </h2>
          <p>
            KPIs financeiros + uso de IA + status de tenants. Acesso restrito a
            super_admin da Oi Nora.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Tenants", v: tenants?.length ?? 0, isMoney: false, cor: "var(--marinho)" },
            { label: "MRR", v: mrr, isMoney: true, cor: "var(--verde)" },
            { label: "ARR projetado", v: arr, isMoney: true, cor: "var(--laranja)" },
            { label: "Custo IA 30d", v: custoIa, isMoney: true, cor: "var(--roxo)" },
          ].map((k) => (
            <div key={k.label} style={{ background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: "var(--radius-sharp)", padding: 20, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 28, color: k.cor }}>
                {k.isMoney ? formatarMoeda(k.v) : k.v}
              </div>
              <div style={{ fontFamily: "var(--ui)", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", marginTop: 6, fontWeight: 700 }}>
                {k.label}
              </div>
            </div>
          ))}
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Tenants ({tenants?.length ?? 0})</h3>
          <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
            <thead>
              <tr>
                {["Empresa", "CNPJ", "Plano", "Status", "Criado em"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, color: "var(--cinza)", padding: "8px 12px", borderBottom: "1px solid var(--cinza-cl)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tenants ?? []).map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px dashed var(--cinza-cl)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--marinho)" }}>
                    {t.nome_fantasia || t.razao_social}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--cinza)", fontFamily: "var(--mono)", fontSize: 11 }}>
                    {t.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ padding: "2px 8px", background: "var(--laranja-cl)", color: "var(--laranja-esc)", borderRadius: 2, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
                      {t.plano}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: t.status === "ativo" ? "var(--verde)" : "var(--cinza)", fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                      ● {t.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--cinza)" }}>{formatarData(t.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Uso de IA (últimos 30 dias)</h3>
          {ia30d && ia30d.length > 0 ? (
            <div style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--marinho)" }}>
              {ia30d.length} chamadas · custo total {formatarMoeda(custoIa)}
            </div>
          ) : (
            <div style={{ fontFamily: "var(--ui)", color: "var(--cinza)", fontSize: 13 }}>
              Nenhuma chamada IA registrada. Ative ANTHROPIC_API_KEY pra começar a usar.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
