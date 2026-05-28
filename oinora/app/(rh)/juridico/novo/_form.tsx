"use client";

import { useActionState } from "react";
import { criarProcesso, initialJuridicoState } from "@/server/actions/juridico";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

export function FormProcesso() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    criarProcesso,
    initialJuridicoState,
  );
  const fe = (c: string) =>
    state.status === "error" ? state.fieldErrors?.[c] : undefined;

  return (
    <form action={action} noValidate>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}

      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>Identificação do processo</h3>
        <div className={shared.formGrid}>
          <div className={shared.campo}>
            <label>Número CNJ *</label>
            <input name="cnj_numero" placeholder="0011234-56.2024.5.03.0021" required />
            {fe("cnj_numero") ? <span className={shared.campoErro}>{fe("cnj_numero")}</span> : null}
          </div>
          <div className={shared.campo}>
            <label>Tipo de ação</label>
            <input name="tipo_acao" placeholder="reclamatoria_trabalhista" defaultValue="reclamatoria_trabalhista" />
          </div>
          <div className={shared.campo}>
            <label>Vara *</label>
            <input name="vara" placeholder="1ª VT Belo Horizonte" required />
            {fe("vara") ? <span className={shared.campoErro}>{fe("vara")}</span> : null}
          </div>
          <div className={shared.campo}>
            <label>Juiz(a)</label>
            <input name="juiz_nome" placeholder="Dra. Mariana Lopes" />
          </div>
          <div className={shared.campo}>
            <label>Comarca</label>
            <input name="comarca" placeholder="Belo Horizonte" />
          </div>
          <div className={shared.campo}>
            <label>UF</label>
            <input name="uf" maxLength={2} style={{ textTransform: "uppercase" }} placeholder="MG" />
          </div>
        </div>
      </div>

      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>Reclamante</h3>
        <div className={shared.formGrid}>
          <div className={shared.campo}>
            <label>Nome *</label>
            <input name="reclamante_nome" required />
            {fe("reclamante_nome") ? <span className={shared.campoErro}>{fe("reclamante_nome")}</span> : null}
          </div>
          <div className={shared.campo}>
            <label>CPF</label>
            <input name="reclamante_cpf" placeholder="000.000.000-00" />
          </div>
        </div>
      </div>

      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>Dados processuais</h3>
        <div className={shared.formGrid}>
          <div className={shared.campo}>
            <label>Data de ajuizamento *</label>
            <input type="date" name="data_ajuizamento" required />
          </div>
          <div className={shared.campo}>
            <label>Fase *</label>
            <select name="fase" defaultValue="conhecimento" required>
              <option value="pre_processual">Pré-processual</option>
              <option value="conhecimento">Conhecimento</option>
              <option value="instrucao">Instrução</option>
              <option value="sentenciado">Sentenciado</option>
              <option value="recurso_ordinario">Rec. ordinário</option>
              <option value="recurso_revista">Rec. revista</option>
              <option value="execucao">Execução</option>
              <option value="acordo">Acordo</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>
          <div className={shared.campo}>
            <label>Valor da causa (centavos) *</label>
            <input type="number" name="valor_causa_centavos" required />
          </div>
          <div className={shared.campo}>
            <label>Pleitos (separados por vírgula)</label>
            <input name="pleitos_text" placeholder="horas_extras_50, fgts, insalubridade_nr15" />
          </div>
        </div>
      </div>

      <div className={shared.painel}>
        <h3 className={shared.painelTitulo}>Risco & Provisão (CPC 25)</h3>
        <div className={shared.formGrid}>
          <div className={shared.campo}>
            <label>Risco *</label>
            <select name="risco" defaultValue="em_analise" required>
              <option value="remoto">Remoto</option>
              <option value="possivel">Possível</option>
              <option value="provavel">Provável</option>
              <option value="em_analise">Em análise</option>
            </select>
          </div>
          <div className={shared.campo}>
            <label>Provisão (centavos)</label>
            <input type="number" name="provisao_centavos" />
          </div>
        </div>
      </div>

      <div className={shared.actions}>
        <a href="/juridico" className={`${shared.btn} ${shared.btnFantasma}`}>
          Cancelar
        </a>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimario}`} disabled={pending}>
          {pending ? "Criando…" : "Cadastrar processo"}
        </button>
      </div>
    </form>
  );
}
