"use client";

import { useTransition } from "react";
import { deletarDepartamento } from "@/server/actions/configuracoes";

export function BotaoDeletar({ id, nome }: { id: string; nome: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="deletar"
      disabled={pending}
      onClick={() => {
        if (confirm(`Tem certeza que quer remover o departamento "${nome}"?`)) {
          start(async () => {
            const r = await deletarDepartamento(id);
            if (r.status === "error") alert(r.message);
          });
        }
      }}
    >
      {pending ? "removendo…" : "remover"}
    </button>
  );
}
