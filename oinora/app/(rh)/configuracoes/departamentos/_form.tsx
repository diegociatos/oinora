"use client";

import { useActionState } from "react";
import {
  salvarDepartamento,
  initialFormState,
} from "@/server/actions/configuracoes";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

type Props = {
  id: string | null;
  inicial?: {
    nome?: string;
    sigla?: string | null;
    parent_id?: string | null;
  };
  departamentosParent: Array<{ id: string; label: string }>;
};

export function FormDepartamento({ id, inicial = {}, departamentosParent }: Props) {
  const action = salvarDepartamento.bind(null, id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    initialFormState,
  );

  const fe = (campo: string): string | undefined =>
    state.status === "error" ? state.fieldErrors?.[campo] : undefined;

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}
      <div className={shared.formGrid}>
        <div className={`${shared.campo} ${shared.full}`}>
          <label htmlFor="nome">
            Nome <span className={shared.obrig}>*</span>
          </label>
          <input
            id="nome"
            name="nome"
            defaultValue={inicial.nome ?? ""}
            required
          />
          {fe("nome") ? <span className={shared.campoErro}>{fe("nome")}</span> : null}
        </div>
        <div className={shared.campo}>
          <label htmlFor="sigla">Sigla</label>
          <input
            id="sigla"
            name="sigla"
            maxLength={8}
            defaultValue={inicial.sigla ?? ""}
          />
        </div>
        <div className={shared.campo}>
          <label htmlFor="parent_id">Pai (hierarquia)</label>
          <select
            id="parent_id"
            name="parent_id"
            defaultValue={inicial.parent_id ?? ""}
          >
            <option value="">— sem pai (raiz)</option>
            {departamentosParent.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={shared.actions}>
        <a href="/configuracoes/departamentos" className={`${shared.btn} ${shared.btnFantasma}`}>
          Cancelar
        </a>
        <button
          type="submit"
          className={`${shared.btn} ${shared.btnPrimario}`}
          disabled={pending}
        >
          {pending ? "Salvando…" : id ? "Salvar alterações" : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}
