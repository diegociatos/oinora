import { createClient } from "@/lib/supabase/server";

export type OpcoesEmpregado = {
  cargos: Array<{ id: string; label: string }>;
  departamentos: Array<{ id: string; label: string }>;
  centrosCusto: Array<{ id: string; label: string }>;
  jornadas: Array<{ id: string; label: string }>;
  locais: Array<{ id: string; label: string }>;
  gestoresPossiveis: Array<{ id: string; label: string }>;
};

export async function carregarOpcoesEmpregado(
  excluirEmpregadoId?: string,
): Promise<OpcoesEmpregado> {
  const supabase = await createClient();

  const [
    { data: cargos },
    { data: departamentos },
    { data: centrosCusto },
    { data: jornadas },
    { data: locais },
    { data: empregados },
  ] = await Promise.all([
    supabase.from("cargos").select("id, nome, nivel").order("nome"),
    supabase.from("departamentos").select("id, nome, sigla").order("nome"),
    supabase.from("centros_custo").select("id, codigo, nome").order("codigo"),
    supabase.from("jornadas").select("id, nome").order("nome"),
    supabase.from("locais_trabalho").select("id, nome").order("nome"),
    supabase
      .from("empregados")
      .select("id, nome_completo, matricula")
      .eq("status", "ativo")
      .order("nome_completo"),
  ]);

  return {
    cargos: (cargos ?? []).map((c) => ({
      id: c.id,
      label: `${c.nome}${c.nivel ? ` · ${c.nivel}` : ""}`,
    })),
    departamentos: (departamentos ?? []).map((d) => ({
      id: d.id,
      label: d.sigla ? `${d.sigla} · ${d.nome}` : d.nome,
    })),
    centrosCusto: (centrosCusto ?? []).map((c) => ({
      id: c.id,
      label: `${c.codigo} · ${c.nome}`,
    })),
    jornadas: (jornadas ?? []).map((j) => ({ id: j.id, label: j.nome })),
    locais: (locais ?? []).map((l) => ({ id: l.id, label: l.nome })),
    gestoresPossiveis: (empregados ?? [])
      .filter((e) => e.id !== excluirEmpregadoId)
      .map((e) => ({
        id: e.id,
        label: `${e.nome_completo} · mat. ${e.matricula}`,
      })),
  };
}
