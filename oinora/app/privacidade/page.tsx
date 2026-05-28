import Link from "next/link";

export const metadata = {
  title: "Política de privacidade",
  description: "Como a Oi Nora trata seus dados pessoais (LGPD)",
};

export default function PrivacidadePage() {
  return (
    <div style={containerStyle()}>
      <Link href="/" style={voltarStyle()}>
        ← Voltar
      </Link>
      <h1 style={h1Style()}>
        Política de <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>privacidade</em>
      </h1>
      <p style={metaStyle()}>Última atualização: maio de 2026 · Conformidade LGPD</p>

      <Section titulo="1. Quem é a Oi Nora">
        Oi Nora é uma plataforma SaaS brasileira de gestão de pessoas. Esta
        política descreve como tratamos os dados pessoais que coletamos quando
        você usa nossa plataforma como <strong>empregado</strong>,{" "}
        <strong>candidato</strong>, ou <strong>operador</strong> de RH/jurídico.
      </Section>

      <Section titulo="2. Quem é controlador vs. operador">
        <p style={{ marginBottom: 8 }}>
          A relação varia conforme o contexto:
        </p>
        <ul style={ulStyle()}>
          <li>
            <strong>Empregados de uma empresa-cliente:</strong> a empresa-cliente
            é a <em>controladora</em>; nós somos <em>operadores</em>. Seus
            direitos (LGPD art. 18) devem ser exercidos primeiro com seu
            empregador.
          </li>
          <li>
            <strong>Candidatos a vagas:</strong> a empresa que publicou a vaga
            é a controladora dos dados de candidatura. A Oi Nora processa os
            dados a pedido dela.
          </li>
          <li>
            <strong>Dados de uso da plataforma:</strong> a Oi Nora é
            controladora dos logs técnicos (acessos, performance, auditoria
            interna).
          </li>
        </ul>
      </Section>

      <Section titulo="3. Quais dados coletamos">
        <strong>De empregados:</strong> nome, CPF, RG, data de nascimento, sexo,
        raça/cor (auto-declarados), estado civil, endereço, telefone, email,
        cargo, salário, dependentes, histórico de movimentações, ASOs,
        certificados NR, batidas de ponto, holerites, avaliações 9-Box.
        <br /><br />
        <strong>De candidatos:</strong> nome, CPF (opcional), email, telefone,
        cidade/UF, currículo (texto extraído), pretensão salarial, modelo de
        trabalho preferido, consentimento LGPD.
        <br /><br />
        <strong>De operadores:</strong> email, nome, papel no tenant, último
        login, ações realizadas (audit log).
      </Section>

      <Section titulo="4. Por que coletamos (base legal)">
        <ul style={ulStyle()}>
          <li><strong>Execução de contrato</strong> (LGPD art. 7º V) — cumprimento do contrato de trabalho ou serviços.</li>
          <li><strong>Obrigação legal</strong> (art. 7º II) — eSocial, FGTS, INSS, IRRF.</li>
          <li><strong>Legítimo interesse</strong> (art. 7º IX) — segurança da plataforma, auditoria, prevenção de fraude.</li>
          <li><strong>Consentimento</strong> (art. 7º I) — candidatos no portal aceitam termo LGPD explícito antes de aplicar.</li>
        </ul>
      </Section>

      <Section titulo="5. Com quem compartilhamos">
        <ul style={ulStyle()}>
          <li><strong>Outros operadores da Oi Nora</strong> (Anthropic para IA, Supabase para infraestrutura, Netlify para hosting, Stripe para pagamentos) — sempre sob contrato de tratamento de dados.</li>
          <li><strong>Órgãos públicos</strong> apenas quando obrigatório por lei: Receita Federal (eSocial), Justiça do Trabalho (em processos), MPT.</li>
          <li><strong>Nunca vendemos seus dados</strong> a terceiros para marketing.</li>
        </ul>
      </Section>

      <Section titulo="6. Onde armazenamos">
        Dados armazenados no Brasil (região <code>sa-east-1</code> em São
        Paulo). Backups diários cifrados. Storage de arquivos (CVs, holerites,
        documentos) com signed URLs temporárias — apenas você e usuários
        autorizados conseguem acessar.
      </Section>

      <Section titulo="7. Por quanto tempo">
        <ul style={ulStyle()}>
          <li><strong>Empregados ativos:</strong> enquanto durar o vínculo + 30 dias após desligamento.</li>
          <li><strong>Empregados desligados:</strong> 5 anos por exigência legal (FGTS, eSocial, fiscalização).</li>
          <li><strong>Processos trabalhistas:</strong> até prescrição do crédito + 2 anos (CLT art. 11).</li>
          <li><strong>Candidatos não-contratados:</strong> 6 meses, salvo consentimento expresso para banco de talentos por mais tempo.</li>
          <li><strong>Logs de acesso:</strong> 6 meses.</li>
        </ul>
      </Section>

      <Section titulo="8. Seus direitos (LGPD art. 18)">
        Você pode, a qualquer momento, em <Link href="/meus-dados/lgpd" style={{ color: "var(--laranja)" }}>/meus-dados/lgpd</Link>:
        <ul style={ulStyle()}>
          <li><strong>Confirmar</strong> existência de tratamento (art. 18 I)</li>
          <li><strong>Acessar</strong> seus dados (art. 18 II)</li>
          <li><strong>Corrigir</strong> dados incompletos, inexatos ou desatualizados (art. 18 III)</li>
          <li><strong>Anonimizar, bloquear ou eliminar</strong> dados desnecessários (art. 18 IV)</li>
          <li><strong>Portar</strong> seus dados em JSON (art. 18 V)</li>
          <li><strong>Excluir</strong> dados tratados com consentimento (art. 18 VI)</li>
          <li><strong>Informação</strong> sobre compartilhamento (art. 18 VII)</li>
          <li><strong>Revogar consentimento</strong> (art. 18 IX)</li>
        </ul>
        Resposta em até <strong>15 dias úteis</strong> (LGPD art. 19).
      </Section>

      <Section titulo="9. Segurança">
        Senhas com hash bcrypt. Conexões HTTPS only. Multi-tenancy isolado a
        nível de banco (Row Level Security PostgreSQL). Audit log automático em
        toda alteração de dados pessoais. Backups diários cifrados. Pen testing
        anual previsto.
      </Section>

      <Section titulo="10. Encarregado (DPO)">
        Email: <a href="mailto:dpo@oinora.com.br" style={{ color: "var(--laranja)" }}>dpo@oinora.com.br</a>
        <br />
        Para incidentes de segurança envolvendo dados pessoais, comunique também
        a <a href="mailto:contato@oinora.com.br" style={{ color: "var(--laranja)" }}>contato@oinora.com.br</a>.
      </Section>

      <Section titulo="11. ANPD">
        Você também pode reclamar à Autoridade Nacional de Proteção de Dados em <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer" style={{ color: "var(--laranja)" }}>gov.br/anpd</a>.
      </Section>

      <p style={{ ...metaStyle(), marginTop: 48, textAlign: "center" }}>
        Dúvidas? Entre em contato com <a href="mailto:dpo@oinora.com.br" style={{ color: "var(--laranja)" }}>dpo@oinora.com.br</a>
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
