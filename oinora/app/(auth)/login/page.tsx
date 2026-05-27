import { headers } from "next/headers";
import { LoginForm } from "./login-form";
import styles from "../form.module.css";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <>
      <div className={styles.filete}>Acesso à plataforma</div>
      <h1 className={styles.h1}>
        Bem-vindo de volta à <em>Oi Nora</em>
      </h1>
      <p className={styles.sub}>
        Entre com seu email e senha. Se ainda não tem conta, peça convite ao
        responsável de RH da sua empresa.
      </p>
      {params.error ? (
        <div className={styles.alertaErro} role="alert">
          {params.error}
        </div>
      ) : null}
      <LoginForm origin={origin} />
      <div className={styles.footer}>
        Primeira vez aqui? <a href="/signup">Criar conta da empresa</a>
      </div>
    </>
  );
}
