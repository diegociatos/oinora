"use client";

import { useActionState } from "react";
import { salvarCargo, initialFormState } from "@/server/actions/configuracoes";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

type Inicial = {
  codigo?: string;
  nome?: string;
  cbo?: string | null;
  nivel?: string | null;
  departamento_id?: string | null;
  faixa_salarial_min_centavos?: number | null;
  faixa_salarial_max_centavos?: number | null;
  jornada_horas_semana?: number | null;
};

export function FormCargo({
  id,
  inicial = {},
  departamentos,
}: {
  id: string | null;
  inicial?: Inicial;
  departamentos: Array<{ id: string; label: string }>;
}) {
  const action = salvarCargo.bind(null, id);
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
          {fe("codigo") ? <span className={shared.campoErro}>{fe("codigo")}</span> : null}
        </div>
        <div className={shared.campo}>
          <label>Nível</label>
          <select name="nivel" defaultValue={inicial.nivel ?? ""}>
            <option value="">—</option>
            <option value="jr">Jr</option>
            <option value="pl">Pleno</option>
            <option value="sr">Sr</option>
            <option value="espec">Especialista / Coord / Diretor</option>
          </select>
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Nome *</label>
          <input name="nome" defaultValue={inicial.nome ?? ""} required />
          {fe("nome") ? <span className={shared.campoErro}>{fe("nome")}</span> : null}
        </div>
        <div className={shared.campo}>
          <label>CBO</label>
          <input name="cbo" defaultValue={inicial.cbo ?? ""} maxLength={7} />
        </div>
        <div className={shared.campo}>
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
        <div className={shared.campo}>
          <label>Faixa min (centavos)</label>
          <input
            type="number"
            name="faixa_salarial_min_centavos"
            defaultValue={inicial.faixa_salarial_min_centavos?.toString() ?? ""}
          />
        </div>
        <div className={shared.campo}>
          <label>Faixa max (centavos)</label>
          <input
            type="number"
            name="faixa_salarial_max_centavos"
            defaultValue={inicial.faixa_salarial_max_centavos?.toString() ?? ""}
          />
        </div>
        <div className={shared.campo}>
          <label>Jornada (horas/semana)</label>
          <input
            type="number"
            step="0.01"
            name="jornada_horas_semana"
            defaultValue={inicial.jornada_horas_semana?.toString() ?? ""}
          />
        </div>
      </div>
      <div className={shared.actions}>
        <a href="/configuracoes/cargos" className={`${shared.btn} ${shared.btnFantasma}`}>
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
