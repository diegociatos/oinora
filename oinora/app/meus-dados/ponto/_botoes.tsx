"use client";

import { useTransition } from "react";
import { registrarBatida } from "@/server/actions/folha-ponto";

const TIPOS = [
  { v: "entrada", l: "🌅 Entrada", cor: "var(--verde)" },
  { v: "almoco_saida", l: "🍴 Saída almoço", cor: "var(--amarelo)" },
  { v: "almoco_volta", l: "🥤 Volta almoço", cor: "var(--amarelo)" },
  { v: "saida", l: "🌇 Saída", cor: "var(--juridico)" },
];

export function BotoesBaterPonto({
  empregadoId,
  ultimoTipo,
}: {
  empregadoId: string;
  ultimoTipo: string | null;
}) {
  const [pending, start] = useTransition();

  // Sugere o próximo tipo baseado no último
  const proximoSugerido = (() => {
    if (!ultimoTipo) return "entrada";
    if (ultimoTipo === "entrada") return "almoco_saida";
    if (ultimoTipo === "almoco_saida") return "almoco_volta";
    if (ultimoTipo === "almoco_volta") return "saida";
    return null;
  })();

  function bater(tipo: string) {
    start(async () => {
      const fd = new FormData();
      fd.append("empregado_id", empregadoId);
      fd.append("tipo", tipo);
      const r = await registrarBatida({ status: "idle" }, fd);
      if (r.status === "error") alert(r.message);
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
      }}
    >
      {TIPOS.map((t) => {
        const sugerido = t.v === proximoSugerido;
        return (
          <button
            key={t.v}
            type="button"
            disabled={pending}
            onClick={() => bater(t.v)}
            style={{
              padding: "20px 16px",
              background: sugerido ? t.cor : "var(--branco)",
              color: sugerido ? "var(--branco)" : t.cor,
              border: `2px solid ${t.cor}`,
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--serif)",
              fontSize: 18,
              cursor: pending ? "wait" : "pointer",
              opacity: pending ? 0.5 : 1,
              fontWeight: 400,
              minHeight: 72,
              boxShadow: sugerido ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
              transition: "transform 0.1s ease",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.97)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {pending ? "…" : t.l}
            {sugerido ? (
              <div style={{ fontFamily: "var(--ui)", fontSize: 10, letterSpacing: 1, marginTop: 4, opacity: 0.9 }}>
                Sugerido
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
