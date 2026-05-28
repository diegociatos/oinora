import type { ReactNode } from "react";

type Props = {
  icone?: string;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  variant?: "padrao" | "compacto";
};

/**
 * Empty state reutilizável com ícone + título + descrição + ação opcional.
 * Use sempre que uma listagem retornar zero registros.
 */
export function EmptyState({
  icone = "·",
  titulo,
  descricao,
  acao,
  variant = "padrao",
}: Props) {
  const isCompacto = variant === "compacto";
  return (
    <div
      style={{
        padding: isCompacto ? "32px 16px" : "64px 24px",
        textAlign: "center",
        background: "var(--branco)",
        border: "1px dashed var(--cinza-cl)",
        borderRadius: "var(--radius-sharp)",
        fontFamily: "var(--ui)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: isCompacto ? 48 : 72,
          height: isCompacto ? 48 : 72,
          borderRadius: "50%",
          background: "var(--cinza-fundo)",
          color: "var(--laranja)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: isCompacto ? 24 : 36,
          marginBottom: 16,
        }}
      >
        {icone}
      </div>
      <h3
        style={{
          fontFamily: "var(--serif)",
          fontSize: isCompacto ? 16 : 20,
          color: "var(--marinho)",
          fontWeight: 400,
          marginBottom: 6,
        }}
      >
        {titulo}
      </h3>
      {descricao ? (
        <p
          style={{
            fontFamily: "var(--ui)",
            fontSize: 13,
            color: "var(--cinza)",
            maxWidth: 420,
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          {descricao}
        </p>
      ) : null}
      {acao ? <div style={{ marginTop: 20 }}>{acao}</div> : null}
    </div>
  );
}
