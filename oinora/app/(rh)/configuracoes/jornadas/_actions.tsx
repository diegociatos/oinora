"use client";

import { useTransition } from "react";
import { deletarJornada } from "@/server/actions/configuracoes";

export function BotaoDeletarJornada({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="deletar"
      disabled={pending}
      onClick={() => {
        if (confirm(`Remover jornada "${nome}"?`)) {
          start(async () => {
            const r = await deletarJornada(id);
            if (r.status === "error") alert(r.message);
          });
        }
      }}
    >
      {pending ? "removendo…" : "remover"}
    </button>
  );
}
