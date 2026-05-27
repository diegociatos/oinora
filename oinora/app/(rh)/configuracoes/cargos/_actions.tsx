"use client";

import { useTransition } from "react";
import { deletarCargo } from "@/server/actions/configuracoes";

export function BotaoDeletarCargo({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="deletar"
      disabled={pending}
      onClick={() => {
        if (confirm(`Remover o cargo "${nome}"?`)) {
          start(async () => {
            const r = await deletarCargo(id);
            if (r.status === "error") alert(r.message);
          });
        }
      }}
    >
      {pending ? "removendo…" : "remover"}
    </button>
  );
}
