import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { toCSV } from "@/lib/utils/csv";

export async function GET() {
  const session = await requireSession();
  if (session.role !== "owner") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("criado_em, acao, recurso_tipo, recurso_id, usuario:usuario_id(nome_completo, email)")
    .eq("tenant_id", session.tenantId)
    .order("criado_em", { ascending: false })
    .limit(5000);

  const rows = (data ?? []).map((a) => {
    const u = Array.isArray(a.usuario) ? a.usuario[0] : a.usuario;
    return {
      quando: a.criado_em,
      acao: a.acao,
      recurso_tipo: a.recurso_tipo,
      recurso_id: a.recurso_id,
      usuario_nome: u?.nome_completo ?? "",
      usuario_email: u?.email ?? "",
    };
  });

  const csv = toCSV(rows, [
    { key: "quando", label: "Quando" },
    { key: "acao", label: "Ação" },
    { key: "recurso_tipo", label: "Recurso" },
    { key: "recurso_id", label: "ID do recurso" },
    { key: "usuario_nome", label: "Usuário" },
    { key: "usuario_email", label: "Email" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
