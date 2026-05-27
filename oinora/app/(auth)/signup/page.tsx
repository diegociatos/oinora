import { headers } from "next/headers";
import { SignupForm } from "./signup-form";
import styles from "../form.module.css";

export const metadata = { title: "Criar conta" };

export default async function SignupPage() {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <>
      <div className={styles.filete}>Nova conta</div>
      <h1 className={styles.h1}>
        Comece o <em>trial gratuito</em> de 14 dias
      </h1>
      <p className={styles.sub}>
        Sem cartão de crédito. Você cria sua conta agora e configuramos a
        empresa nos próximos passos.
      </p>
      <SignupForm origin={origin} />
      <div className={styles.footer}>
        Já tem conta? <a href="/login">Entrar</a>
      </div>
    </>
  );
}
