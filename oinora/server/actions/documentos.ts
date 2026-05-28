"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export const initialDocumentoState: FormState = { status: "idle" };

const TIPOS_PERMITIDOS = [
  "rg",
  "cpf",
  "ctps",
  "comprovante_endereco",
  "aso",
  "aso_admissional",
  "aso_periodico",
  "aso_demissional",
  "certificado_nr06",
  "certificado_nr10",
  "certificado_nr18",
  "certificado_nr33",
  "certificado_nr35",
  "diploma",
  "contrato",
  "outros",
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MIMES_OK = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}

export async function uploadDocumento(
  empregadoId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }

  const tipo = String(formData.get("tipo") ?? "").trim();
  const validade = String(formData.get("validade") ?? "").trim();
  const file = formData.get("arquivo") as File | null;

  if (!file || file.size === 0) {
    return {
      status: "error",
      message: "Selecione um arquivo.",
      fieldErrors: { arquivo: "Arquivo obrigatório" },
    };
  }
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    return {
      status: "error",
      message: "Tipo de documento inválido.",
      fieldErrors: { tipo: "Tipo obrigatório" },
    };
  }
  if (file.size > MAX_BYTES) {
    return {
      status: "error",
      message: "Arquivo grande demais (limite 10 MB).",
    };
  }
  if (!MIMES_OK.includes(file.type)) {
    return {
      status: "error",
      message: `Tipo de arquivo não suportado (${file.type}). Use PDF, JPG, PNG ou DOCX.`,
    };
  }

  // Verifica se o empregado pertence ao tenant antes de upload
  const supabase = await createClient();
  const { data: emp } = await supabase
    .from("empregados")
    .select("id, tenant_id")
    .eq("id", empregadoId)
    .maybeSingle();
  if (!emp || emp.tenant_id !== session.tenantId) {
    return { status: "error", message: "Empregado não encontrado no tenant." };
  }

  // Upload no Storage com service_role
  const admin = createAdminClient();
  const filename = sanitizeFilename(file.name);
  const ts = Date.now();
  const storagePath = `${session.tenantId}/${empregadoId}/${ts}_${filename}`;

  const { error: upErr } = await admin.storage
    .from("documentos-empregado")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr) {
    return {
      status: "error",
      message: `Upload falhou: ${upErr.message}`,
    };
  }

  // Registra no banco
  const { error: dbErr } = await supabase.from("empregado_documentos").insert({
    empregado_id: empregadoId,
    tenant_id: session.tenantId,
    tipo,
    nome_arquivo: filename,
    storage_path: storagePath,
    validade: validade || null,
    enviado_por: session.userId,
  });

  if (dbErr) {
    // Rollback do upload se falhar
    await admin.storage.from("documentos-empregado").remove([storagePath]);
    return { status: "error", message: dbErr.message };
  }

  revalidatePath(`/empregados/${empregadoId}`);
  return { status: "success", message: "Documento enviado." };
}

export async function removerDocumento(
  empregadoId: string,
  documentoId: string,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("empregado_documentos")
    .select("storage_path")
    .eq("id", documentoId)
    .maybeSingle();
  if (!doc) return { status: "error", message: "Documento não encontrado." };

  const admin = createAdminClient();
  await admin.storage
    .from("documentos-empregado")
    .remove([doc.storage_path]);

  const { error } = await supabase
    .from("empregado_documentos")
    .delete()
    .eq("id", documentoId);
  if (error) return { status: "error", message: error.message };

  revalidatePath(`/empregados/${empregadoId}`);
  return { status: "success", message: "Documento removido." };
}

export async function gerarSignedUrl(storagePath: string): Promise<{
  url?: string;
  error?: string;
}> {
  const session = await requireSession();
  // Valida que o storage path pertence ao tenant
  if (!storagePath.startsWith(`${session.tenantId}/`)) {
    return { error: "Acesso negado." };
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("documentos-empregado")
    .createSignedUrl(storagePath, 60 * 5); // 5 minutos
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
