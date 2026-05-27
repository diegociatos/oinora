"use client";

import { useTransition } from "react";
import {
  suspenderMembro,
  reativarMembro,
} from "@/server/actions/usuarios";

export function ToggleMembership({
  id,
  ativo,
  nome,
}: {
  id: string;
  ativo: boolean;
  nome: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="deletar"
      disabled={pending}
      onClick={() => {
        const acao = ativo ? "suspender" : "reativar";
        if (confirm(`Tem certeza que quer ${acao} ${nome}?`)) {
          start(async () => {
            const r = ativo
              ? await suspenderMembro(id)
              : await reativarMembro(id);
            if (r.status === "error") alert(r.message);
          });
        }
      }}
    >
      {pending ? "…" : ativo ? "suspender" : "reativar"}
    </button>
  );
}
