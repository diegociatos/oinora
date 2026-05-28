"use client";

import { useActionState, useState } from "react";
import {
  adicionarAndamento,
  registrarAudiencia,
  initialJuridicoState,
} from "@/server/actions/juridico";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

export function FormNovoAndamento({ processoId }: { processoId: string }) {
  const action = adicionarAndamento.bind(null, processoId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    initialJuridicoState,
  );
  const [aberto, setAberto] = useState(false);
  if (state.status === "success" && aberto) setTimeout(() => setAberto(false), 200);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={btn()}
      >
        + Adicionar andamento
      </button>
    );
  }

  return (
    <form action={formAction} noValidate style={{ marginTop: 12 }}>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}
      <div className={shared.formGrid}>
        <div className={shared.campo}>
          <label>Data *</label>
          <input type="datetime-local" name="data_evento" required />
        </div>
        <div className={shared.campo}>
          <label>Tipo *</label>
          <select name="tipo" defaultValue="peticao" required>
            <option value="peticao">Petição</option>
            <option value="audiencia">Audiência</option>
            <option value="despacho">Despacho</option>
            <option value="sentenca">Sentença</option>
            <option value="recurso">Recurso</option>
            <option value="citacao">Citação</option>
            <option value="penhora">Penhora</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Título *</label>
          <input name="titulo" required />
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Descrição</label>
          <textarea name="descricao" rows={3} />
        </div>
      </div>
      <div className={shared.actions}>
        <button type="button" onClick={() => setAberto(false)} className={`${shared.btn} ${shared.btnFantasma}`}>
          Cancelar
        </button>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimario}`} disabled={pending}>
          {pending ? "…" : "Registrar"}
        </button>
      </div>
    </form>
  );
}

export function FormNovaAudiencia({ processoId }: { processoId: string }) {
  const action = registrarAudiencia.bind(null, processoId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    initialJuridicoState,
  );
  const [aberto, setAberto] = useState(false);
  if (state.status === "success" && aberto) setTimeout(() => setAberto(false), 200);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} style={btn()}>
        + Registrar audiência
      </button>
    );
  }

  return (
    <form action={formAction} noValidate style={{ marginTop: 12 }}>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}
      <div className={shared.formGrid}>
        <div className={shared.campo}>
          <label>Data e hora *</label>
          <input type="datetime-local" name="data_hora" required />
        </div>
        <div className={shared.campo}>
          <label>Tipo *</label>
          <select name="tipo" defaultValue="conciliacao_inicial" required>
            <option value="conciliacao_inicial">Conciliação inicial</option>
            <option value="instrucao">Instrução</option>
            <option value="julgamento">Julgamento</option>
            <option value="pericia">Perícia</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <div className={shared.campo}>
          <label>Vara</label>
          <input name="vara" />
        </div>
        <div className={shared.campo}>
          <label>Sala</label>
          <input name="sala" />
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Preposto designado</label>
          <input name="preposto_nome" />
        </div>
      </div>
      <div className={shared.actions}>
        <button type="button" onClick={() => setAberto(false)} className={`${shared.btn} ${shared.btnFantasma}`}>
          Cancelar
        </button>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimario}`} disabled={pending}>
          {pending ? "…" : "Registrar"}
        </button>
      </div>
    </form>
  );
}

function btn(): React.CSSProperties {
  return {
    padding: "8px 16px",
    background: "var(--branco)",
    color: "var(--juridico)",
    border: "1px solid var(--juridico)",
    borderRadius: "var(--radius-sharp)",
    fontFamily: "var(--ui)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };
}
