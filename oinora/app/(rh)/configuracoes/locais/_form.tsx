"use client";

import { useActionState } from "react";
import { salvarLocal, initialFormState } from "@/server/actions/configuracoes";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

type Endereco = {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
};

export function FormLocal({
  id,
  inicial = {},
}: {
  id: string | null;
  inicial?: {
    nome?: string;
    raio_metros?: number;
    ativo?: boolean;
    endereco?: Endereco | null;
  };
}) {
  const action = salvarLocal.bind(null, id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    initialFormState,
  );
  const fe = (c: string) =>
    state.status === "error" ? state.fieldErrors?.[c] : undefined;
  const end = inicial.endereco ?? {};

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}
      <div className={shared.formGrid}>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Nome do local *</label>
          <input name="nome" defaultValue={inicial.nome ?? ""} required />
          {fe("nome") ? <span className={shared.campoErro}>{fe("nome")}</span> : null}
        </div>
        <div className={shared.campo}>
          <label>Raio de geofence (metros)</label>
          <input
            type="number"
            name="raio_metros"
            defaultValue={inicial.raio_metros ?? 100}
            min={1}
          />
        </div>
        <div
          className={shared.campo}
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <input
            type="checkbox"
            name="ativo"
            id="ativo"
            defaultChecked={inicial.ativo ?? true}
          />
          <label htmlFor="ativo" style={{ marginBottom: 0 }}>
            Local ativo
          </label>
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>Logradouro</label>
          <input name="endereco_logradouro" defaultValue={end.logradouro ?? ""} />
        </div>
        <div className={shared.campo}>
          <label>Número</label>
          <input name="endereco_numero" defaultValue={end.numero ?? ""} />
        </div>
        <div className={shared.campo}>
          <label>Bairro</label>
          <input name="endereco_bairro" defaultValue={end.bairro ?? ""} />
        </div>
        <div className={shared.campo}>
          <label>Cidade</label>
          <input name="endereco_cidade" defaultValue={end.cidade ?? ""} />
        </div>
        <div className={shared.campo}>
          <label>UF</label>
          <input
            name="endereco_uf"
            defaultValue={end.uf ?? ""}
            maxLength={2}
            style={{ textTransform: "uppercase" }}
          />
        </div>
        <div className={shared.campo}>
          <label>CEP</label>
          <input name="endereco_cep" defaultValue={end.cep ?? ""} />
        </div>
      </div>
      <div className={shared.actions}>
        <a href="/configuracoes/locais" className={`${shared.btn} ${shared.btnFantasma}`}>
          Cancelar
        </a>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimario}`} disabled={pending}>
          {pending ? "Salvando…" : id ? "Salvar" : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}
