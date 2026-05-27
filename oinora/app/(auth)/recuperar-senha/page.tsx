import { headers } from "next/headers";
import { RecoverForm } from "./recover-form";
import styles from "../form.module.css";

export const metadata = { title: "Recuperar senha" };

export default async function RecoverPage() {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <>
      <div className={styles.filete}>Recuperar acesso</div>
      <h1 className={styles.h1}>
        Esqueceu a <em>senha</em>?
      </h1>
      <p className={styles.sub}>
        Sem problema. Informe o email da sua conta e enviaremos um link para
        você criar uma nova senha.
      </p>
      <RecoverForm origin={origin} />
      <div className={styles.footer}>
        <a href="/login">← Voltar ao login</a>
      </div>
    </>
  );
}
