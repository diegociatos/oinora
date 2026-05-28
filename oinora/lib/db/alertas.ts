import { createClient } from "@/lib/supabase/server";

export type Alerta = {
  id: string;
  severidade: "critico" | "aviso";
  tipo: "aso_vencido" | "aso_proximo" | "nr_vencida" | "nr_proxima";
  titulo: string;
  empregadoId: string;
  empregadoNome: string;
  matricula: string;
  data: string; // ISO
  diasParaVencer: number; // negativo se já venceu
};

export async function carregarAlertas(): Promise<Alerta[]> {
  const supabase = await createClient();
  const hoje = new Date();
  const em30Dias = new Date();
  em30Dias.setDate(hoje.getDate() + 30);

  // ASO periódico vencido ou próximo
  const { data: asoEmp } = await supabase
    .from("empregados")
    .select("id, matricula, nome_completo, proximo_aso_periodico, status")
    .eq("status", "ativo")
    .not("proximo_aso_periodico", "is", null)
    .lte("proximo_aso_periodico", em30Dias.toISOString().slice(0, 10))
    .order("proximo_aso_periodico");

  const alertas: Alerta[] = [];

  for (const e of asoEmp ?? []) {
    if (!e.proximo_aso_periodico) continue;
    const venc = new Date(e.proximo_aso_periodico);
    const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);
    alertas.push({
      id: `aso-${e.id}`,
      severidade: diff < 0 ? "critico" : "aviso",
      tipo: diff < 0 ? "aso_vencido" : "aso_proximo",
      titulo:
        diff < 0
          ? `ASO periódico vencido há ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "dia" : "dias"}`
          : `ASO periódico vence em ${diff} ${diff === 1 ? "dia" : "dias"}`,
      empregadoId: e.id,
      empregadoNome: e.nome_completo,
      matricula: e.matricula,
      data: e.proximo_aso_periodico,
      diasParaVencer: diff,
    });
  }

  // NRs (documentos com validade)
  const { data: nrs } = await supabase
    .from("empregado_documentos")
    .select(
      "id, tipo, nome_arquivo, validade, empregado:empregado_id(id, matricula, nome_completo, status)",
    )
    .like("tipo", "certificado_nr%")
    .not("validade", "is", null)
    .lte("validade", em30Dias.toISOString().slice(0, 10))
    .order("validade");

  for (const d of nrs ?? []) {
    if (!d.validade) continue;
    const emp = Array.isArray(d.empregado) ? d.empregado[0] : d.empregado;
    if (!emp || emp.status !== "ativo") continue;
    const venc = new Date(d.validade);
    const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);
    const codigo = d.tipo.replace("certificado_", "").toUpperCase().replace("NR", "NR-");
    alertas.push({
      id: `nr-${d.id}`,
      severidade: diff < 0 ? "critico" : "aviso",
      tipo: diff < 0 ? "nr_vencida" : "nr_proxima",
      titulo:
        diff < 0
          ? `${codigo} vencida há ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "dia" : "dias"}`
          : `${codigo} vence em ${diff} ${diff === 1 ? "dia" : "dias"}`,
      empregadoId: emp.id,
      empregadoNome: emp.nome_completo,
      matricula: emp.matricula,
      data: d.validade,
      diasParaVencer: diff,
    });
  }

  // Ordena: críticos primeiro, depois por dias para vencer
  alertas.sort((a, b) => {
    if (a.severidade !== b.severidade) {
      return a.severidade === "critico" ? -1 : 1;
    }
    return a.diasParaVencer - b.diasParaVencer;
  });

  return alertas;
}

export async function contarAlertas(): Promise<{
  total: number;
  criticos: number;
}> {
  const alertas = await carregarAlertas();
  return {
    total: alertas.length,
    criticos: alertas.filter((a) => a.severidade === "critico").length,
  };
}
