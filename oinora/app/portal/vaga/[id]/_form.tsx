"use client";

import { useActionState } from "react";
import { criarCandidaturaPortal } from "@/server/actions/recrutamento";

const initial = { status: "idle" as const };

export function FormCandidatura({ vagaId }: { vagaId: string }) {
  const [state, action, pending] = useActionState(
    criarCandidaturaPortal,
    initial,
  );

  if (state.status === "success") {
    return (
      <div
        style={{
          padding: "20px 24px",
          background: "#EAF5EE",
          border: "1px solid var(--verde)",
          borderRadius: "var(--radius-sharp)",
          fontFamily: "var(--ui)",
          fontSize: 14,
          color: "#1E5A3F",
          textAlign: "center",
        }}
      >
        <strong style={{ display: "block", fontFamily: "var(--serif)", fontSize: 18, marginBottom: 8 }}>
          ✓ Candidatura recebida!
        </strong>
        {state.message}
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      <input type="hidden" name="vaga_id" value={vagaId} />
      {state.status === "error" ? (
        <div
          style={{
            padding: "12px 16px",
            background: "#FBEAEA",
            border: "1px solid var(--vermelho)",
            borderRadius: "var(--radius-sharp)",
            fontFamily: "var(--ui)",
            fontSize: 13,
            color: "#8A2727",
            marginBottom: 16,
          }}
        >
          {state.message}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 16 }}>
        <Field name="nome_completo" label="Nome completo *" required />
        <Field name="email" label="Email *" type="email" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field name="telefone" label="Telefone (com DDD)" />
          <Field name="cpf" label="CPF" />
        </div>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontFamily: "var(--ui)",
            fontSize: 13,
            color: "var(--cinza)",
            lineHeight: 1.5,
            marginTop: 8,
          }}
        >
          <input type="checkbox" name="lgpd" style={{ marginTop: 2 }} />
          <span>
            Autorizo o tratamento dos meus dados pessoais para fins de seleção,
            conforme a <a href="#" style={{ color: "var(--laranja)" }}>Política de Privacidade</a> (LGPD).
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "12px 24px",
            background: "var(--laranja)",
            color: "var(--branco)",
            border: "none",
            borderRadius: "var(--radius-sharp)",
            fontFamily: "var(--serif)",
            fontSize: 15,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.6 : 1,
            marginTop: 8,
          }}
        >
          {pending ? "Enviando…" : "Enviar candidatura"}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontFamily: "var(--ui)",
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "var(--marinho-med)",
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        style={{
          padding: "10px 12px",
          border: "1px solid var(--cinza-cl)",
          borderRadius: "var(--radius-sharp)",
          fontFamily: "var(--serif)",
          fontSize: 15,
        }}
      />
    </div>
  );
}
