"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Oi Nora · uncaught error]", error);
    // Quando Sentry estiver ativo, manda pra cá também
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          textAlign: "center",
          background: "var(--branco)",
          border: "1px solid var(--cinza-cl)",
          borderRadius: "var(--radius-sharp)",
          padding: 40,
        }}
      >
        <div
          style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 64,
            color: "var(--laranja)",
            lineHeight: 1,
          }}
        >
          oops
        </div>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: 24,
            color: "var(--marinho)",
            fontWeight: 400,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Algo deu errado nesta página
        </h1>
        <p
          style={{
            fontFamily: "var(--ui)",
            fontSize: 14,
            color: "var(--cinza)",
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          Nossa equipe foi notificada automaticamente. Você pode tentar
          recarregar ou voltar para a página inicial.
          {error.digest ? (
            <>
              <br />
              <span style={{ fontSize: 11, opacity: 0.6 }}>
                Código: <code>{error.digest}</code>
              </span>
            </>
          ) : null}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              background: "var(--laranja)",
              color: "var(--branco)",
              border: "none",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
          <a
            href="/empregados"
            style={{
              padding: "10px 20px",
              background: "var(--branco)",
              color: "var(--marinho)",
              border: "1px solid var(--cinza-cl)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}
