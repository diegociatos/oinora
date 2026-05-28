"use client";

import { deletarJornada } from "@/server/actions/configuracoes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionToast } from "@/components/ui/use-action-toast";

export function BotaoDeletarJornada({ id, nome }: { id: string; nome: string }) {
  const showResult = useActionToast();
  return (
    <ConfirmDialog
      titulo={`Remover jornada "${nome}"?`}
      descricao="Empregados vinculados precisam ser realocados antes."
      textoConfirmar="Remover"
      variant="perigo"
      trigger={<button type="button" className="deletar">remover</button>}
      onConfirmar={async () => {
        const r = await deletarJornada(id);
        showResult(r, "Jornada removida");
      }}
    />
  );
}
