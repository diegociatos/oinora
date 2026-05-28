import { requireSession } from "@/lib/auth/session";
import { BotaoExportar, BotaoExclusao } from "./_acoes";

export const metadata = { title: "Meus dados · LGPD" };

export default async function MeusDadosLGPDPage() {
  await requireSession();
  return (
    <>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: 28,
          color: "var(--marinho)",
          fontWeight: 400,
          marginBottom: 8,
        }}
      >
        Seus direitos pela <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>LGPD</em>
      </h1>
      <p style={{ fontFamily: "var(--ui)", fontSize: 14, color: "var(--cinza)", marginBottom: 24, lineHeight: 1.6 }}>
        A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) garante a você o
        direito de acessar, corrigir, portabilizar e solicitar a exclusão dos seus
        dados pessoais. Esta página resume as ações disponíveis.
      </p>

      <div style={{ background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: "var(--radius-sharp)", padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--marinho)", fontWeight: 400, marginBottom: 8 }}>
          Portabilidade · <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>Art. 18 V</em>
        </h2>
        <p style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--cinza)", marginBottom: 16, lineHeight: 1.5 }}>
          Baixe um arquivo JSON contendo todos os seus dados pessoais armazenados
          na Oi Nora: ficha, dependentes, documentos anexados, histórico de
          movimentações, holerites, matrículas em cursos e batidas de ponto.
        </p>
        <BotaoExportar />
      </div>

      <div style={{ background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: "var(--radius-sharp)", padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--marinho)", fontWeight: 400, marginBottom: 8 }}>
          Correção e atualização · <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>Art. 18 III</em>
        </h2>
        <p style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--cinza)", marginBottom: 16, lineHeight: 1.5 }}>
          Para corrigir nome social, endereço, dependentes ou outros dados, abra
          a sua ficha. Algumas correções (CPF, RG) precisam de validação pelo RH.
        </p>
        <a
          href="/meus-dados/ficha"
          style={{
            display: "inline-block",
            padding: "12px 20px",
            background: "var(--branco)",
            color: "var(--marinho)",
            border: "1px solid var(--cinza-cl)",
            borderRadius: "var(--radius-sharp)",
            fontFamily: "var(--ui)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          → Abrir minha ficha
        </a>
      </div>

      <div style={{ background: "var(--branco)", border: "1px solid var(--vermelho)", borderRadius: "var(--radius-sharp)", padding: 24 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--vermelho)", fontWeight: 400, marginBottom: 8 }}>
          Exclusão · <em style={{ fontStyle: "italic" }}>Art. 18 VI</em>
        </h2>
        <p style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--cinza)", marginBottom: 16, lineHeight: 1.5 }}>
          Você pode solicitar a exclusão dos seus dados pessoais. A solicitação
          será encaminhada ao responsável do seu tenant que tem até <strong>15 dias
          úteis</strong> para responder (LGPD art. 19). Importante: dados de folha,
          eSocial e contábeis têm retenção legal mínima de 5 anos e não podem ser
          excluídos antes desse prazo.
        </p>
        <BotaoExclusao />
      </div>
    </>
  );
}
