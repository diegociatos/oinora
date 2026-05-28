import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { FormProcesso } from "./_form";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";

export const metadata = { title: "Novo processo" };

export default async function NovoProcessoPage() {
  const session = await requireSession();
  if (!["owner", "advogado_interno", "advogado_externo"].includes(session.role)) {
    redirect("/juridico");
  }
  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Novo <em>processo</em>
        </h1>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Cadastrar novo <em>processo trabalhista</em>
          </h2>
          <p>
            Insira o CNJ exatamente como gerado pelo PJe. Cálculo de risco IA
            entra quando ANTHROPIC_API_KEY for configurada.
          </p>
        </div>
        <FormProcesso />
      </div>
    </>
  );
}
