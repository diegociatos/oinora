"use client";

import { useTransition } from "react";
import { deletarLocal } from "@/server/actions/configuracoes";

export function BotaoDeletarLocal({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="deletar"
      disabled={pending}
      onClick={() => {
        if (confirm(`Remover local "${nome}"?`)) {
          start(async () => {
            const r = await deletarLocal(id);
            if (r.status === "error") alert(r.message);
          });
        }
      }}
    >
      {pending ? "removendo…" : "remover"}
    </button>
  );
}
