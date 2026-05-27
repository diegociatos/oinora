import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata = { title: "Sem acesso" };

export default async function SemAcessoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className={styles.tela}>
      <div className={styles.box}>
        <span className={styles.logo}>
          <span className="oi">Oi</span>
          <span className="nora">Nora</span>
        </span>
        <h1>
          Sua conta foi criada, mas <em>ainda não está vinculada</em> a nenhuma
          empresa.
        </h1>
        <p>
          Conta: <strong>{user?.email}</strong>
        </p>
        <p>
          Peça ao responsável de RH da sua empresa que envie um convite para
          este email. Se você é o owner da empresa, entre em contato com a Oi
          Nora — vamos te ajudar a configurar o tenant.
        </p>
        <form action="/auth/signout" method="post">
          <button type="submit" className={styles.btn}>
            Sair e tentar com outro email
          </button>
        </form>
      </div>
    </div>
  );
}
