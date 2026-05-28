"use client";

import { useActionState } from "react";
import { criarOnboarding, initialOnbState } from "@/server/actions/onboarding-novo";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

type Opcao = { id: string; label: string };

export function FormCriarOnboarding({
  empregados,
  templates,
}: {
  empregados: Opcao[];
  templates: Opcao[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    criarOnboarding,
    initialOnbState,
  );

  return (
    <form action={action} noValidate>
      {state.status === "error" ? <div className={shared.alertaErro}>{state.message}</div> : null}
      <div className={shared.formGrid}>
        <div className={shared.campo}>
          <label>Empregado a integrar *</label>
          <select name="empregado_id" required defaultValue="">
            <option value="">— selecione</option>
            {empregados.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
        <div className={shared.campo}>
          <label>Template de onboarding *</label>
          <select name="template_id" required defaultValue="">
            <option value="">— selecione</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className={shared.campo}>
          <label>Mentor (opcional)</label>
          <select name="mentor_id" defaultValue="">
            <option value="">—</option>
            {empregados.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
        <div className={shared.campo}>
          <label>Data de início *</label>
          <input type="date" name="data_inicio" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
      </div>
      <div className={shared.actions}>
        <a href="/onboarding" className={`${shared.btn} ${shared.btnFantasma}`}>
          Cancelar
        </a>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimario}`} disabled={pending}>
          {pending ? "Criando…" : "Criar onboarding"}
        </button>
      </div>
    </form>
  );
}
