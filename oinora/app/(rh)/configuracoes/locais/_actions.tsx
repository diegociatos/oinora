"use client";

import { deletarLocal } from "@/server/actions/configuracoes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionToast } from "@/components/ui/use-action-toast";

export function BotaoDeletarLocal({ id, nome }: { id: string; nome: string }) {
  const showResult = useActionToast();
  return (
    <ConfirmDialog
      titulo={`Remover local "${nome}"?`}
      descricao="Empregados vinculados a este local precisam ser realocados antes."
      textoConfirmar="Remover"
      variant="perigo"
      trigger={<button type="button" className="deletar">remover</button>}
      onConfirmar={async () => {
        const r = await deletarLocal(id);
        showResult(r, "Local removido");
      }}
    />
  );
}
