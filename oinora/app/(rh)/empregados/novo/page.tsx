import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { carregarOpcoesEmpregado } from "@/lib/db/opcoes-empregado";
import { EmpregadoForm } from "../_empregado-form";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";

export const metadata = { title: "Novo empregado" };

export default async function NovoEmpregadoPage() {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    redirect("/empregados");
  }

  const opcoes = await carregarOpcoesEmpregado();

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Novo <em>empregado</em>
        </h1>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Cadastrar <em>novo empregado</em>
          </h2>
          <p>
            Preencha os dados abaixo. Os campos com <strong>*</strong> são
            obrigatórios. Uma admissão automática será registrada no histórico.
          </p>
        </div>
        <EmpregadoForm modo="criar" {...opcoes} />
      </div>
    </>
  );
}
