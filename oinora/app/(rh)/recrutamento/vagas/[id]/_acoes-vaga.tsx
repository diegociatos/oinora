"use client";

import { useTransition } from "react";
import { publicarVaga, pausarVaga } from "@/server/actions/recrutamento";

export function AcoesVaga({
  vagaId,
  status,
}: {
  vagaId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  if (status === "preenchida" || status === "cancelada") return null;

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {status === "publicada" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Pausar esta vaga? Ela some do portal de candidatos.")) {
              start(async () => {
                const r = await pausarVaga(vagaId);
                if (r.status === "error") alert(r.message);
              });
            }
          }}
          style={btnSecStyle()}
        >
          {pending ? "…" : "Pausar"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Publicar no portal de candidatos?")) {
              start(async () => {
                const r = await publicarVaga(vagaId);
                if (r.status === "error") alert(r.message);
              });
            }
          }}
          style={btnPriStyle()}
        >
          {pending ? "…" : "↑ Publicar"}
        </button>
      )}
    </div>
  );
}

function btnPriStyle(): React.CSSProperties {
  return {
    padding: "8px 16px",
    background: "var(--laranja)",
    color: "var(--branco)",
    border: "none",
    borderRadius: "var(--radius-sharp)",
    fontFamily: "var(--ui)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };
}
function btnSecStyle(): React.CSSProperties {
  return {
    padding: "8px 16px",
    background: "var(--branco)",
    color: "var(--marinho)",
    border: "1px solid var(--cinza-cl)",
    borderRadius: "var(--radius-sharp)",
    fontFamily: "var(--ui)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };
}
