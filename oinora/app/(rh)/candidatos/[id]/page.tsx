import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData, formatarCpf, calcularIdade } from "@/lib/utils/format";
import { STAGE_LABEL, STAGE_COR } from "@/lib/utils/stages";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";

export const metadata = { title: "Candidato" };

function initials(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function FichaCandidatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: cand } = await supabase
    .from("candidatos")
    .select(
      `id, nome_completo, cpf, data_nascimento, sexo, raca_cor, email, telefone,
       cidade, uf, cv_url, linkedin_url, portfolio_url, pretensao_salarial_centavos,
       disponibilidade_inicio, modelo_trabalho_preferencia,
       aceitou_lgpd, aceitou_lgpd_em, criado_em`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!cand) notFound();

  const { data: candidaturas } = await supabase
    .from("candidatura_vaga")
    .select(
      `id, stage, score_ia, parecer_triagem, origem, data_aplicacao,
       data_ultima_movimentacao, proposta_salario_centavos, observacoes,
       vaga:vaga_id(id, codigo, titulo)`,
    )
    .eq("candidato_id", id)
    .order("data_aplicacao", { ascending: false });

  // Entrevistas via JOIN nas candidaturas
  const candidaturasIds = (candidaturas ?? []).map((c) => c.id);
  const { data: entrevistas } = candidaturasIds.length
    ? await supabase
        .from("entrevistas")
        .select("id, candidatura_id, data_hora, modalidade, feedback, nota_geral, recomendacao")
        .in("candidatura_id", candidaturasIds)
        .order("data_hora", { ascending: false })
    : { data: [] };

  const idade = calcularIdade(cand.data_nascimento);

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Candidato · <em>{cand.nome_completo}</em>
        </h1>
        <div className={layout.topbarActions}>
          {candidaturas?.length ?? 0} candidaturas
        </div>
      </header>
      <div className={layout.content}>
        <Link href="/candidatos" style={{ color: "var(--cinza)", fontFamily: "var(--ui)", fontSize: 13, marginBottom: 16, display: "inline-block" }}>
          ← Voltar
        </Link>

        {/* Hero */}
        <section
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            background: "linear-gradient(135deg, var(--marinho), var(--marinho-esc))",
            color: "var(--papel)",
            padding: 28,
            borderRadius: "var(--radius-sharp)",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--laranja), var(--laranja-esc))",
              color: "var(--branco)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 36,
              flexShrink: 0,
            }}
          >
            {initials(cand.nome_completo)}
          </div>
          <div>
            <div style={{ fontFamily: "var(--ui)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(250,247,242,0.6)", fontWeight: 700 }}>
              Candidato externo · inscrito {formatarData(cand.criado_em)}
            </div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, margin: "4px 0", color: "var(--papel)" }}>
              {cand.nome_completo}
            </h2>
            <div style={{ fontFamily: "var(--ui)", fontSize: 14, opacity: 0.85 }}>
              {cand.email}
              {cand.telefone ? ` · ${cand.telefone}` : ""}
              {cand.cidade ? ` · ${cand.cidade}${cand.uf ? `/${cand.uf}` : ""}` : ""}
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <div>
            {/* Candidaturas */}
            <div className={shared.painel}>
              <h3 className={shared.painelTitulo}>Candidaturas ({candidaturas?.length ?? 0})</h3>
              {(candidaturas ?? []).length === 0 ? (
                <p style={{ fontFamily: "var(--ui)", color: "var(--cinza)" }}>—</p>
              ) : (
                (candidaturas ?? []).map((c) => {
                  const v = Array.isArray(c.vaga) ? c.vaga[0] : c.vaga;
                  return (
                    <div key={c.id} style={{ padding: "14px 0", borderBottom: "1px dashed var(--cinza-cl)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Link href={`/recrutamento/vagas/${v?.id}`} style={{ color: "var(--marinho)", fontFamily: "var(--serif)", fontSize: 17 }}>
                          {v?.titulo}
                          <span style={{ marginLeft: 8, fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--cinza)", fontSize: 14 }}>
                            ({v?.codigo})
                          </span>
                        </Link>
                        <span style={{ padding: "3px 10px", borderRadius: 999, background: STAGE_COR[c.stage] ?? "var(--cinza)", color: "var(--branco)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, fontFamily: "var(--ui)" }}>
                          {STAGE_LABEL[c.stage] ?? c.stage}
                        </span>
                      </div>
                      <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)", marginTop: 4 }}>
                        Aplicou em {formatarData(c.data_aplicacao)}
                        {c.origem ? ` via ${c.origem}` : ""}
                        {c.score_ia ? ` · score IA ${c.score_ia}%` : ""}
                        {c.proposta_salario_centavos ? ` · proposta ${formatarMoeda(c.proposta_salario_centavos)}` : ""}
                      </div>
                      {c.parecer_triagem ? (
                        <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--marinho)", marginTop: 6, fontStyle: "italic", background: "var(--papel)", padding: 8, borderRadius: 2 }}>
                          “{c.parecer_triagem}”
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            {/* Entrevistas */}
            {entrevistas && entrevistas.length > 0 ? (
              <div className={shared.painel}>
                <h3 className={shared.painelTitulo}>Entrevistas ({entrevistas.length})</h3>
                {entrevistas.map((e) => (
                  <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px dashed var(--cinza-cl)", fontFamily: "var(--ui)", fontSize: 13 }}>
                    <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--laranja)" }}>
                      {new Date(e.data_hora).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span style={{ marginLeft: 8, fontSize: 11, color: "var(--cinza)" }}>· {e.modalidade}</span>
                    </div>
                    {e.feedback ? (
                      <div style={{ marginTop: 4, color: "var(--marinho)" }}>{e.feedback}</div>
                    ) : null}
                    {e.nota_geral ? (
                      <div style={{ marginTop: 2, fontSize: 11, color: "var(--cinza)" }}>
                        Nota: {e.nota_geral}/10
                        {e.recomendacao ? ` · ${e.recomendacao}` : ""}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <aside>
            <div className={shared.painel}>
              <h3 className={shared.painelTitulo}>Dados pessoais</h3>
              <dl style={{ display: "grid", gap: 12, fontFamily: "var(--ui)", fontSize: 13 }}>
                <div>
                  <div style={dlLabel()}>CPF</div>
                  <div style={dlValor()}>{formatarCpf(cand.cpf)}</div>
                </div>
                <div>
                  <div style={dlLabel()}>Nascimento · idade</div>
                  <div style={dlValor()}>
                    {formatarData(cand.data_nascimento)}
                    {idade ? ` · ${idade} anos` : ""}
                  </div>
                </div>
                <div>
                  <div style={dlLabel()}>Sexo · Raça/cor</div>
                  <div style={dlValor()}>
                    {cand.sexo ?? "—"} · {cand.raca_cor ?? "—"}
                  </div>
                </div>
                <div>
                  <div style={dlLabel()}>Pretensão</div>
                  <div style={dlValor()}>{formatarMoeda(cand.pretensao_salarial_centavos)}</div>
                </div>
                <div>
                  <div style={dlLabel()}>Disponibilidade</div>
                  <div style={dlValor()}>{formatarData(cand.disponibilidade_inicio)}</div>
                </div>
                <div>
                  <div style={dlLabel()}>Modelo preferido</div>
                  <div style={dlValor()}>
                    {cand.modelo_trabalho_preferencia
                      ? cand.modelo_trabalho_preferencia.join(", ")
                      : "—"}
                  </div>
                </div>
              </dl>
            </div>

            <div className={shared.painel}>
              <h3 className={shared.painelTitulo}>Links</h3>
              <dl style={{ display: "grid", gap: 10, fontFamily: "var(--ui)", fontSize: 12 }}>
                {cand.cv_url ? (
                  <a href={cand.cv_url} target="_blank" style={{ color: "var(--laranja)" }}>
                    📄 Currículo
                  </a>
                ) : (
                  <span style={{ color: "var(--cinza)" }}>CV não anexado</span>
                )}
                {cand.linkedin_url ? (
                  <a href={cand.linkedin_url} target="_blank" style={{ color: "var(--laranja)" }}>
                    LinkedIn
                  </a>
                ) : null}
                {cand.portfolio_url ? (
                  <a href={cand.portfolio_url} target="_blank" style={{ color: "var(--laranja)" }}>
                    Portfolio
                  </a>
                ) : null}
              </dl>
            </div>

            <div className={shared.painel}>
              <h3 className={shared.painelTitulo}>LGPD</h3>
              <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--marinho)" }}>
                {cand.aceitou_lgpd ? (
                  <>
                    <div style={{ color: "var(--verde)", fontWeight: 600 }}>✓ Aceitou termo</div>
                    <div style={{ color: "var(--cinza)", marginTop: 4 }}>
                      em {formatarData(cand.aceitou_lgpd_em)}
                    </div>
                  </>
                ) : (
                  <div style={{ color: "var(--vermelho)" }}>⚠ Não aceitou termo</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function dlLabel(): React.CSSProperties {
  return { fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", fontWeight: 600 };
}
function dlValor(): React.CSSProperties {
  return { fontFamily: "var(--serif)", color: "var(--marinho)", marginTop: 2 };
}
