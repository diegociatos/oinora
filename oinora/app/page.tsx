import styles from "./page.module.css";

const PLANOS = [
  {
    nome: "Essencial",
    valor: "R$ 990",
    limite: "Até 30 empregados",
    itens: [
      "ATS de recrutamento completo",
      "Cadastro de empregados",
      "Portal do candidato",
      "Audit log + LGPD",
      "Suporte por email",
    ],
    cta: "Começar trial",
    destaque: false,
  },
  {
    nome: "Profissional",
    valor: "R$ 2.490",
    limite: "Até 100 empregados",
    itens: [
      "Tudo do Essencial",
      "Folha de pagamento + eSocial",
      "Ponto eletrônico com geofence",
      "Onboarding + Treinamentos",
      "Avaliação 9-Box",
      "Suporte prioritário",
    ],
    cta: "Começar trial",
    destaque: true,
  },
  {
    nome: "Premium",
    valor: "R$ 4.990",
    limite: "Até 500 empregados",
    itens: [
      "Tudo do Profissional",
      "Jurídico Trabalhista completo",
      "IA Nora (Claude Opus 4.7)",
      "Cálculo de risco de processos",
      "Headcount & quadro orçamentário",
      "Customer Success dedicado",
    ],
    cta: "Falar com vendas",
    destaque: false,
  },
] as const;

const MODULOS = [
  {
    sigla: "R",
    titulo: "Recrutamento & Seleção",
    desc: "ATS completo, portal do candidato, triagem com IA, banco de talentos e wizard de vagas afirmativas.",
  },
  {
    sigla: "P",
    titulo: "Gestão de Pessoas",
    desc: "Ficha do empregado em 7 abas, dependentes, documentos, movimentações e histórico auditável.",
  },
  {
    sigla: "F",
    titulo: "Folha & Ponto",
    desc: "Folha de pagamento, eSocial (S-1200, S-2200, S-2210, S-2299), ponto eletrônico com biometria e geofence.",
  },
  {
    sigla: "J",
    titulo: "Jurídico Trabalhista",
    desc: "Gestão de processos, cálculo de risco financeiro com Claude Opus, sugestão de acordos e similaridade entre casos.",
  },
] as const;

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={`container ${styles.topbarInner}`}>
          <span className="oinora-logo" aria-label="Oi Nora">
            <span className="oi">Oi</span>
            <span className="nora">Nora</span>
          </span>
          <nav aria-label="Navegação principal" className={styles.topbarNav}>
            <a href="#produto">Produto</a>
            <a href="#planos">Planos</a>
            <a href="#contato">Contato</a>
            <a className={styles.topbarCta} href="/login">
              Entrar
            </a>
          </nav>
        </div>
      </header>

      <main id="conteudo-principal">
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroLogo} aria-hidden="true">
              <span className={styles.heroLogoOi}>Oi</span>
              <span className={styles.heroLogoNora}>Nora</span>
            </div>
            <h1 className={styles.heroH1}>
              Recrutamento, <em>Gestão de Pessoas</em>, Folha, Ponto e Jurídico
              Trabalhista em uma só plataforma.
            </h1>
            <p className={styles.heroSub}>
              Construído para empresas brasileiras de construção civil que querem operar
              com a sofisticação de uma multinacional sem perder o cuidado de quem
              conhece cada pessoa pelo nome.
            </p>
            <div className={styles.heroTags}>
              <span className={`${styles.heroTag} ${styles.heroTagLaranja}`}>
                ★ IA Nora · Claude Opus 4.7
              </span>
              <span className={styles.heroTag}>Multi-tenant · LGPD</span>
              <span className={styles.heroTag}>eSocial S-1200 a S-2299</span>
              <span className={styles.heroTag}>
                Construção civil 50 – 500 empregados
              </span>
            </div>
            <div className={styles.heroStats}>
              <div>
                <div className={styles.heroStatNum}>18</div>
                <div className={styles.heroStatLabel}>Módulos integrados</div>
              </div>
              <div>
                <div className={styles.heroStatNum}>10</div>
                <div className={styles.heroStatLabel}>Papéis de usuário</div>
              </div>
              <div>
                <div className={styles.heroStatNum}>45+</div>
                <div className={styles.heroStatLabel}>Tabelas auditadas</div>
              </div>
              <div>
                <div className={styles.heroStatNum}>4mo</div>
                <div className={styles.heroStatLabel}>Para produção</div>
              </div>
            </div>
          </div>
        </section>

        <section id="produto" className={styles.section}>
          <div className="container">
            <header className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                Quatro produtos, <em>um só fluxo</em>
              </h2>
              <p className={styles.sectionSub}>
                Da publicação da vaga até a audiência trabalhista — toda a jornada de
                pessoas numa plataforma única, com IA que entende construção civil
                brasileira.
              </p>
            </header>
            <div className={styles.modulos}>
              {MODULOS.map((m) => (
                <article key={m.sigla} className={styles.modulo}>
                  <span className={styles.moduloIcone} aria-hidden="true">
                    {m.sigla}
                  </span>
                  <h3 className={styles.moduloTitulo}>{m.titulo}</h3>
                  <p className={styles.moduloDesc}>{m.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="planos"
          className={`${styles.section} ${styles.sectionAlt}`}
        >
          <div className="container">
            <header className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                Planos <em>transparentes</em>, trial de 14 dias
              </h2>
              <p className={styles.sectionSub}>
                Sem fidelidade. Add-ons disponíveis em todos os planos. Cobrança via
                Stripe com nota fiscal eletrônica.
              </p>
            </header>
            <div className={styles.planos}>
              {PLANOS.map((p) => (
                <article
                  key={p.nome}
                  className={`${styles.plano} ${
                    p.destaque ? styles.planoDestaque : ""
                  }`}
                >
                  {p.destaque ? (
                    <span className={styles.planoBadge}>Mais escolhido</span>
                  ) : null}
                  <h3 className={styles.planoNome}>
                    {p.nome === "Premium" ? <em>{p.nome}</em> : p.nome}
                  </h3>
                  <div className={styles.planoPreco}>
                    <span className={styles.planoValor}>{p.valor}</span>
                    <span className={styles.planoPeriodo}>/mês</span>
                  </div>
                  <span className={styles.planoLimite}>{p.limite}</span>
                  <ul className={styles.planoLista}>
                    {p.itens.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a className={styles.planoCta} href="/signup">
                    {p.cta}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className={styles.ctaFinal}>
          <div className="container">
            <h2>
              Pronto para a <em>primeira tenant</em>?
            </h2>
            <p>
              Construído com Next.js 16 + Supabase + Claude API. Hospedado em Netlify
              com Edge Functions. Conformidade LGPD + eSocial desde o MVP 1.
            </p>
            <a className={styles.ctaFinalBotao} href="/signup">
              Começar trial gratuito
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <span>
            © {new Date().getFullYear()} Oi Nora — todos os direitos reservados
          </span>
          <span>v0.1 · MVP 0 · landing</span>
        </div>
      </footer>
    </div>
  );
}
