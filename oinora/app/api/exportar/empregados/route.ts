import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { toCSV } from "@/lib/utils/csv";

export async function GET() {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("empregados")
    .select(
      "matricula, nome_completo, cpf, data_nascimento, sexo, raca_cor, estado_civil, email_pessoal, telefone_principal, data_admissao, salario_centavos, status, cargo:cargo_id(nome, nivel, cbo), departamento:departamento_id(nome, sigla)",
    )
    .order("nome_completo");

  type Row = {
    matricula: string;
    nome_completo: string;
    cpf: string;
    data_nascimento: string;
    sexo: string;
    raca_cor: string;
    estado_civil: string;
    email_pessoal: string;
    telefone_principal: string;
    data_admissao: string;
    salario_reais: string;
    status: string;
    cargo: string;
    cbo: string;
    departamento: string;
  };

  const rows: Row[] = (data ?? []).map((e) => {
    const c = Array.isArray(e.cargo) ? e.cargo[0] : e.cargo;
    const d = Array.isArray(e.departamento) ? e.departamento[0] : e.departamento;
    return {
      matricula: e.matricula,
      nome_completo: e.nome_completo,
      cpf: e.cpf,
      data_nascimento: e.data_nascimento,
      sexo: e.sexo ?? "",
      raca_cor: e.raca_cor ?? "",
      estado_civil: e.estado_civil ?? "",
      email_pessoal: e.email_pessoal ?? "",
      telefone_principal: e.telefone_principal ?? "",
      data_admissao: e.data_admissao,
      salario_reais: (e.salario_centavos / 100).toFixed(2).replace(".", ","),
      status: e.status,
      cargo: c?.nome ?? "",
      cbo: c?.cbo ?? "",
      departamento: d?.nome ?? "",
    };
  });

  const csv = toCSV(rows, [
    { key: "matricula", label: "Matrícula" },
    { key: "nome_completo", label: "Nome completo" },
    { key: "cpf", label: "CPF" },
    { key: "data_nascimento", label: "Nascimento" },
    { key: "sexo", label: "Sexo" },
    { key: "raca_cor", label: "Raça/cor" },
    { key: "estado_civil", label: "Estado civil" },
    { key: "email_pessoal", label: "Email pessoal" },
    { key: "telefone_principal", label: "Telefone" },
    { key: "data_admissao", label: "Admissão" },
    { key: "salario_reais", label: "Salário (R$)" },
    { key: "status", label: "Status" },
    { key: "cargo", label: "Cargo" },
    { key: "cbo", label: "CBO" },
    { key: "departamento", label: "Departamento" },
  ]);

  const filename = `empregados-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
