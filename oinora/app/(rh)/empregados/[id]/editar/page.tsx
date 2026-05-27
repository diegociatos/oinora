import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { carregarOpcoesEmpregado } from "@/lib/db/opcoes-empregado";
import { EmpregadoForm, type EmpregadoFormData } from "../../_empregado-form";
import layout from "../../../layout.module.css";
import shared from "../../../_form.module.css";

export const metadata = { title: "Editar empregado" };

export default async function EditarEmpregadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    redirect("/empregados");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: empregado } = await supabase
    .from("empregados")
    .select(
      `matricula, nome_completo, nome_social, cpf, rg, data_nascimento,
       sexo, raca_cor, estado_civil, nacionalidade, pis_pasep,
       ctps_numero, ctps_serie, ctps_uf,
       email_pessoal, telefone_principal,
       cargo_id, departamento_id, centro_custo_id, gestor_id, jornada_id, local_trabalho_id,
       tipo_contrato, data_admissao, salario_centavos,
       ultimo_aso, proximo_aso_periodico,
       nine_box_desempenho, nine_box_potencial`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!empregado) {
    notFound();
  }

  const opcoes = await carregarOpcoesEmpregado(id);

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Editar · <em>{empregado.nome_completo}</em>
        </h1>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Editar <em>empregado</em>
          </h2>
          <p>
            Mudanças de cargo, departamento ou salário geram automaticamente uma
            movimentação no histórico do empregado.
          </p>
        </div>
        <EmpregadoForm
          modo="editar"
          empregadoId={id}
          inicial={empregado as EmpregadoFormData}
          {...opcoes}
        />
      </div>
    </>
  );
}
