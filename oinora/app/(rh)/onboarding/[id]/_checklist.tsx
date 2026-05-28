"use client";

import { useTransition } from "react";
import { toggleChecklistItem } from "@/server/actions/onboarding";

type Item = {
  id: string;
  titulo: string;
  descricao: string | null;
  dia_alvo: number | null;
  data_alvo: string | null;
  concluido: boolean;
};

export function ChecklistItem({
  item,
  onboardingId,
}: {
  item: Item;
  onboardingId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <label
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px dashed var(--cinza-cl)",
        cursor: pending ? "wait" : "pointer",
        opacity: pending ? 0.5 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={item.concluido}
        disabled={pending}
        onChange={(e) => {
          const novo = e.currentTarget.checked;
          start(async () => {
            await toggleChecklistItem(item.id, onboardingId, novo);
          });
        }}
        style={{ marginTop: 4 }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 15,
            color: item.concluido ? "var(--cinza)" : "var(--marinho)",
            textDecoration: item.concluido ? "line-through" : "none",
          }}
        >
          {item.titulo}
        </div>
        {item.descricao ? (
          <div
            style={{
              fontFamily: "var(--ui)",
              fontSize: 12,
              color: "var(--cinza)",
              marginTop: 2,
            }}
          >
            {item.descricao}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: "var(--ui)",
            fontSize: 11,
            color: "var(--cinza)",
            letterSpacing: 0.5,
            marginTop: 4,
          }}
        >
          {item.dia_alvo !== null ? `D+${item.dia_alvo}` : ""}
          {item.data_alvo ? ` · prazo ${new Date(item.data_alvo).toLocaleDateString("pt-BR")}` : ""}
        </div>
      </div>
    </label>
  );
}
