"use client";

import { deletarCargo } from "@/server/actions/configuracoes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionToast } from "@/components/ui/use-action-toast";

export function BotaoDeletarCargo({ id, nome }: { id: string; nome: string }) {
  const showResult = useActionToast();
  return (
    <ConfirmDialog
      titulo={`Remover cargo "${nome}"?`}
      descricao="Empregados vinculados a este cargo precisam ser realocados antes."
      textoConfirmar="Remover"
      variant="perigo"
      trigger={<button type="button" className="deletar">remover</button>}
      onConfirmar={async () => {
        const r = await deletarCargo(id);
        showResult(r, "Cargo removido");
      }}
    />
  );
}
