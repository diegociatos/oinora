"use client";

import { useActionState } from "react";
import {
  salvarCentroCusto,
  initialFormState,
} from "@/server/actions/configuracoes";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

export function FormCentroCusto({
  id,
  inicial = {},
  departamentos,
}: {
  id: string | null;
  inicial?: { codigo?: string; nome?: string; departamento_id?: string | null };
  departamentos: Array<{ id: string; label: string }>;
}) {
  const action = salvarCentroCusto.bind(null, id);
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
        <div className={shared.campo}>
          <label>Código *</label>
          <input name="codigo" defaultValue={inicial.codigo ?? ""} required />
          {fe("codigo") ? (
            <span className={shared.campoErro}>{fe("codigo")}</span>
          ) : null}
        </div>
        <div className={shared.campo}>
          <label>Nome *</label>
          <input name="nome" defaultValue={inicial.nome ?? ""} required />
          {fe("nome") ? (
            <span className={shared.campoErro}>{fe("nome")}</span>
          ) : null}
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Departamento</label>
          <select
            name="departamento_id"
            defaultValue={inicial.departamento_id ?? ""}
          >
            <option value="">—</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={shared.actions}>
        <a
          href="/configuracoes/centros-custo"
          className={`${shared.btn} ${shared.btnFantasma}`}
        >
          Cancelar
        </a>
        <button
          type="submit"
          className={`${shared.btn} ${shared.btnPrimario}`}
          disabled={pending}
        >
          {pending ? "Salvando…" : id ? "Salvar" : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}
