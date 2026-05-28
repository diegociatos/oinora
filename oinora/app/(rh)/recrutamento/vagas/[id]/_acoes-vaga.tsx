"use client";

import { publicarVaga, pausarVaga } from "@/server/actions/recrutamento";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionToast } from "@/components/ui/use-action-toast";

export function AcoesVaga({
  vagaId,
  status,
}: {
  vagaId: string;
  status: string;
}) {
  const showResult = useActionToast();
  if (status === "preenchida" || status === "cancelada") return null;

  if (status === "publicada") {
    return (
      <ConfirmDialog
        titulo="Pausar esta vaga?"
        descricao="Vagas pausadas somem do portal de candidatos. Candidaturas em andamento não são afetadas."
        textoConfirmar="Pausar"
        variant="neutro"
        trigger={
          <button type="button" style={btnSec()}>Pausar</button>
        }
        onConfirmar={async () => {
          const r = await pausarVaga(vagaId);
          showResult(r, "Vaga pausada");
        }}
      />
    );
  }

  return (
    <ConfirmDialog
      titulo="Publicar no portal de candidatos?"
      descricao="A vaga ficará visível publicamente em /portal. Candidatos poderão se inscrever imediatamente."
      textoConfirmar="↑ Publicar"
      variant="neutro"
      trigger={<button type="button" style={btnPri()}>↑ Publicar</button>}
      onConfirmar={async () => {
        const r = await publicarVaga(vagaId);
        showResult(r, "Vaga publicada");
      }}
    />
  );
}

function btnPri(): React.CSSProperties {
  return {
    padding: "8px 16px",
    background: "var(--laranja)",
    color: "var(--branco)",
    border: "none",
    borderRadius: "var(--radius-sharp)",
    fontFamily: "var(--ui)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };
}
function btnSec(): React.CSSProperties {
  return {
    padding: "8px 16px",
    background: "var(--branco)",
    color: "var(--marinho)",
    border: "1px solid var(--cinza-cl)",
    borderRadius: "var(--radius-sharp)",
    fontFamily: "var(--ui)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };
}
