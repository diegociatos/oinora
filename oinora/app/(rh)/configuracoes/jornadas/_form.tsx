"use client";

import { useActionState } from "react";
import { salvarJornada, initialFormState } from "@/server/actions/configuracoes";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

export function FormJornada({
  id,
  inicial = {},
}: {
  id: string | null;
  inicial?: { nome?: string; horas_semana?: number };
}) {
  const action = salvarJornada.bind(null, id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    initialFormState,
  );
  const fe = (c: string) =>
    state.status === "error" ? state.fieldErrors?.[c] : undefined;

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}
      <div className={shared.formGrid}>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Nome *</label>
          <input name="nome" defaultValue={inicial.nome ?? ""} required />
          {fe("nome") ? <span className={shared.campoErro}>{fe("nome")}</span> : null}
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Horas/semana *</label>
          <input
            type="number"
            step="0.01"
            name="horas_semana"
            defaultValue={inicial.horas_semana?.toString() ?? "44"}
            required
          />
          {fe("horas_semana") ? (
            <span className={shared.campoErro}>{fe("horas_semana")}</span>
          ) : null}
        </div>
      </div>
      <div className={shared.actions}>
        <a href="/configuracoes/jornadas" className={`${shared.btn} ${shared.btnFantasma}`}>
          Cancelar
        </a>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimario}`} disabled={pending}>
          {pending ? "Salvando…" : id ? "Salvar" : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}
