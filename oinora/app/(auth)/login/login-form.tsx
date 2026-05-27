"use client";

import { useActionState } from "react";
import {
  entrarComSenha,
  entrarComMagicLink,
  type AuthState,
} from "@/server/actions/auth";
import styles from "../form.module.css";

const initial: AuthState = { status: "idle" };

export function LoginForm({ origin }: { origin: string }) {
  const [stateSenha, actionSenha, pendingSenha] = useActionState(
    entrarComSenha,
    initial,
  );
  const [stateMagic, actionMagic, pendingMagic] = useActionState(
    entrarComMagicLink,
    initial,
  );

  return (
    <>
      {stateSenha.status === "error" ? (
        <div className={styles.alertaErro} role="alert">
          {stateSenha.message}
        </div>
      ) : null}
      {stateMagic.status === "success" ? (
        <div className={styles.alertaSucesso} role="status">
          {stateMagic.message}
        </div>
      ) : null}
      {stateMagic.status === "error" ? (
        <div className={styles.alertaErro} role="alert">
          {stateMagic.message}
        </div>
      ) : null}

      <form action={actionSenha} noValidate>
        <input type="hidden" name="origin" value={origin} />
        <div className={styles.campo}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="seu.email@empresa.com.br"
            required
          />
          {stateSenha.status === "error" && stateSenha.fieldErrors?.email ? (
            <p className={styles.campoErro}>{stateSenha.fieldErrors.email}</p>
          ) : null}
        </div>
        <div className={styles.campo}>
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
          {stateSenha.status === "error" && stateSenha.fieldErrors?.password ? (
            <p className={styles.campoErro}>{stateSenha.fieldErrors.password}</p>
          ) : null}
        </div>
        <div className={styles.row}>
          <span />
          <a href="/recuperar-senha">Esqueci minha senha</a>
        </div>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimario}`}
          disabled={pendingSenha}
        >
          {pendingSenha ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <div className={styles.divider}>ou</div>

      <form action={actionMagic} noValidate>
        <input type="hidden" name="origin" value={origin} />
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="seu.email@empresa.com.br"
          required
          style={{ display: "none" }}
          aria-hidden="true"
        />
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnFantasma}`}
          disabled={pendingMagic}
          onClick={(e) => {
            // copia o email do form de senha pro form de magic link
            const senhaForm = (e.currentTarget.form
              ?.previousElementSibling as HTMLDivElement | null)?.previousElementSibling;
            // fallback: pega input email do form de senha
            const emailInput = document.getElementById(
              "email",
            ) as HTMLInputElement | null;
            const formEl = e.currentTarget.form;
            if (emailInput && formEl) {
              const magicEmail = formEl.querySelector(
                'input[name="email"]',
              ) as HTMLInputElement | null;
              if (magicEmail) magicEmail.value = emailInput.value;
            }
          }}
        >
          {pendingMagic ? "Enviando…" : "Receber link mágico no email"}
        </button>
      </form>
    </>
  );
}
