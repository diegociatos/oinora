"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export const initialProcDocState: FormState = { status: "idle" };

const MAX = 15 * 1024 * 1024; // 15MB
const MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function sanitize(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}

export async function uploadDocProcesso(
  processoId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "advogado_interno", "advogado_externo"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const file = formData.get("arquivo") as File | null;
  const tipo = String(formData.get("tipo") ?? "").trim();

  if (!file || file.size === 0) {
    return { status: "error", message: "Selecione um arquivo." };
  }
  if (file.size > MAX) {
    return { status: "error", message: "Arquivo grande demais (15 MB)." };
  }
  if (!MIMES.includes(file.type)) {
    return { status: "error", message: `Tipo não suportado (${file.type}).` };
  }
  if (!tipo) {
    return { status: "error", message: "Tipo obrigatório." };
  }

  const supabase = await createClient();
  const { data: proc } = await supabase
    .from("processos_juridicos")
    .select("id, tenant_id")
    .eq("id", processoId)
    .maybeSingle();
  if (!proc || proc.tenant_id !== session.tenantId) {
    return { status: "error", message: "Processo não encontrado." };
  }

  const admin = createAdminClient();
  const filename = sanitize(file.name);
  const ts = Date.now();
  const storagePath = `${session.tenantId}/processos/${processoId}/${ts}_${filename}`;

  const { error: upErr } = await admin.storage
    .from("documentos-empregado")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });
  if (upErr) return { status: "error", message: `Upload: ${upErr.message}` };

  const { error: dbErr } = await supabase.from("processo_documentos").insert({
    tenant_id: session.tenantId,
    processo_id: processoId,
    tipo,
    nome_arquivo: filename,
    storage_path: storagePath,
    tamanho_bytes: file.size,
    enviado_por: session.userId,
  });
  if (dbErr) {
    await admin.storage.from("documentos-empregado").remove([storagePath]);
    return { status: "error", message: dbErr.message };
  }
  revalidatePath(`/juridico/${processoId}`);
  return { status: "success", message: "Documento anexado." };
}

export async function removerDocProcesso(
  processoId: string,
  docId: string,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "advogado_interno", "advogado_externo"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { data: d } = await supabase
    .from("processo_documentos")
    .select("storage_path")
    .eq("id", docId)
    .maybeSingle();
  if (!d) return { status: "error", message: "Documento não encontrado." };

  const admin = createAdminClient();
  await admin.storage.from("documentos-empregado").remove([d.storage_path]);
  await supabase.from("processo_documentos").delete().eq("id", docId);
  revalidatePath(`/juridico/${processoId}`);
  return { status: "success", message: "Documento removido." };
}

export async function signedUrlDocProcesso(
  storagePath: string,
): Promise<{ url?: string; error?: string }> {
  const session = await requireSession();
  if (!storagePath.startsWith(`${session.tenantId}/`)) {
    return { error: "Acesso negado." };
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("documentos-empregado")
    .createSignedUrl(storagePath, 60 * 5);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
