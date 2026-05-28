"use client";

import { useState, useTransition } from "react";
import { calibrar9Box } from "@/server/actions/avaliacao";

export function CalibrarBotao({
  empregadoId,
  nome,
  desempenhoAtual,
  potencialAtual,
}: {
  empregadoId: string;
  nome: string;
  desempenhoAtual: number | null;
  potencialAtual: number | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [pending, start] = useTransition();
  const [d, setD] = useState<string>(desempenhoAtual?.toString() ?? "");
  const [p, setP] = useState<string>(potencialAtual?.toString() ?? "");

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} style={btn()}>
        {desempenhoAtual && potencialAtual ? "Recalibrar" : "Calibrar 9-Box"}
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        background: "var(--branco)",
        border: "1px solid var(--cinza-cl)",
        borderRadius: "var(--radius-sharp)",
        fontFamily: "var(--ui)",
        fontSize: 12,
      }}
    >
      <div style={{ marginBottom: 8, color: "var(--marinho)", fontWeight: 500 }}>
        Calibrar <em style={{ color: "var(--laranja)", fontStyle: "italic" }}>{nome}</em>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <label>Desempenho:</label>
        <select value={d} onChange={(e) => setD(e.currentTarget.value)} style={inp()}>
          <option value="">—</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
        <label>Potencial:</label>
        <select value={p} onChange={(e) => setP(e.currentTarget.value)} style={inp()}>
          <option value="">—</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setAberto(false)}
          style={btnSec()}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const r = await calibrar9Box(
                empregadoId,
                d === "" ? null : parseInt(d, 10),
                p === "" ? null : parseInt(p, 10),
              );
              if (r.status === "error") {
                alert(r.message);
              } else {
                setAberto(false);
              }
            });
          }}
          style={btnPri()}
        >
          {pending ? "…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function btn(): React.CSSProperties {
  return {
    padding: "6px 12px",
    background: "var(--laranja-cl)",
    color: "var(--laranja-esc)",
    border: "1px solid var(--laranja)",
    borderRadius: "var(--radius-sharp)",
    fontFamily: "var(--ui)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  };
}
function btnPri(): React.CSSProperties {
  return { ...btn(), background: "var(--laranja)", color: "var(--branco)" };
}
function btnSec(): React.CSSProperties {
  return { ...btn(), background: "var(--branco)", color: "var(--cinza)", border: "1px solid var(--cinza-cl)" };
}
function inp(): React.CSSProperties {
  return {
    padding: "4px 8px",
    border: "1px solid var(--cinza-cl)",
    borderRadius: 2,
    fontFamily: "var(--ui)",
    fontSize: 12,
  };
}
