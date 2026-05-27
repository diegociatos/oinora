"use client";

import { useActionState, useState } from "react";
import {
  convidarMembro,
  initialInviteState,
} from "@/server/actions/usuarios";
import shared from "../_form.module.css";

const ROLES = [
  { v: "owner", l: "Owner (dono do tenant)" },
  { v: "admin", l: "Admin (gerencia equipe)" },
  { v: "gestor", l: "Gestor (líder de equipe)" },
  { v: "hr_ops", l: "HR Ops (DP, folha, ponto)" },
  { v: "empregado", l: "Empregado" },
  { v: "advogado_interno", l: "Advogado interno" },
];

export function FormConvidarMembro({
  empregados,
}: {
  empregados: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(
    convidarMembro,
    initialInviteState,
  );

  // Reset hint
  const [resetKey, setResetKey] = useState(0);

  return (
    <>
      {state.status === "error" ? (
        <div className={shared.alertaErro}>{state.message}</div>
      ) : null}
      {state.status === "success" ? (
        <div className={shared.alertaSucesso}>
          <strong>{state.message}</strong>
          <div style={{ marginTop: "var(--space-3)", fontFamily: "var(--ui)", fontSize: "var(--fs-xs)" }}>
            Compartilhe com o membro convidado:
            <div style={{ marginTop: "var(--space-2)" }}>
              <strong>Email:</strong> {state.email}
            </div>
            {state.senhaTemporaria ? (
              <div style={{ marginTop: "var(--space-1)" }}>
                <strong>Senha temporária:</strong>{" "}
                <code style={{ background: "rgba(0,0,0,0.06)", padding: "2px 6px" }}>
                  {state.senhaTemporaria}
                </code>
              </div>
            ) : null}
            {state.magicLink ? (
              <div style={{ marginTop: "var(--space-2)" }}>
                <strong>Magic link (válido 1h):</strong>
                <textarea
                  readOnly
                  value={state.magicLink}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                  }}
                  rows={2}
                />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setResetKey((k) => k + 1)}
            style={{
              marginTop: "var(--space-3)",
              fontFamily: "var(--ui)",
              fontSize: "var(--fs-xs)",
              background: "none",
              border: "none",
              color: "var(--laranja)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Convidar outro membro
          </button>
        </div>
      ) : null}

      {state.status !== "success" || resetKey > 0 ? (
        <form action={action} key={resetKey} noValidate>
          <div className={shared.formGrid}>
            <div className={`${shared.campo} ${shared.full}`}>
              <label>
                Email <span className={shared.obrig}>*</span>
              </label>
              <input type="email" name="email" required />
            </div>
            <div className={`${shared.campo} ${shared.full}`}>
              <label>
                Nome completo <span className={shared.obrig}>*</span>
              </label>
              <input name="nome_completo" required />
            </div>
            <div className={shared.campo}>
              <label>
                Papel <span className={shared.obrig}>*</span>
              </label>
              <select name="role" defaultValue="empregado">
                {ROLES.map((r) => (
                  <option key={r.v} value={r.v}>
                    {r.l}
                  </option>
                ))}
              </select>
            </div>
            <div className={shared.campo}>
              <label>Vincular a empregado (opcional)</label>
              <select name="empregado_id" defaultValue="">
                <option value="">—</option>
                {empregados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={shared.actions}>
            <button
              type="submit"
              className={`${shared.btn} ${shared.btnPrimario}`}
              disabled={pending}
            >
              {pending ? "Convidando…" : "Enviar convite"}
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
