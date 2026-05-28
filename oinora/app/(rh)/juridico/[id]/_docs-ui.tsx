"use client";

import { useActionState, useState, useTransition } from "react";
import {
  uploadDocProcesso,
  removerDocProcesso,
  signedUrlDocProcesso,
  initialProcDocState,
} from "@/server/actions/processo-documentos";
import type { FormState } from "@/server/actions/empregados";
import shared from "../../_form.module.css";

type Doc = {
  id: string;
  tipo: string;
  nome_arquivo: string;
  storage_path: string;
  tamanho_bytes: number | null;
  criado_em: string;
};

const TIPOS = [
  "peticao_inicial",
  "contestacao",
  "replica",
  "sentenca",
  "acordao",
  "recurso",
  "ata_audiencia",
  "laudo_pericial",
  "outros",
];

export function DocumentosProcesso({
  processoId,
  documentos,
}: {
  processoId: string;
  documentos: Doc[];
}) {
  const [aberto, setAberto] = useState(false);
  const upload = uploadDocProcesso.bind(null, processoId);
  const [state, action, pending] = useActionState<FormState, FormData>(
    upload,
    initialProcDocState,
  );
  if (state.status === "success" && aberto) setTimeout(() => setAberto(false), 200);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)" }}>
          {documentos.length} {documentos.length === 1 ? "documento" : "documentos"}
        </strong>
        {!aberto ? (
          <button type="button" onClick={() => setAberto(true)} style={btnAdd()}>
            + Anexar documento
          </button>
        ) : null}
      </div>

      {aberto ? (
        <div className={shared.painel} style={{ marginBottom: 12 }}>
          {state.status === "error" ? <div className={shared.alertaErro}>{state.message}</div> : null}
          <form action={action} encType="multipart/form-data" noValidate>
            <div className={shared.formGrid}>
              <div className={shared.campo}>
                <label>Tipo *</label>
                <select name="tipo" defaultValue="peticao_inicial" required>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className={`${shared.campo} ${shared.full}`}>
                <label>Arquivo (PDF, JPG, PNG, DOCX · máx 15 MB) *</label>
                <input type="file" name="arquivo" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required />
              </div>
            </div>
            <div className={shared.actions}>
              <button type="button" onClick={() => setAberto(false)} className={`${shared.btn} ${shared.btnFantasma}`}>
                Cancelar
              </button>
              <button type="submit" className={`${shared.btn} ${shared.btnPrimario}`} disabled={pending}>
                {pending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {documentos.length === 0 && !aberto ? (
        <div style={{ padding: 24, textAlign: "center", fontFamily: "var(--ui)", fontSize: 13, color: "var(--cinza)", border: "1px dashed var(--cinza-cl)", borderRadius: "var(--radius-sharp)" }}>
          Nenhum documento anexado ainda.
        </div>
      ) : null}

      {documentos.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, fontFamily: "var(--ui)", fontSize: 13 }}>
          {documentos.map((d) => (
            <DocLinha key={d.id} doc={d} processoId={processoId} />
          ))}
        </ul>
      ) : null}
    </>
  );
}

function DocLinha({ doc, processoId }: { doc: Doc; processoId: string }) {
  const [pView, startView] = useTransition();
  const [pDel, startDel] = useTransition();
  return (
    <li
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px dashed var(--cinza-cl)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ color: "var(--marinho)", fontWeight: 500 }}>
          <span style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "var(--juridico)", marginRight: 8 }}>
            {doc.tipo}
          </span>
          {doc.nome_arquivo}
        </div>
        <div style={{ fontSize: 11, color: "var(--cinza)" }}>
          {(doc.tamanho_bytes ? `${Math.round(doc.tamanho_bytes / 1024)} KB · ` : "")}
          enviado {new Date(doc.criado_em).toLocaleDateString("pt-BR")}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          disabled={pView}
          onClick={() => {
            startView(async () => {
              const r = await signedUrlDocProcesso(doc.storage_path);
              if (r.error) alert(r.error);
              else if (r.url) window.open(r.url, "_blank");
            });
          }}
          style={btnLink()}
        >
          {pView ? "…" : "abrir"}
        </button>
        <button
          type="button"
          disabled={pDel}
          onClick={() => {
            if (confirm(`Remover "${doc.nome_arquivo}"?`)) {
              startDel(async () => {
                const r = await removerDocProcesso(processoId, doc.id);
                if (r.status === "error") alert(r.message);
              });
            }
          }}
          style={btnLink()}
        >
          {pDel ? "…" : "remover"}
        </button>
      </div>
    </li>
  );
}

function btnAdd(): React.CSSProperties {
  return {
    padding: "6px 12px",
    background: "var(--juridico)",
    color: "var(--branco)",
    border: "none",
    borderRadius: "var(--radius-sharp)",
    fontFamily: "var(--ui)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  };
}
function btnLink(): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    color: "var(--cinza)",
    cursor: "pointer",
    fontFamily: "var(--ui)",
    fontSize: 11,
  };
}
