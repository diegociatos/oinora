"use client";

import { useActionState } from "react";
import { cadastrar, type AuthState } from "@/server/actions/auth";
import styles from "../form.module.css";

const initial: AuthState = { status: "idle" };

export function SignupForm({ origin }: { origin: string }) {
  const [state, action, pending] = useActionState(cadastrar, initial);

  if (state.status === "success") {
    return (
      <div className={styles.alertaSucesso} role="status">
        {state.message}
      </div>
    );
  }

  return (
    <>
      {state.status === "error" ? (
        <div className={styles.alertaErro} role="alert">
          {state.message}
        </div>
      ) : null}
      <form action={action} noValidate>
        <input type="hidden" name="origin" value={origin} />
        <div className={styles.campo}>
          <label htmlFor="nome_completo">Nome completo</label>
          <input
            type="text"
            id="nome_completo"
            name="nome_completo"
            autoComplete="name"
            placeholder="Roberto Aurora dos Santos"
            required
          />
          {state.status === "error" && state.fieldErrors?.nome_completo ? (
            <p className={styles.campoErro}>{state.fieldErrors.nome_completo}</p>
          ) : null}
        </div>
        <div className={styles.campo}>
          <label htmlFor="email">Email corporativo</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="roberto@auroraconstrutora.com.br"
            required
          />
          {state.status === "error" && state.fieldErrors?.email ? (
            <p className={styles.campoErro}>{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div className={styles.campo}>
          <label htmlFor="password">Senha (mín. 8 caracteres)</label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
          />
          {state.status === "error" && state.fieldErrors?.password ? (
            <p className={styles.campoErro}>{state.fieldErrors.password}</p>
          ) : null}
        </div>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimario}`}
          disabled={pending}
        >
          {pending ? "Criando conta…" : "Criar conta"}
        </button>
      </form>
    </>
  );
}
