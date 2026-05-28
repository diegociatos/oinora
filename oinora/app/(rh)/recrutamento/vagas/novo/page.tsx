import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { WizardVaga } from "./_form";
import layout from "../../../layout.module.css";
import shared from "../../../_form.module.css";

export const metadata = { title: "Nova vaga" };

export default async function NovaVagaPage() {
  const session = await requireSession();
  if (!["owner", "admin", "recrutador_oinora", "hr_ops"].includes(session.role)) {
    redirect("/recrutamento/vagas");
  }

  const supabase = await createClient();
  const [{ data: cargos }, { data: deptos }, { data: locais }, { data: empregados }] = await Promise.all([
    supabase.from("cargos").select("id, nome, nivel").order("nome"),
    supabase.from("departamentos").select("id, nome, sigla").order("nome"),
    supabase.from("locais_trabalho").select("id, nome").order("nome"),
    supabase
      .from("empregados")
      .select("id, nome_completo, matricula")
      .eq("status", "ativo")
      .order("nome_completo"),
  ]);

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Nova <em>vaga</em>
        </h1>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Criar <em>nova vaga</em>
          </h2>
          <p>
            5 passos pra publicar uma vaga. Marque como rascunho se quiser
            revisar antes — Pause/publique depois pelo botão na ficha da vaga.
          </p>
        </div>
        <WizardVaga
          cargos={(cargos ?? []).map((c) => ({
            id: c.id,
            label: `${c.nome}${c.nivel ? ` · ${c.nivel}` : ""}`,
          }))}
          departamentos={(deptos ?? []).map((d) => ({
            id: d.id,
            label: d.sigla ? `${d.sigla} · ${d.nome}` : d.nome,
          }))}
          locais={(locais ?? []).map((l) => ({ id: l.id, label: l.nome }))}
          gestores={(empregados ?? []).map((e) => ({
            id: e.id,
            label: `${e.nome_completo} · mat. ${e.matricula}`,
          }))}
        />
      </div>
    </>
  );
}
