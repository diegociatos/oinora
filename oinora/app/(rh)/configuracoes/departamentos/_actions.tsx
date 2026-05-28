"use client";

import { deletarDepartamento } from "@/server/actions/configuracoes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionToast } from "@/components/ui/use-action-toast";

export function BotaoDeletar({ id, nome }: { id: string; nome: string }) {
  const showResult = useActionToast();
  return (
    <ConfirmDialog
      titulo={`Remover departamento "${nome}"?`}
      descricao="Empregados e cargos vinculados a este departamento precisam ser realocados antes."
      textoConfirmar="Remover"
      variant="perigo"
      trigger={
        <button type="button" className="deletar">remover</button>
      }
      onConfirmar={async () => {
        const r = await deletarDepartamento(id);
        showResult(r, "Departamento removido");
      }}
    />
  );
}
