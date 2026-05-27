"use client";

import { useActionState } from "react";
import { recuperarSenha, type AuthState } from "@/server/actions/auth";
import styles from "../form.module.css";

const initial: AuthState = { status: "idle" };

export function RecoverForm({ origin }: { origin: string }) {
  const [state, action, pending] = useActionState(recuperarSenha, initial);

  return (
    <>
      {state.status === "error" ? (
        <div className={styles.alertaErro} role="alert">
          {state.message}
        </div>
      ) : null}
      {state.status === "success" ? (
        <div className={styles.alertaSucesso} role="status">
          {state.message}
        </div>
      ) : null}
      <form action={action} noValidate>
        <input type="hidden" name="origin" value={origin} />
        <div className={styles.campo}>
          <label htmlFor="email">Email da conta</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="seu.email@empresa.com.br"
            required
          />
        </div>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimario}`}
          disabled={pending}
        >
          {pending ? "Enviando…" : "Enviar link de recuperação"}
        </button>
      </form>
    </>
  );
}
