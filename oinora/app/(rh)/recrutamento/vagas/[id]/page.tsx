import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData } from "@/lib/utils/format";
import { VAGA_STATUS_LABEL } from "@/lib/utils/stages";
import layout from "../../../layout.module.css";
import shared from "../../../_form.module.css";
import styles from "../../page.module.css";
import { Kanban } from "./_kanban";

export const metadata = { title: "Vaga" };

export default async function VagaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: vaga } = await supabase
    .from("vagas")
    .select(
      `id, codigo, titulo, status, afirmativa, publico_alvo, justificativa_afirmativa,
       descricao_completa, responsabilidades, requisitos_obrigatorios, requisitos_desejaveis,
       beneficios, salario_min_centavos, salario_max_centavos, jornada, modelo_trabalho,
       data_publicacao,
       cargo:cargo_id(nome, nivel, cbo),
       departamento:departamento_id(nome, sigla),
       local:local_trabalho_id(nome),
       gestor:gestor_solicitante_id(nome_completo, matricula)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!vaga) notFound();

  const { data: candidaturasRaw } = await supabase
    .from("candidatura_vaga")
    .select(
      `id, stage, score_ia, parecer_triagem,
       candidato:candidato_id(id, nome_completo, email, cidade, uf)`,
    )
    .eq("vaga_id", id);
  const candidaturas = (candidaturasRaw ?? []).map((c) => ({
    ...c,
    candidato: Array.isArray(c.candidato) ? c.candidato[0] : c.candidato,
  }));

  const cargo = Array.isArray(vaga.cargo) ? vaga.cargo[0] : vaga.cargo;
  const dep = Array.isArray(vaga.departamento) ? vaga.departamento[0] : vaga.departamento;
  const local = Array.isArray(vaga.local) ? vaga.local[0] : vaga.local;
  const gestor = Array.isArray(vaga.gestor) ? vaga.gestor[0] : vaga.gestor;

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Vaga · <em>{vaga.codigo}</em>
        </h1>
        <div className={layout.topbarActions}>
          {candidaturas?.length ?? 0} candidatos
        </div>
      </header>

      <div className={layout.content}>
        <Link
          href="/recrutamento/vagas"
          style={{ color: "var(--cinza)", fontFamily: "var(--ui)", fontSize: 13, marginBottom: 16, display: "inline-block" }}
        >
          ← Voltar para Vagas
        </Link>

        <section className={styles.heroVaga}>
          <div className={styles.heroVagaTop}>
            {vaga.codigo} · {VAGA_STATUS_LABEL[vaga.status] ?? vaga.status}
          </div>
          <h2 className={styles.heroVagaTitulo}>{vaga.titulo}</h2>
          <div className={styles.heroVagaTags}>
            {vaga.afirmativa ? (
              <span className={`${styles.heroVagaTag} ${styles.laranja}`}>
                ★ Vaga afirmativa · {vaga.publico_alvo ?? ""}
              </span>
            ) : null}
            {cargo ? (
              <span className={styles.heroVagaTag}>
                {cargo.nome}
                {cargo.nivel ? ` · ${cargo.nivel}` : ""}
              </span>
            ) : null}
            {dep ? (
              <span className={styles.heroVagaTag}>
                {dep.sigla ? `${dep.sigla} · ` : ""}{dep.nome}
              </span>
            ) : null}
            {local ? (
              <span className={styles.heroVagaTag}>{local.nome}</span>
            ) : null}
            {vaga.modelo_trabalho ? (
              <span className={styles.heroVagaTag}>{vaga.modelo_trabalho}</span>
            ) : null}
            {vaga.data_publicacao ? (
              <span className={styles.heroVagaTag}>
                Publicada {formatarData(vaga.data_publicacao)}
              </span>
            ) : null}
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
          <div className={shared.painel}>
            <h3 className={shared.painelTitulo}>Descrição</h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--marinho)" }}>
              {vaga.descricao_completa ?? "—"}
            </p>
            {vaga.responsabilidades ? (
              <>
                <h4 style={{ fontFamily: "var(--ui)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", marginTop: 16, marginBottom: 8, fontWeight: 700 }}>
                  Responsabilidades
                </h4>
                <p style={{ fontFamily: "var(--serif)", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--marinho)" }}>
                  {vaga.responsabilidades}
                </p>
              </>
            ) : null}
          </div>

          <aside>
            <div className={shared.painel}>
              <h3 className={shared.painelTitulo}>Detalhes</h3>
              <dl style={{ display: "grid", gap: 16, fontFamily: "var(--ui)", fontSize: 13 }}>
                {vaga.salario_min_centavos && vaga.salario_max_centavos ? (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", fontWeight: 600 }}>
                      Faixa salarial
                    </div>
                    <div style={{ fontFamily: "var(--serif)", color: "var(--marinho)", marginTop: 2 }}>
                      {formatarMoeda(vaga.salario_min_centavos)} – {formatarMoeda(vaga.salario_max_centavos)}
                    </div>
                  </div>
                ) : null}
                {vaga.jornada ? (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", fontWeight: 600 }}>
                      Jornada
                    </div>
                    <div style={{ marginTop: 2, color: "var(--marinho)" }}>{vaga.jornada}</div>
                  </div>
                ) : null}
                {gestor ? (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cinza)", fontWeight: 600 }}>
                      Solicitante
                    </div>
                    <div style={{ marginTop: 2, color: "var(--marinho)" }}>
                      {gestor.nome_completo} · mat. {gestor.matricula}
                    </div>
                  </div>
                ) : null}
              </dl>
            </div>

            {vaga.requisitos_obrigatorios && vaga.requisitos_obrigatorios.length > 0 ? (
              <div className={shared.painel}>
                <h3 className={shared.painelTitulo}>Requisitos obrigatórios</h3>
                <ul style={{ fontFamily: "var(--ui)", fontSize: 13, lineHeight: 1.6, paddingLeft: 16, color: "var(--marinho)" }}>
                  {vaga.requisitos_obrigatorios.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {vaga.beneficios && vaga.beneficios.length > 0 ? (
              <div className={shared.painel}>
                <h3 className={shared.painelTitulo}>Benefícios</h3>
                <ul style={{ fontFamily: "var(--ui)", fontSize: 13, lineHeight: 1.6, paddingLeft: 16, color: "var(--marinho)" }}>
                  {vaga.beneficios.map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>
            Pipeline ATS · {candidaturas?.length ?? 0} candidatos
          </h3>
          <Kanban
            candidaturas={candidaturas as unknown as Parameters<typeof Kanban>[0]["candidaturas"]}
          />
        </div>
      </div>
    </>
  );
}
