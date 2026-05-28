"use client";

import { useTransition } from "react";
import { moverCandidato } from "@/server/actions/recrutamento";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/utils/stages";
import styles from "../../page.module.css";

type Candidatura = {
  id: string;
  stage: string;
  score_ia: number | null;
  parecer_triagem: string | null;
  candidato: {
    id: string;
    nome_completo: string;
    email: string;
    cidade: string | null;
    uf: string | null;
  };
};

export function Kanban({ candidaturas }: { candidaturas: Candidatura[] }) {
  const grupos: Record<string, Candidatura[]> = {};
  for (const c of candidaturas) {
    (grupos[c.stage] ??= []).push(c);
  }

  return (
    <div className={styles.kanban}>
      {STAGE_ORDER.map((stage) => (
        <div key={stage} className={styles.coluna}>
          <div className={styles.colunaTitulo}>
            <span>{STAGE_LABEL[stage]}</span>
            <span>{grupos[stage]?.length ?? 0}</span>
          </div>
          <div className={styles.colunaItens}>
            {(grupos[stage] ?? []).map((c) => (
              <Card key={c.id} cand={c} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ cand }: { cand: Candidatura }) {
  const [pending, start] = useTransition();
  const stageAtual = cand.stage;
  const proxStageIdx =
    (STAGE_ORDER as readonly string[]).indexOf(stageAtual) + 1;
  const proxStage =
    proxStageIdx < STAGE_ORDER.length ? STAGE_ORDER[proxStageIdx] : null;

  return (
    <article className={styles.candCard}>
      <div className={styles.candNome}>{cand.candidato.nome_completo}</div>
      <div className={styles.candEmail}>
        {cand.candidato.email}
        {cand.candidato.cidade
          ? ` · ${cand.candidato.cidade}${cand.candidato.uf ? `/${cand.candidato.uf}` : ""}`
          : ""}
      </div>
      {cand.score_ia ? (
        <div className={styles.candScore}>{cand.score_ia}%</div>
      ) : null}
      {cand.parecer_triagem ? (
        <div
          style={{
            fontSize: 11,
            color: "var(--cinza)",
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {cand.parecer_triagem.slice(0, 110)}
          {cand.parecer_triagem.length > 110 ? "…" : ""}
        </div>
      ) : null}
      {proxStage ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const r = await moverCandidato(cand.id, proxStage);
              if (r.status === "error") alert(r.message);
            });
          }}
          style={{
            marginTop: 8,
            padding: "4px 8px",
            background: "var(--laranja-cl)",
            color: "var(--laranja-esc)",
            border: "1px solid var(--laranja)",
            borderRadius: "var(--radius-sharp)",
            fontFamily: "var(--ui)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {pending ? "movendo…" : `→ ${STAGE_LABEL[proxStage]}`}
        </button>
      ) : null}
    </article>
  );
}
