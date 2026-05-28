import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import layout from "../layout.module.css";
import shared from "../_form.module.css";

export const metadata = { title: "Módulos e planos" };

const PLANOS = [
  {
    nome: "Essencial",
    valor: "R$ 990",
    limite: "Até 30 empregados",
    cor: "var(--cinza-fundo)",
    modulos: ["rs", "gestao_pessoas"],
  },
  {
    nome: "Profissional",
    valor: "R$ 2.490",
    limite: "Até 100 empregados",
    cor: "var(--laranja-cl)",
    modulos: ["rs", "gestao_pessoas", "folha", "ponto", "onboarding", "treinamentos"],
    destaque: true,
  },
  {
    nome: "Premium",
    valor: "R$ 4.990",
    limite: "Até 500 empregados",
    cor: "var(--marinho)",
    corText: "var(--papel)",
    modulos: ["rs", "gestao_pessoas", "folha", "ponto", "onboarding", "treinamentos", "juridico", "avaliacao", "headcount", "ia_completa"],
  },
];

const MODULO_LABEL: Record<string, string> = {
  rs: "Recrutamento & Seleção",
  gestao_pessoas: "Gestão de Pessoas",
  folha: "Folha de pagamento",
  ponto: "Ponto eletrônico",
  onboarding: "Onboarding",
  treinamentos: "Treinamentos",
  juridico: "Jurídico Trabalhista",
  avaliacao: "Avaliação 9-Box",
  headcount: "Headcount",
  ia_completa: "IA Nora completa (Opus + Sonnet + Haiku)",
};

export default async function ModulosPlanosPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plano, status, modulos_ativos, trial_termina_em")
    .eq("id", session.tenantId)
    .maybeSingle();

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Módulos & Planos</em>
        </h1>
        <div className={layout.topbarActions}>
          Plano atual: <strong style={{ color: "var(--laranja)" }}>{tenant?.plano ?? "—"}</strong>
        </div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Planos da <em>Oi Nora</em>
          </h2>
          <p>
            Cada plano libera um conjunto de módulos. Add-ons disponíveis em todos
            os planos. Cobrança via Stripe ao ativar billing (MVP 6).
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {PLANOS.map((p) => {
            const isAtual = tenant?.plano === p.nome.toLowerCase();
            return (
              <div
                key={p.nome}
                style={{
                  background: p.cor ?? "var(--branco)",
                  color: p.corText ?? "var(--marinho)",
                  border: `1px solid ${p.destaque ? "var(--laranja)" : "var(--cinza-cl)"}`,
                  borderRadius: "var(--radius-sharp)",
                  padding: 28,
                  position: "relative",
                  boxShadow: p.destaque ? "0 0 0 1px var(--laranja)" : undefined,
                }}
              >
                {isAtual ? (
                  <span style={{ position: "absolute", top: -12, right: 16, background: "var(--verde)", color: "var(--branco)", padding: "2px 10px", borderRadius: "var(--radius-sharp)", fontSize: 10, fontFamily: "var(--ui)", letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>
                    Plano atual
                  </span>
                ) : null}
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400, marginBottom: 8 }}>
                  {p.nome === "Premium" ? <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>Premium</em> : p.nome}
                </h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 36 }}>{p.valor}</span>
                  <span style={{ fontFamily: "var(--ui)", fontSize: 13, opacity: 0.7 }}>/mês</span>
                </div>
                <div style={{ fontFamily: "var(--ui)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", opacity: 0.7, marginTop: 4, fontWeight: 600 }}>
                  {p.limite}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 8, fontFamily: "var(--ui)", fontSize: 13 }}>
                  {p.modulos.map((m) => (
                    <li key={m} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: p.destaque ? "var(--laranja-esc)" : (p.corText === "var(--papel)" ? "#FBD3C5" : "var(--verde)"), fontWeight: 700 }}>
                        ✓
                      </span>
                      <span>{MODULO_LABEL[m] ?? m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {tenant?.modulos_ativos && tenant.modulos_ativos.length > 0 ? (
          <div className={shared.painel} style={{ marginTop: 24 }}>
            <h3 className={shared.painelTitulo}>Módulos ativos no seu tenant</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tenant.modulos_ativos.map((m: string) => (
                <span key={m} style={{ padding: "4px 12px", background: "var(--laranja-cl)", color: "var(--laranja-esc)", border: "1px solid var(--laranja)", borderRadius: "var(--radius-pill)", fontSize: 11, fontFamily: "var(--ui)", fontWeight: 600 }}>
                  {MODULO_LABEL[m] ?? m}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
