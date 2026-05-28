import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";

export const metadata = { title: "Jurídico Trabalhista" };

const RISCO_LABEL: Record<string, string> = {
  remoto: "Remoto",
  possivel: "Possível",
  provavel: "Provável",
  em_analise: "Em análise",
};

const RISCO_COR: Record<string, string> = {
  remoto: "var(--verde)",
  possivel: "var(--amarelo)",
  provavel: "var(--vermelho)",
  em_analise: "var(--cinza)",
};

const FASE_LABEL: Record<string, string> = {
  pre_processual: "Pré-processual",
  conhecimento: "Conhecimento",
  instrucao: "Instrução",
  sentenciado: "Sentenciado",
  recurso_ordinario: "Rec. ordinário",
  recurso_revista: "Rec. revista",
  execucao: "Execução",
  acordo: "Acordo",
  arquivado: "Arquivado",
};

export default async function JuridicoPage() {
  await requireSession();
  const supabase = await createClient();

  const { data: processos } = await supabase
    .from("processos_juridicos")
    .select(
      "id, cnj_numero, vara, comarca, uf, reclamante_nome, tipo_acao, data_ajuizamento, fase, valor_causa_centavos, risco, provisao_centavos, calc_realista_centavos",
    )
    .order("data_ajuizamento", { ascending: false });

  // Audiências próximas
  const hoje = new Date().toISOString();
  const { data: audProximas } = await supabase
    .from("processo_audiencias")
    .select("id, data_hora, tipo, vara, processo:processo_id(cnj_numero, reclamante_nome, id)")
    .gte("data_hora", hoje)
    .order("data_hora")
    .limit(5);

  const totalProvisao = (processos ?? []).reduce((s, p) => s + (p.provisao_centavos ?? 0), 0);
  const totalCausa = (processos ?? []).reduce((s, p) => s + (p.valor_causa_centavos ?? 0), 0);

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Jurídico Trabalhista</em>
        </h1>
        <div className={layout.topbarActions}>
          {processos?.length ?? 0} processos
        </div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Processos <em>trabalhistas</em>
          </h2>
          <p>
            Cálculo de risco e sugestão de acordo via Claude Opus 4.7 ficam
            ativos quando ANTHROPIC_API_KEY for configurada.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Processos ativos", v: processos?.length ?? 0, isMoney: false, cor: "var(--marinho)" },
            { label: "Valor de causa total", v: totalCausa, isMoney: true, cor: "var(--vermelho)" },
            { label: "Provisão CPC 25", v: totalProvisao, isMoney: true, cor: "var(--laranja)" },
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

        {audProximas && audProximas.length > 0 ? (
          <div className={shared.painel}>
            <h3 className={shared.painelTitulo}>Próximas audiências</h3>
            {audProximas.map((a) => {
              const p = Array.isArray(a.processo) ? a.processo[0] : a.processo;
              return (
                <Link
                  key={a.id}
                  href={`/juridico/${p?.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px dashed var(--cinza-cl)",
                    fontFamily: "var(--ui)",
                    fontSize: 13,
                    color: "var(--marinho)",
                    textDecoration: "none",
                  }}
                >
                  <span>
                    <strong style={{ color: "var(--laranja)", fontFamily: "var(--serif)", fontStyle: "italic" }}>
                      {new Date(a.data_hora).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </strong>
                    {" · "}
                    {a.tipo} · {a.vara}
                  </span>
                  <span>
                    {p?.reclamante_nome} ({p?.cnj_numero})
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Lista de processos</h3>
          <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
            <thead>
              <tr>
                {["CNJ", "Reclamante", "Vara", "Fase", "Risco", "Causa", "Provisão"].map((h, i) => (
                  <th key={h} style={{ textAlign: i >= 5 ? "right" : "left", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, color: "var(--cinza)", padding: "8px 12px", borderBottom: "1px solid var(--cinza-cl)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(processos ?? []).map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px dashed var(--cinza-cl)" }}>
                  <td style={{ padding: "10px 12px", fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--cinza)" }}>
                    <Link href={`/juridico/${p.id}`} style={{ color: "var(--marinho)" }}>
                      {p.cnj_numero}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--marinho)", fontWeight: 500 }}>{p.reclamante_nome}</td>
                  <td style={{ padding: "10px 12px", color: "var(--cinza)" }}>{p.vara}{p.uf ? ` · ${p.uf}` : ""}</td>
                  <td style={{ padding: "10px 12px" }}>{FASE_LABEL[p.fase] ?? p.fase}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: RISCO_COR[p.risco], fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                      ● {RISCO_LABEL[p.risco]}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatarMoeda(p.valor_causa_centavos)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--laranja)", fontWeight: 600 }}>
                    {formatarMoeda(p.provisao_centavos)}
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
