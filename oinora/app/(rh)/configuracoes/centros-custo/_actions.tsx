"use client";

import { useTransition } from "react";
import { deletarCentroCusto } from "@/server/actions/configuracoes";

export function BotaoDeletarCentro({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="deletar"
      disabled={pending}
      onClick={() => {
        if (confirm(`Remover o centro "${nome}"?`)) {
          start(async () => {
            const r = await deletarCentroCusto(id);
            if (r.status === "error") alert(r.message);
          });
        }
      }}
    >
      {pending ? "removendo…" : "remover"}
    </button>
  );
}
