import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData, formatarDataLonga, formatarCpf } from "@/lib/utils/format";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import { FormNovoAndamento, FormNovaAudiencia } from "./_acoes-processo";

export const metadata = { title: "Processo" };

const RISCO_LABEL: Record<string, string> = {
  remoto: "Remoto", possivel: "Possível", provavel: "Provável", em_analise: "Em análise",
};
const RISCO_COR: Record<string, string> = {
  remoto: "var(--verde)", possivel: "var(--amarelo)", provavel: "var(--vermelho)", em_analise: "var(--cinza)",
};

export default async function ProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("processos_juridicos")
    .select(
      `id, cnj_numero, vara, juiz_nome, comarca, uf, reclamante_nome, reclamante_cpf,
       reclamante_procurador_nome, reclamante_procurador_oab, tipo_acao,
       data_ajuizamento, data_citacao, fase, valor_causa_centavos, pleitos,
       risco, provisao_centavos, calc_melhor_caso_centavos, calc_realista_centavos,
       calc_pior_caso_centavos, calc_atualizado_em, status,
       escritorio:escritorio_id(razao_social, responsavel_oab)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!p) notFound();

  const [{ data: andamentos }, { data: audiencias }, { data: parcelas }] = await Promise.all([
    supabase.from("processo_andamentos").select("id, data_evento, tipo, titulo, descricao").eq("processo_id", id).order("data_evento", { ascending: false }),
    supabase.from("processo_audiencias").select("id, data_hora, tipo, vara, sala, preposto_nome, resultado").eq("processo_id", id).order("data_hora", { ascending: false }),
    supabase.from("processo_calculo_parcelas").select("id, cenario, parcela, fundamento_legal, periodo, base_calculo, valor_centavos, ordem").eq("processo_id", id).eq("cenario", "realista").order("ordem"),
  ]);

  const esc = Array.isArray(p.escritorio) ? p.escritorio[0] : p.escritorio;

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Processo · <em>{p.cnj_numero}</em>
        </h1>
        <div className={layout.topbarActions}>{p.status}</div>
      </header>
      <div className={layout.content}>
        <Link href="/juridico" style={{ color: "var(--cinza)", fontFamily: "var(--ui)", fontSize: 13, marginBottom: 16, display: "inline-block" }}>
          ← Voltar
        </Link>

        <section style={{
          background: "linear-gradient(135deg, var(--juridico), #4A3380)",
          color: "var(--papel)",
          padding: 32,
          borderRadius: "var(--radius-sharp)",
          marginBottom: 24,
        }}>
          <div style={{ fontFamily: "var(--ui)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(250,247,242,0.5)", fontWeight: 700 }}>
            {p.tipo_acao ?? "Reclamatória"} · {p.vara}{p.uf ? ` · ${p.uf}` : ""}
          </div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, margin: "8px 0", color: "var(--papel)" }}>
            <em style={{ color: "#FBD3C5", fontStyle: "italic" }}>{p.reclamante_nome}</em>
            {" "}vs. Aurora
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <span style={tagHeroStyle()}>Ajuizamento {formatarData(p.data_ajuizamento)}</span>
            {p.juiz_nome ? <span style={tagHeroStyle()}>Juiz(a) {p.juiz_nome}</span> : null}
            {esc ? <span style={tagHeroStyle()}>Patrocinado por {esc.razao_social}</span> : null}
            <span style={{ ...tagHeroStyle(), background: "rgba(255,255,255,0.12)", border: `1px solid ${RISCO_COR[p.risco]}`, color: RISCO_COR[p.risco] }}>
              ● Risco {RISCO_LABEL[p.risco]}
            </span>
          </div>
        </section>

        {/* Cenários */}
        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Cálculo de risco</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Melhor caso (acordo)", v: p.calc_melhor_caso_centavos, cor: "var(--verde)" },
              { label: "Realista", v: p.calc_realista_centavos, cor: "var(--laranja)" },
              { label: "Pior caso (condenação)", v: p.calc_pior_caso_centavos, cor: "var(--vermelho)" },
            ].map((k) => (
              <div key={k.label} style={{ padding: 16, border: `1px solid ${k.cor}40`, background: `${k.cor}10`, borderRadius: "var(--radius-sharp)" }}>
                <div style={{ fontFamily: "var(--ui)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: k.cor, fontWeight: 700 }}>
                  {k.label}
                </div>
                <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 26, color: "var(--marinho)", marginTop: 6 }}>
                  {formatarMoeda(k.v)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginTop: 24 }}>
          <div>
            {/* Parcelas */}
            {parcelas && parcelas.length > 0 ? (
              <div className={shared.painel}>
                <h3 className={shared.painelTitulo}>Cenário realista · breakdown</h3>
                <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Parcela", "Fundamento", "Base", "Valor"].map((h, i) => (
                        <th key={h} style={{ textAlign: i === 3 ? "right" : "left", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, color: "var(--cinza)", padding: "8px 12px", borderBottom: "1px solid var(--cinza-cl)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parcelas.map((pp) => (
                      <tr key={pp.id} style={{ borderBottom: "1px dashed var(--cinza-cl)" }}>
                        <td style={{ padding: "10px 12px", color: "var(--marinho)", fontWeight: 500 }}>{pp.parcela}</td>
                        <td style={{ padding: "10px 12px", color: "var(--cinza)", fontSize: 11 }}>{pp.fundamento_legal ?? "—"}</td>
                        <td style={{ padding: "10px 12px", color: "var(--cinza)", fontSize: 11 }}>{pp.base_calculo ?? "—"}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--marinho)" }}>
                          {formatarMoeda(pp.valor_centavos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Andamentos */}
            <div className={shared.painel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 className={shared.painelTitulo} style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>
                  Andamentos ({andamentos?.length ?? 0})
                </h3>
                <FormNovoAndamento processoId={p.id} />
              </div>
              {(andamentos ?? []).map((a) => (
                <div key={a.id} style={{ padding: "12px 0", borderBottom: "1px dashed var(--cinza-cl)", display: "flex", gap: 16 }}>
                  <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--cinza)", whiteSpace: "nowrap", minWidth: 100, fontSize: 13 }}>
                    {formatarData(a.data_evento)}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--marinho)", fontWeight: 600 }}>
                      <span style={{ display: "inline-block", padding: "1px 6px", background: "var(--juridico)", color: "var(--branco)", borderRadius: 2, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginRight: 6 }}>
                        {a.tipo}
                      </span>
                      {a.titulo}
                    </div>
                    {a.descricao ? (
                      <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)", marginTop: 4 }}>
                        {a.descricao}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className={shared.painel}>
              <h3 className={shared.painelTitulo}>Reclamante</h3>
              <dl style={{ display: "grid", gap: 12, fontFamily: "var(--ui)", fontSize: 13 }}>
                <div>
                  <div style={dlLabel()}>Nome</div>
                  <div style={dlValor()}>{p.reclamante_nome}</div>
                </div>
                {p.reclamante_cpf ? (
                  <div>
                    <div style={dlLabel()}>CPF</div>
                    <div style={dlValor()}>{formatarCpf(p.reclamante_cpf)}</div>
                  </div>
                ) : null}
                {p.reclamante_procurador_nome ? (
                  <div>
                    <div style={dlLabel()}>Procurador</div>
                    <div style={dlValor()}>{p.reclamante_procurador_nome} · {p.reclamante_procurador_oab ?? ""}</div>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className={shared.painel}>
              <h3 className={shared.painelTitulo}>Pleitos</h3>
              <ul style={{ paddingLeft: 16, fontFamily: "var(--ui)", fontSize: 12, color: "var(--marinho)", lineHeight: 1.7 }}>
                {(p.pleitos ?? []).map((pl: string, i: number) => (
                  <li key={i}>{pl.replaceAll("_", " ")}</li>
                ))}
              </ul>
            </div>

            <div className={shared.painel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 className={shared.painelTitulo} style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>
                  Audiências
                </h3>
              </div>
              <FormNovaAudiencia processoId={p.id} />
              {(audiencias ?? []).length === 0 ? (
                <p style={{ fontFamily: "var(--ui)", color: "var(--cinza)", fontSize: 13 }}>—</p>
              ) : (
                (audiencias ?? []).map((a) => (
                  <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px dashed var(--cinza-cl)", fontFamily: "var(--ui)", fontSize: 12 }}>
                    <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--laranja)" }}>
                      {formatarDataLonga(a.data_hora)} · {new Date(a.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ color: "var(--marinho)", marginTop: 2 }}>
                      {a.tipo} · {a.vara}{a.sala ? ` · ${a.sala}` : ""}
                    </div>
                    {a.preposto_nome ? (
                      <div style={{ color: "var(--cinza)", fontSize: 11 }}>Preposto: {a.preposto_nome}</div>
                    ) : null}
                    {a.resultado ? (
                      <div style={{ color: "var(--marinho)", fontStyle: "italic", marginTop: 4 }}>{a.resultado}</div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function tagHeroStyle(): React.CSSProperties {
  return {
    padding: "4px 10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    fontFamily: "var(--ui)",
    fontSize: 11,
    letterSpacing: 0.5,
    color: "var(--papel)",
  };
}
function dlLabel(): React.CSSProperties {
  return { fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", fontWeight: 600 };
}
function dlValor(): React.CSSProperties {
  return { fontFamily: "var(--serif)", color: "var(--marinho)", marginTop: 2 };
}
