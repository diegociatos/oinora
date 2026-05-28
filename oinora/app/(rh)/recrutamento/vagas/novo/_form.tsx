"use client";

import { useActionState, useState } from "react";
import { criarVaga, initialRecrutamentoState } from "@/server/actions/recrutamento";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../../_form.module.css";

type Opcao = { id: string; label: string };

const PASSOS = [
  { n: 1, label: "Identificação" },
  { n: 2, label: "Descrição" },
  { n: 3, label: "Requisitos & Benefícios" },
  { n: 4, label: "Afirmativa" },
  { n: 5, label: "Publicação" },
];

export function WizardVaga({
  cargos,
  departamentos,
  locais,
  gestores,
}: {
  cargos: Opcao[];
  departamentos: Opcao[];
  locais: Opcao[];
  gestores: Opcao[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    criarVaga,
    initialRecrutamentoState,
  );
  const [afirmativa, setAfirmativa] = useState(false);

  const fe = (c: string) =>
    state.status === "error" ? state.fieldErrors?.[c] : undefined;

  return (
    <form action={action} noValidate>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}

      {/* Steps indicator */}
      <div style={stepsBarStyle()}>
        {PASSOS.map((p) => (
          <div key={p.n} style={stepItemStyle()}>
            <span style={stepNumStyle()}>{p.n}</span>
            <span style={stepLabelStyle()}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Passo 1 · Identificação */}
      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>
          <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>1.</em>{" "}
          Identificação
        </h3>
        <div className={shared.formGrid}>
          <div className={shared.campo}>
            <label>Código *</label>
            <input
              name="codigo"
              placeholder="#2026-0050"
              required
            />
            {fe("codigo") ? <span className={shared.campoErro}>{fe("codigo")}</span> : null}
          </div>
          <div className={shared.campo}>
            <label>Título *</label>
            <input name="titulo" placeholder="Engenheiro Civil Pleno" required />
            {fe("titulo") ? <span className={shared.campoErro}>{fe("titulo")}</span> : null}
          </div>
          <div className={shared.campo}>
            <label>Cargo *</label>
            <select name="cargo_id" required defaultValue="">
              <option value="">— selecione</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {fe("cargo_id") ? <span className={shared.campoErro}>{fe("cargo_id")}</span> : null}
          </div>
          <div className={shared.campo}>
            <label>Departamento *</label>
            <select name="departamento_id" required defaultValue="">
              <option value="">— selecione</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
            {fe("departamento_id") ? <span className={shared.campoErro}>{fe("departamento_id")}</span> : null}
          </div>
          <div className={shared.campo}>
            <label>Gestor solicitante</label>
            <select name="gestor_solicitante_id" defaultValue="">
              <option value="">—</option>
              {gestores.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className={shared.campo}>
            <label>Local de trabalho</label>
            <select name="local_trabalho_id" defaultValue="">
              <option value="">—</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className={shared.campo}>
            <label>Modelo de trabalho</label>
            <select name="modelo_trabalho" defaultValue="presencial">
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
          </div>
          <div className={shared.campo}>
            <label>Jornada</label>
            <input name="jornada" placeholder="44h · 08-17 seg-sex" />
          </div>
        </div>
      </div>

      {/* Passo 2 · Descrição */}
      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>
          <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>2.</em>{" "}
          Descrição & responsabilidades
        </h3>
        <div className={shared.formGrid}>
          <div className={`${shared.campo} ${shared.full}`}>
            <label>Descrição completa *</label>
            <textarea name="descricao_completa" rows={6} required />
            {fe("descricao_completa") ? (
              <span className={shared.campoErro}>{fe("descricao_completa")}</span>
            ) : null}
          </div>
          <div className={`${shared.campo} ${shared.full}`}>
            <label>Responsabilidades</label>
            <textarea name="responsabilidades" rows={5} placeholder="Uma por linha:&#10;• Acompanhar execução de obras&#10;• Medição mensal" />
          </div>
        </div>
      </div>

      {/* Passo 3 · Requisitos & Benefícios */}
      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>
          <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>3.</em>{" "}
          Requisitos & Benefícios
        </h3>
        <div className={shared.formGrid}>
          <div className={`${shared.campo} ${shared.full}`}>
            <label>Requisitos obrigatórios (um por linha)</label>
            <textarea name="requisitos_obrigatorios_text" rows={4} placeholder="CREA-MG ativo&#10;Mín. 5 anos de experiência&#10;NR-18 e NR-35" />
          </div>
          <div className={`${shared.campo} ${shared.full}`}>
            <label>Diferenciais (um por linha)</label>
            <textarea name="requisitos_desejaveis_text" rows={3} placeholder="BIM (Revit)&#10;Inglês intermediário" />
          </div>
          <div className={`${shared.campo} ${shared.full}`}>
            <label>Benefícios (um por linha)</label>
            <textarea name="beneficios_text" rows={3} placeholder="Plano de saúde&#10;Vale alimentação" />
          </div>
          <div className={shared.campo}>
            <label>Salário mínimo (em centavos)</label>
            <input type="number" name="salario_min_centavos" placeholder="800000" />
          </div>
          <div className={shared.campo}>
            <label>Salário máximo (em centavos)</label>
            <input type="number" name="salario_max_centavos" placeholder="1300000" />
          </div>
        </div>
      </div>

      {/* Passo 4 · Afirmativa */}
      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>
          <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>4.</em>{" "}
          Vaga afirmativa?
        </h3>
        <label
          style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--ui)", fontSize: 13, marginBottom: 12 }}
        >
          <input
            type="checkbox"
            name="afirmativa"
            checked={afirmativa}
            onChange={(e) => setAfirmativa(e.currentTarget.checked)}
          />
          Esta é uma vaga afirmativa
        </label>
        {afirmativa ? (
          <div className={shared.formGrid}>
            <div className={shared.campo}>
              <label>Público-alvo</label>
              <select name="publico_alvo" defaultValue="">
                <option value="">— selecione</option>
                <option value="mulheres">Mulheres</option>
                <option value="mulheres_eng">Mulheres na engenharia</option>
                <option value="pcd">Pessoas com deficiência</option>
                <option value="pretos_pardos">Pretos e pardos</option>
                <option value="lgbtqia">LGBTQIA+</option>
                <option value="50_plus">50+</option>
                <option value="refugiados">Refugiados</option>
              </select>
            </div>
            <div className={`${shared.campo} ${shared.full}`}>
              <label>Justificativa</label>
              <textarea name="justificativa_afirmativa" rows={3} placeholder="Aumentar representatividade conforme programa interno..." />
            </div>
          </div>
        ) : null}
      </div>

      {/* Passo 5 · Publicação */}
      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>
          <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>5.</em>{" "}
          Publicação
        </h3>
        <label
          style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "var(--ui)", fontSize: 13 }}
        >
          <input type="checkbox" name="publicar" defaultChecked style={{ marginTop: 3 }} />
          <span>
            <strong style={{ color: "var(--marinho)" }}>Publicar imediatamente no portal</strong>
            <br />
            <span style={{ color: "var(--cinza)", fontSize: 12 }}>
              Se desmarcado, vaga ficará como rascunho e você pode publicar depois pelo botão na ficha da vaga.
            </span>
          </span>
        </label>
      </div>

      <div className={shared.actions}>
        <a href="/recrutamento/vagas" className={`${shared.btn} ${shared.btnFantasma}`}>
          Cancelar
        </a>
        <button
          type="submit"
          className={`${shared.btn} ${shared.btnPrimario}`}
          disabled={pending}
        >
          {pending ? "Criando vaga…" : "Criar vaga"}
        </button>
      </div>
    </form>
  );
}

function stepsBarStyle(): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    background: "var(--branco)",
    border: "1px solid var(--cinza-cl)",
    borderRadius: "var(--radius-sharp)",
    padding: "12px 16px",
    marginBottom: 16,
  };
}
function stepItemStyle(): React.CSSProperties {
  return { display: "flex", alignItems: "center", gap: 8 };
}
function stepNumStyle(): React.CSSProperties {
  return {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "var(--laranja-cl)",
    color: "var(--laranja-esc)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--serif)",
    fontStyle: "italic",
    fontSize: 12,
    fontWeight: 600,
  };
}
function stepLabelStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--ui)",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--marinho-med)",
    fontWeight: 600,
  };
}
