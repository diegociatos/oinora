"use client";

import { useActionState } from "react";
import { registrarBatida } from "@/server/actions/folha-ponto";
import type { FormState } from "@/server/actions/empregados";
import shared from "../_form.module.css";

const initial: FormState = { status: "idle" };

export function FormBatida({
  empregados,
  locais,
}: {
  empregados: Array<{ id: string; label: string }>;
  locais: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(registrarBatida, initial);

  return (
    <form action={action} noValidate>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}
      {state.status === "success" ? (
        <div className={shared.alertaSucesso}>{state.message}</div>
      ) : null}
      <div className={shared.formGrid}>
        <div className={shared.campo}>
          <label>Empregado *</label>
          <select name="empregado_id" required defaultValue="">
            <option value="">— selecione</option>
            {empregados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div className={shared.campo}>
          <label>Tipo *</label>
          <select name="tipo" required defaultValue="entrada">
            <option value="entrada">Entrada</option>
            <option value="almoco_saida">Saída almoço</option>
            <option value="almoco_volta">Volta almoço</option>
            <option value="saida">Saída</option>
            <option value="intervalo">Intervalo</option>
          </select>
        </div>
        <div className={shared.campo}>
          <label>Local</label>
          <select name="local_id" defaultValue="">
            <option value="">—</option>
            {locais.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Justificativa (opcional · em caso de ajuste)</label>
          <input name="justificativa" placeholder="ex: bati ponto pelo app porque..." />
        </div>
      </div>
      <div className={shared.actions}>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimario}`} disabled={pending}>
          {pending ? "Registrando…" : "Registrar batida"}
        </button>
      </div>
    </form>
  );
}
