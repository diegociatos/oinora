import type { ReactNode } from "react";
import styles from "./layout.module.css";

const FEATURES = [
  {
    sigla: "M",
    titulo: "Multi-tenant com RLS",
    desc: "Cada empresa cliente tem seus dados isolados a nível de banco.",
  },
  {
    sigla: "N",
    titulo: "Nora — IA aplicada a RH",
    desc: "Triagem de CV, cálculo de risco e sugestões com Claude.",
  },
  {
    sigla: "L",
    titulo: "LGPD por padrão",
    desc: "Auditoria automática em toda alteração de dados pessoais.",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.brand} aria-hidden="true">
        <div className={styles.brandTop}>
          <span className={styles.logo}>
            <span className={styles.logoOi}>Oi</span>
            <span className={styles.logoNora}>Nora</span>
          </span>
          <div className={styles.tag}>Plataforma de gente · 2026</div>
        </div>
        <div className={styles.titulo}>
          <h2>
            Recrutamento, RH, Folha, Ponto e <em>Jurídico Trabalhista</em>
            <br />
            num único fluxo.
          </h2>
          <p>
            Construído para empresas brasileiras de construção civil que querem
            operar com sofisticação sem perder o cuidado de quem conhece cada
            pessoa pelo nome.
          </p>
          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div key={f.sigla} className={styles.feature}>
                <span className={styles.featureIc}>{f.sigla}</span>
                <div className={styles.featureText}>
                  <strong>{f.titulo}</strong>
                  <span>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.brandBottom}>
          <span>© 2026 Oi Nora · todos os direitos reservados</span>
          <span>v0.1 · MVP 1</span>
        </div>
      </aside>
      <section className={styles.form}>
        <div className={styles.formWrap}>{children}</div>
      </section>
    </div>
  );
}
