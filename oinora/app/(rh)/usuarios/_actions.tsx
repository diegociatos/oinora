"use client";

import { suspenderMembro, reativarMembro } from "@/server/actions/usuarios";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

export function ToggleMembership({
  id,
  ativo,
  nome,
}: {
  id: string;
  ativo: boolean;
  nome: string;
}) {
  const { success, error } = useToast();
  const acao = ativo ? "suspender" : "reativar";

  return (
    <ConfirmDialog
      titulo={`${ativo ? "Suspender" : "Reativar"} ${nome}?`}
      descricao={
        ativo
          ? "Após suspender, este usuário perde acesso imediatamente à plataforma. Você pode reativar a qualquer momento."
          : "Reativando o acesso, este usuário poderá entrar na plataforma novamente."
      }
      textoConfirmar={ativo ? "Suspender" : "Reativar"}
      variant={ativo ? "perigo" : "neutro"}
      trigger={<button type="button" className="deletar">{acao}</button>}
      onConfirmar={async () => {
        const r = ativo ? await suspenderMembro(id) : await reativarMembro(id);
        if (r.status === "error") error("Erro", r.message);
        else if (r.status === "success") success(r.message);
      }}
    />
  );
}
