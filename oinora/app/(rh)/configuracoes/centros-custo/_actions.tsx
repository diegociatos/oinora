"use client";

import { deletarCentroCusto } from "@/server/actions/configuracoes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionToast } from "@/components/ui/use-action-toast";

export function BotaoDeletarCentro({ id, nome }: { id: string; nome: string }) {
  const showResult = useActionToast();
  return (
    <ConfirmDialog
      titulo={`Remover centro "${nome}"?`}
      descricao="Empregados vinculados precisam ser realocados antes."
      textoConfirmar="Remover"
      variant="perigo"
      trigger={<button type="button" className="deletar">remover</button>}
      onConfirmar={async () => {
        const r = await deletarCentroCusto(id);
        showResult(r, "Centro de custo removido");
      }}
    />
  );
}
