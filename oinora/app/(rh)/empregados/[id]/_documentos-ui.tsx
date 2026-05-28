"use client";

import { useActionState, useState, useTransition } from "react";
import {
  uploadDocumento,
  removerDocumento,
  gerarSignedUrl,
  initialDocumentoState,
} from "@/server/actions/documentos";
import type { FormState } from "@/server/actions/empregados";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useActionToast } from "@/components/ui/use-action-toast";
import shared from "../../_form.module.css";

type Doc = {
  id: string;
  tipo: string;
  nome_arquivo: string;
  validade: string | null;
  criado_em: string;
  storage_path: string;
};

const TIPOS = [
  { v: "rg", l: "RG" },
  { v: "cpf", l: "CPF" },
  { v: "ctps", l: "CTPS" },
  { v: "comprovante_endereco", l: "Comprovante de endereço" },
  { v: "aso", l: "ASO (genérico)" },
  { v: "aso_admissional", l: "ASO admissional" },
  { v: "aso_periodico", l: "ASO periódico" },
  { v: "aso_demissional", l: "ASO demissional" },
  { v: "certificado_nr06", l: "Certificado NR-06" },
  { v: "certificado_nr10", l: "Certificado NR-10" },
  { v: "certificado_nr18", l: "Certificado NR-18" },
  { v: "certificado_nr33", l: "Certificado NR-33" },
  { v: "certificado_nr35", l: "Certificado NR-35" },
  { v: "diploma", l: "Diploma" },
  { v: "contrato", l: "Contrato" },
  { v: "outros", l: "Outros" },
];

export function DocumentosContainer({
  empregadoId,
  documentos,
}: {
  empregadoId: string;
  documentos: Doc[];
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const upload = uploadDocumento.bind(null, empregadoId);
  const [state, action, pending] = useActionState<FormState, FormData>(
    upload,
    initialDocumentoState,
  );

  if (state.status === "success") {
    setTimeout(() => setMostrarForm(false), 200);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <strong style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)" }}>
          {documentos.length} {documentos.length === 1 ? "arquivo" : "arquivos"}
        </strong>
        {!mostrarForm ? (
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            style={{
              padding: "8px 16px",
              background: "var(--laranja)",
              color: "var(--branco)",
              border: "none",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: "var(--fs-sm)",
              cursor: "pointer",
            }}
          >
            + Enviar documento
          </button>
        ) : null}
      </div>

      {mostrarForm ? (
        <div className={shared.painel}>
          <h4
            style={{
              fontFamily: "var(--serif)",
              fontSize: "var(--fs-md)",
              marginBottom: 12,
              color: "var(--marinho)",
            }}
          >
            Enviar documento
          </h4>
          {state.status === "error" ? (
            <div className={shared.alertaErro}>{state.message}</div>
          ) : null}
          <form action={action} encType="multipart/form-data" noValidate>
            <div className={shared.formGrid}>
              <div className={shared.campo}>
                <label>Tipo *</label>
                <select name="tipo" defaultValue="aso" required>
                  {TIPOS.map((t) => (
                    <option key={t.v} value={t.v}>
                      {t.l}
                    </option>
                  ))}
                </select>
              </div>
              <div className={shared.campo}>
                <label>Validade (opcional)</label>
                <input type="date" name="validade" />
              </div>
              <div className={`${shared.campo} ${shared.full}`}>
                <label>Arquivo (PDF, JPG, PNG, DOCX · máx 10MB) *</label>
                <input
                  type="file"
                  name="arquivo"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  required
                />
              </div>
            </div>
            <div className={shared.actions}>
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className={`${shared.btn} ${shared.btnFantasma}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`${shared.btn} ${shared.btnPrimario}`}
                disabled={pending}
              >
                {pending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {documentos.length === 0 && !mostrarForm ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            fontFamily: "var(--ui)",
            fontSize: 13,
            color: "var(--cinza)",
            border: "1px dashed var(--cinza-cl)",
            borderRadius: "var(--radius-sharp)",
          }}
        >
          Nenhum documento enviado ainda.
        </div>
      ) : null}

      {documentos.length > 0 ? (
        <table style={{ width: "100%", fontFamily: "var(--ui)", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cinza-cl)" }}>
              <th style={th()}>Tipo</th>
              <th style={th()}>Arquivo</th>
              <th style={th()}>Validade</th>
              <th style={th()}>Enviado em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((d) => (
              <LinhaDocumento
                key={d.id}
                doc={d}
                empregadoId={empregadoId}
              />
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
}

function LinhaDocumento({
  doc,
  empregadoId,
}: {
  doc: Doc;
  empregadoId: string;
}) {
  const [pendingView, startView] = useTransition();
  const { error: showError } = useToast();
  const showResult = useActionToast();

  const vencida = doc.validade && new Date(doc.validade) < new Date();

  return (
    <tr style={{ borderBottom: "1px dashed var(--cinza-cl)" }}>
      <td style={tdTipo()}>{doc.tipo}</td>
      <td style={{ ...td(), fontFamily: "var(--serif)" }}>
        {doc.nome_arquivo}
      </td>
      <td style={td()}>
        {doc.validade ? (
          <span style={{ color: vencida ? "var(--vermelho)" : "inherit" }}>
            {new Date(doc.validade).toLocaleDateString("pt-BR")}
            {vencida ? " · vencida" : ""}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td style={td()}>
        {new Date(doc.criado_em).toLocaleDateString("pt-BR")}
      </td>
      <td style={{ ...td(), textAlign: "right" }}>
        <button
          type="button"
          disabled={pendingView}
          onClick={() => {
            startView(async () => {
              const r = await gerarSignedUrl(doc.storage_path);
              if (r.error) showError("Não foi possível abrir", r.error);
              else if (r.url) window.open(r.url, "_blank");
            });
          }}
          style={btn()}
        >
          {pendingView ? "…" : "abrir"}
        </button>
        <ConfirmDialog
          titulo={`Remover "${doc.nome_arquivo}"?`}
          descricao="Arquivo será excluído do Storage."
          textoConfirmar="Remover"
          variant="perigo"
          trigger={<button type="button" style={btn()}>remover</button>}
          onConfirmar={async () => {
            const r = await removerDocumento(empregadoId, doc.id);
            showResult(r, "Documento removido");
          }}
        />
      </td>
    </tr>
  );
}

function th(): React.CSSProperties {
  return {
    textAlign: "left",
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--cinza)",
    fontWeight: 700,
    padding: "8px 12px 8px 0",
  };
}
function td(): React.CSSProperties {
  return { padding: "10px 12px 10px 0", color: "var(--marinho)" };
}
function tdTipo(): React.CSSProperties {
  return {
    ...td(),
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: 700,
    color: "var(--marinho-med)",
  };
}
function btn(): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    color: "var(--cinza)",
    cursor: "pointer",
    fontFamily: "var(--ui)",
    fontSize: 12,
    marginLeft: 8,
  };
}
