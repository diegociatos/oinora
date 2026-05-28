import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { toCSV } from "@/lib/utils/csv";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("folha_holerites")
    .select(
      "salario_base_centavos, total_proventos_centavos, total_descontos_centavos, total_liquido_centavos, inss_desconto_centavos, irrf_desconto_centavos, fgts_centavos, liberado_para_empregado, empregado:empregado_id(matricula, nome_completo, cpf)",
    )
    .eq("competencia_id", id)
    .order("empregado(nome_completo)");

  const rows = (data ?? []).map((h) => {
    const e = Array.isArray(h.empregado) ? h.empregado[0] : h.empregado;
    return {
      matricula: e?.matricula ?? "",
      nome: e?.nome_completo ?? "",
      cpf: e?.cpf ?? "",
      salario_base: (h.salario_base_centavos / 100).toFixed(2).replace(".", ","),
      proventos: (h.total_proventos_centavos / 100).toFixed(2).replace(".", ","),
      descontos: (h.total_descontos_centavos / 100).toFixed(2).replace(".", ","),
      liquido: (h.total_liquido_centavos / 100).toFixed(2).replace(".", ","),
      inss: ((h.inss_desconto_centavos ?? 0) / 100).toFixed(2).replace(".", ","),
      irrf: ((h.irrf_desconto_centavos ?? 0) / 100).toFixed(2).replace(".", ","),
      fgts: ((h.fgts_centavos ?? 0) / 100).toFixed(2).replace(".", ","),
      liberado: h.liberado_para_empregado ? "sim" : "não",
    };
  });

  const csv = toCSV(rows, [
    { key: "matricula", label: "Matrícula" },
    { key: "nome", label: "Nome" },
    { key: "cpf", label: "CPF" },
    { key: "salario_base", label: "Salário base (R$)" },
    { key: "proventos", label: "Proventos (R$)" },
    { key: "descontos", label: "Descontos (R$)" },
    { key: "liquido", label: "Líquido (R$)" },
    { key: "inss", label: "INSS (R$)" },
    { key: "irrf", label: "IRRF (R$)" },
    { key: "fgts", label: "FGTS (R$)" },
    { key: "liberado", label: "Liberado p/ empregado" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="folha-${id}.csv"`,
    },
  });
}
