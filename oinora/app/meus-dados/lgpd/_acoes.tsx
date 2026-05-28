"use client";

import { useState, useTransition } from "react";
import { exportarMeusDados, solicitarExclusao } from "@/server/actions/lgpd";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function BotaoExportar() {
  const [pending, start] = useTransition();
  const { success, error } = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await exportarMeusDados();
          if (!r.ok) {
            error("Não foi possível exportar", r.message);
            return;
          }
          // Faz download do JSON no browser
          const blob = new Blob([JSON.stringify(r.dados, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `meus-dados-oinora-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          success("Dados exportados", "Arquivo JSON baixado na sua máquina.");
        })
      }
      style={{
        padding: "12px 20px",
        background: "var(--laranja)",
        color: "var(--branco)",
        border: "none",
        borderRadius: "var(--radius-sharp)",
        fontFamily: "var(--ui)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {pending ? "Preparando…" : "📥 Baixar meus dados (JSON)"}
    </button>
  );
}

export function BotaoExclusao() {
  const [motivo, setMotivo] = useState("");
  const { success, error } = useToast();

  return (
    <ConfirmDialog
      titulo="Solicitar exclusão dos meus dados"
      descricao="Sua solicitação será encaminhada ao responsável do seu tenant. A LGPD garante resposta em até 15 dias úteis. Atenção: dados de folha e eSocial têm retenção legal mínima de 5 anos."
      textoConfirmar="Solicitar exclusão"
      textoCancelar="Voltar"
      variant="perigo"
      trigger={
        <button
          type="button"
          style={{
            padding: "12px 20px",
            background: "var(--branco)",
            color: "var(--vermelho)",
            border: "1px solid var(--vermelho)",
            borderRadius: "var(--radius-sharp)",
            fontFamily: "var(--ui)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          🗑 Solicitar exclusão dos meus dados
        </button>
      }
      onConfirmar={async () => {
        const r = await solicitarExclusao(motivo);
        if (r.status === "error") error("Não foi possível solicitar", r.message);
        else if (r.status === "success") success("Solicitação enviada", r.message);
      }}
    />
  );
}
