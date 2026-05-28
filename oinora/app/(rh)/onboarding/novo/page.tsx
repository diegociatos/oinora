import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FormCriarOnboarding } from "./_form";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";

export const metadata = { title: "Novo onboarding" };

export default async function NovoOnboardingPage() {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    redirect("/onboarding");
  }
  const supabase = await createClient();
  const [{ data: empregados }, { data: templates }] = await Promise.all([
    supabase
      .from("empregados")
      .select("id, nome_completo, matricula, cargo:cargo_id(nome)")
      .eq("status", "ativo")
      .order("nome_completo"),
    supabase
      .from("onboarding_templates")
      .select("id, nome, duracao_dias, cargo:cargo_id(nome)")
      .order("nome"),
  ]);

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Novo <em>onboarding</em>
        </h1>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Iniciar onboarding de <em>novo empregado</em>
          </h2>
          <p>
            Escolha o empregado, o template (que define a checklist + duração) e
            o mentor. A checklist é clonada automaticamente com datas-alvo
            calculadas a partir da data de início.
          </p>
        </div>
        <FormCriarOnboarding
          empregados={(empregados ?? []).map((e) => {
            const c = Array.isArray(e.cargo) ? e.cargo[0] : e.cargo;
            return {
              id: e.id,
              label: `${e.nome_completo} · mat. ${e.matricula}${c ? ` · ${c.nome}` : ""}`,
            };
          })}
          templates={(templates ?? []).map((t) => {
            const c = Array.isArray(t.cargo) ? t.cargo[0] : t.cargo;
            return {
              id: t.id,
              label: `${t.nome} · ${t.duracao_dias} dias${c ? ` · ${c.nome}` : ""}`,
            };
          })}
        />
      </div>
    </>
  );
}
