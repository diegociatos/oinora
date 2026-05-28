"use client";

import { useActionState, useState, useTransition } from "react";
import {
  salvarDependente,
  removerDependente,
  initialDependenteState,
} from "@/server/actions/dependentes";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

type Dep = {
  id: string;
  nome_completo: string;
  cpf: string | null;
  data_nascimento: string;
  parentesco: string;
  ir_dependente: boolean;
  salario_familia: boolean;
  plano_saude: boolean;
};

export function FormDependente({
  empregadoId,
  dependente,
  onDone,
}: {
  empregadoId: string;
  dependente: Dep | null;
  onDone: () => void;
}) {
  const action = salvarDependente.bind(
    null,
    empregadoId,
    dependente?.id ?? null,
  );
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    initialDependenteState,
  );

  // Quando sucesso, fecha o painel
  if (state.status === "success") {
    setTimeout(onDone, 100);
  }

  const fe = (c: string) =>
    state.status === "error" ? state.fieldErrors?.[c] : undefined;

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}
      <div className={shared.formGrid}>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>
            Nome completo <span className={shared.obrig}>*</span>
          </label>
          <input
            name="nome_completo"
            defaultValue={dependente?.nome_completo ?? ""}
            required
          />
          {fe("nome_completo") ? (
            <span className={shared.campoErro}>{fe("nome_completo")}</span>
          ) : null}
        </div>
        <div className={shared.campo}>
          <label>CPF</label>
          <input name="cpf" defaultValue={dependente?.cpf ?? ""} />
          {fe("cpf") ? <span className={shared.campoErro}>{fe("cpf")}</span> : null}
        </div>
        <div className={shared.campo}>
          <label>
            Data de nascimento <span className={shared.obrig}>*</span>
          </label>
          <input
            type="date"
            name="data_nascimento"
            defaultValue={dependente?.data_nascimento ?? ""}
            required
          />
        </div>
        <div className={`${shared.campo} ${shared.full}`}>
          <label>
            Parentesco <span className={shared.obrig}>*</span>
          </label>
          <select
            name="parentesco"
            defaultValue={dependente?.parentesco ?? "Filho"}
          >
            <option value="Cônjuge">Cônjuge</option>
            <option value="Filho">Filho</option>
            <option value="Filha">Filha</option>
            <option value="Enteado">Enteado(a)</option>
            <option value="Pai">Pai</option>
            <option value="Mãe">Mãe</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontFamily: "var(--ui)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <input
            type="checkbox"
            name="ir_dependente"
            defaultChecked={dependente?.ir_dependente ?? false}
          />
          Dependente IR
        </label>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontFamily: "var(--ui)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <input
            type="checkbox"
            name="salario_familia"
            defaultChecked={dependente?.salario_familia ?? false}
          />
          Salário-família
        </label>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontFamily: "var(--ui)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <input
            type="checkbox"
            name="plano_saude"
            defaultChecked={dependente?.plano_saude ?? false}
          />
          Plano de saúde
        </label>
      </div>
      <div className={shared.actions}>
        <button
          type="button"
          onClick={onDone}
          className={`${shared.btn} ${shared.btnFantasma}`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={`${shared.btn} ${shared.btnPrimario}`}
          disabled={pending}
        >
          {pending ? "Salvando…" : dependente ? "Salvar" : "Adicionar"}
        </button>
      </div>
    </form>
  );
}

export function BotaoRemoverDependente({
  empregadoId,
  dependenteId,
  nome,
}: {
  empregadoId: string;
  dependenteId: string;
  nome: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Remover dependente "${nome}"?`)) {
          start(async () => {
            const r = await removerDependente(empregadoId, dependenteId);
            if (r.status === "error") alert(r.message);
          });
        }
      }}
      style={{
        background: "none",
        border: "none",
        color: "var(--cinza)",
        cursor: "pointer",
        fontFamily: "var(--ui)",
        fontSize: "var(--fs-xs)",
        marginLeft: 8,
      }}
    >
      {pending ? "…" : "remover"}
    </button>
  );
}

export function DependentesContainer({
  empregadoId,
  dependentes,
}: {
  empregadoId: string;
  dependentes: Dep[];
}) {
  const [editando, setEditando] = useState<Dep | "novo" | null>(null);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <strong style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)" }}>
          {dependentes.length} {dependentes.length === 1 ? "registro" : "registros"}
        </strong>
        {editando === null ? (
          <button
            type="button"
            onClick={() => setEditando("novo")}
            style={{
              padding: "8px 16px",
              background: "var(--laranja)",
              color: "var(--branco)",
              border: "none",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: "var(--fs-sm)",
              cursor: "pointer",
            }}
          >
            + Adicionar dependente
          </button>
        ) : null}
      </div>

      {editando !== null ? (
        <div className={shared.painel}>
          <h4
            style={{
              fontFamily: "var(--serif)",
              fontSize: "var(--fs-md)",
              marginBottom: 12,
              color: "var(--marinho)",
            }}
          >
            {editando === "novo" ? "Novo dependente" : `Editar ${editando.nome_completo}`}
          </h4>
          <FormDependente
            empregadoId={empregadoId}
            dependente={editando === "novo" ? null : editando}
            onDone={() => setEditando(null)}
          />
        </div>
      ) : null}

      {dependentes.length === 0 && editando === null ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            fontFamily: "var(--ui)",
            fontSize: 13,
            color: "var(--cinza)",
            border: "1px dashed var(--cinza-cl)",
            borderRadius: "var(--radius-sharp)",
          }}
        >
          Nenhum dependente cadastrado.
        </div>
      ) : null}

      {dependentes.length > 0 ? (
        <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cinza-cl)" }}>
              <th style={th()}>Nome</th>
              <th style={th()}>Parentesco</th>
              <th style={th()}>Nascimento</th>
              <th style={th()}>IR</th>
              <th style={th()}>Sal.família</th>
              <th style={th()}>Plano</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dependentes.map((d) => (
              <tr
                key={d.id}
                style={{ borderBottom: "1px dashed var(--cinza-cl)" }}
              >
                <td style={td()}>{d.nome_completo}</td>
                <td style={td()}>{d.parentesco}</td>
                <td style={td()}>
                  {new Date(d.data_nascimento).toLocaleDateString("pt-BR")}
                </td>
                <td style={td()}>
                  <Bolinha on={d.ir_dependente} />
                </td>
                <td style={td()}>
                  <Bolinha on={d.salario_familia} />
                </td>
                <td style={td()}>
                  <Bolinha on={d.plano_saude} />
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => setEditando(d)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--cinza)",
                      cursor: "pointer",
                      fontFamily: "var(--ui)",
                      fontSize: 12,
                    }}
                  >
                    editar
                  </button>
                  <BotaoRemoverDependente
                    empregadoId={empregadoId}
                    dependenteId={d.id}
                    nome={d.nome_completo}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
}

function Bolinha({ on }: { on: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: on ? "var(--verde)" : "var(--cinza-cl)",
      }}
    />
  );
}

function th(): React.CSSProperties {
  return {
    textAlign: "left",
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--cinza)",
    fontWeight: 700,
    padding: "8px 12px 8px 0",
  };
}

function td(): React.CSSProperties {
  return { padding: "10px 12px 10px 0", color: "var(--marinho)" };
}

