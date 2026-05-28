import Link from "next/link";

export const metadata = {
  title: "Termos de uso",
  description: "Termos de uso da plataforma Oi Nora · SaaS de gestão de pessoas",
};

export default function TermosPage() {
  return (
    <div style={containerStyle()}>
      <Link href="/" style={voltarStyle()}>
        ← Voltar
      </Link>
      <h1 style={h1Style()}>
        Termos de <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>uso</em>
      </h1>
      <p style={metaStyle()}>Última atualização: maio de 2026</p>

      <Section titulo="1. Aceitação dos termos">
        Ao criar conta na Oi Nora, você (empresa-cliente ou empregado vinculado a
        empresa-cliente) concorda com estes termos. Se você é responsável legal
        pela empresa-cliente (papel <em>owner</em>), garante que tem autoridade
        para vincular a empresa a estes termos.
      </Section>

      <Section titulo="2. Sobre a plataforma">
        A Oi Nora é uma plataforma SaaS brasileira de gestão de pessoas voltada
        a empresas brasileiras de construção civil. Oferecemos módulos de:
        Recrutamento & Seleção, Gestão de Empregados (cadastro, dependentes,
        documentos), Folha de Pagamento, Ponto Eletrônico, Onboarding,
        Treinamentos & Trilhas, Headcount, Avaliação 9-Box, Jurídico Trabalhista,
        e funcionalidades de Inteligência Artificial (Nora) para triagem de
        currículos, sugestão de descrição de vaga, cálculo de risco e similares.
      </Section>

      <Section titulo="3. Sua conta">
        Você é responsável por manter a segurança das suas credenciais.
        Notifique-nos imediatamente em caso de uso não-autorizado. Não
        compartilhe senha. Use senhas fortes e ative 2FA quando disponível.
      </Section>

      <Section titulo="4. Dados pessoais e LGPD">
        Todos os dados pessoais armazenados são tratados conforme a Lei Geral
        de Proteção de Dados (Lei nº 13.709/2018). A empresa-cliente é a
        <strong> controladora</strong> dos dados dos seus empregados; a Oi Nora
        atua como <strong>operadora</strong>. Você pode exercer os direitos do
        art. 18 da LGPD em sua área pessoal (<Link href="/meus-dados/lgpd">/meus-dados/lgpd</Link>),
        incluindo portabilidade e solicitação de exclusão.
        Veja nossa <Link href="/privacidade" style={{ color: "var(--laranja)" }}>Política de Privacidade</Link> para detalhes.
      </Section>

      <Section titulo="5. Uso aceitável">
        Você concorda em <strong>não</strong>:
        <ul style={ulStyle()}>
          <li>Usar a plataforma para fins ilegais ou contrários à legislação trabalhista, tributária ou criminal brasileira.</li>
          <li>Tentar acessar dados de outras empresas-clientes (multi-tenancy é protegida por RLS).</li>
          <li>Fazer engenharia reversa, descompilar ou tentar burlar mecanismos de segurança.</li>
          <li>Sobrecarregar a plataforma com automações abusivas (bots, scrappers).</li>
          <li>Inserir dados falsos, especialmente em processos trabalhistas ou folha.</li>
        </ul>
      </Section>

      <Section titulo="6. Planos e cobrança">
        Oferecemos três planos: Essencial (R$ 990/mês), Profissional (R$ 2.490/mês)
        e Premium (R$ 4.990/mês), com limites de empregados ativos e módulos.
        Add-ons disponíveis. Cobrança mensal recorrente via Stripe. Cancelamento
        a qualquer momento, sem fidelidade — a empresa mantém acesso até o fim
        do ciclo pago. Trial de 14 dias gratuitos para novos tenants.
      </Section>

      <Section titulo="7. Inteligência Artificial">
        Sugestões e cálculos gerados por IA (Nora) têm caráter informativo e não
        substituem julgamento humano profissional. <strong>Sempre revise</strong>{" "}
        sugestões de descrição de vaga, cálculos de risco, propostas de acordo
        e qualquer output da IA antes de tomar decisões. Não nos
        responsabilizamos por decisões automatizadas sem revisão humana.
      </Section>

      <Section titulo="8. Disponibilidade">
        Buscamos uptime ≥ 99,5% mas não garantimos. Faremos manutenções
        planejadas em janelas de baixo uso (madrugadas) e notificaremos com
        antecedência. Backups diários são feitos automaticamente.
      </Section>

      <Section titulo="9. Limitação de responsabilidade">
        Nossa responsabilidade máxima é o valor pago no plano nos últimos 12
        meses. Não respondemos por: lucros cessantes, decisões trabalhistas
        equivocadas tomadas com base em outputs de IA não-revisados, perda de
        dados causada por uso indevido do usuário.
      </Section>

      <Section titulo="10. Modificações">
        Podemos atualizar estes termos. Mudanças relevantes serão comunicadas
        por email com 30 dias de antecedência. Uso continuado após a mudança
        implica aceitação.
      </Section>

      <Section titulo="11. Foro">
        Foro da Comarca de Belo Horizonte, MG, Brasil. Legislação brasileira
        aplicável.
      </Section>

      <p style={{ ...metaStyle(), marginTop: 48, textAlign: "center" }}>
        Dúvidas? Entre em contato com <a href="mailto:contato@oinora.com.br" style={{ color: "var(--laranja)" }}>contato@oinora.com.br</a>
      </p>
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontFamily: "var(--serif)",
          fontSize: 20,
          color: "var(--marinho)",
          fontWeight: 400,
          marginBottom: 10,
          letterSpacing: "-0.2px",
        }}
      >
        {titulo}
      </h2>
      <div
        style={{
          fontFamily: "var(--ui)",
          fontSize: 14,
          color: "var(--marinho)",
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function containerStyle(): React.CSSProperties {
  return {
    maxWidth: 760,
    margin: "0 auto",
    padding: "40px 24px 80px",
    fontFamily: "var(--ui)",
  };
}
function h1Style(): React.CSSProperties {
  return {
    fontFamily: "var(--serif)",
    fontSize: 40,
    color: "var(--marinho)",
    fontWeight: 400,
    marginBottom: 6,
    letterSpacing: "-0.5px",
  };
}
function metaStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--ui)",
    fontSize: 12,
    color: "var(--cinza)",
    marginBottom: 40,
    letterSpacing: 0.3,
  };
}
function ulStyle(): React.CSSProperties {
  return {
    paddingLeft: 20,
    marginTop: 8,
    lineHeight: 1.7,
  };
}
function voltarStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--ui)",
    fontSize: 13,
    color: "var(--cinza)",
    textDecoration: "none",
    marginBottom: 24,
    display: "inline-block",
  };
}
