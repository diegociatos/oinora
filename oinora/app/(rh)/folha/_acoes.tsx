"use client";

import { useState, useTransition } from "react";
import {
  gerarCompetencia,
  fecharCompetencia,
  liberarHolerites,
  marcarComoPaga,
} from "@/server/actions/folha-ponto";

export function GerarCompetencia() {
  const [aberto, setAberto] = useState(false);
  const [pending, start] = useTransition();
  const [comp, setComp] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-01`;
  });

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} style={btn()}>
        + Gerar competência
      </button>
    );
  }

  return (
    <div style={{ padding: 12, background: "var(--branco)", border: "1px solid var(--cinza-cl)", borderRadius: 2, display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="month"
        value={comp.slice(0, 7)}
        onChange={(e) => setComp(`${e.currentTarget.value}-01`)}
        style={inp()}
      />
      <button type="button" onClick={() => setAberto(false)} style={btnSec()}>
        Cancelar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const r = await gerarCompetencia(comp);
            if (r.status === "error") alert(r.message);
            else if (r.status === "success") {
              alert(r.message);
              setAberto(false);
            } else {
              setAberto(false);
            }
          });
        }}
        style={btnPri()}
      >
        {pending ? "Calculando…" : "Gerar"}
      </button>
    </div>
  );
}

export function AcoesCompetencia({
  competenciaId,
  status,
}: {
  competenciaId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {status === "calculando" || status === "conferencia" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Fechar competência? Não permite mais edição.")) {
              start(async () => {
                const r = await fecharCompetencia(competenciaId);
                if (r.status === "error") alert(r.message);
              });
            }
          }}
          style={btn()}
        >
          Fechar
        </button>
      ) : null}
      {status === "fechada" || status === "calculando" || status === "conferencia" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const r = await liberarHolerites(competenciaId);
              if (r.status === "error") alert(r.message);
              else if (r.status === "success") alert(r.message);
            });
          }}
          style={btn()}
        >
          Liberar holerites
        </button>
      ) : null}
      {status === "fechada" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const r = await marcarComoPaga(competenciaId);
              if (r.status === "error") alert(r.message);
            });
          }}
          style={btnPri()}
        >
          Marcar como paga
        </button>
      ) : null}
    </div>
  );
}

function btn(): React.CSSProperties {
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
function btnPri(): React.CSSProperties {
  return { ...btn(), background: "var(--laranja)", color: "var(--branco)", borderColor: "var(--laranja)" };
}
function btnSec(): React.CSSProperties {
  return { ...btn(), color: "var(--cinza)" };
}
function inp(): React.CSSProperties {
  return {
    padding: "8px 10px",
    border: "1px solid var(--cinza-cl)",
    borderRadius: 2,
    fontFamily: "var(--ui)",
    fontSize: 13,
  };
}
