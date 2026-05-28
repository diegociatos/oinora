import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarDataLonga } from "@/lib/utils/format";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import { ChecklistItem } from "./_checklist";

export const metadata = { title: "Onboarding" };

export default async function OnboardingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();
  const { data: onb } = await supabase
    .from("onboarding_empregado")
    .select(
      `id, status, data_inicio, data_termino_previsto, percentual_concluido,
       empregado:empregado_id(id, nome_completo, matricula, cargo:cargo_id(nome)),
       mentor:mentor_id(nome_completo)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!onb) notFound();

  const { data: itens } = await supabase
    .from("onboarding_checklist")
    .select("id, titulo, descricao, dia_alvo, data_alvo, concluido")
    .eq("onboarding_id", id)
    .order("dia_alvo");

  const emp = Array.isArray(onb.empregado) ? onb.empregado[0] : onb.empregado;
  const cargo = emp?.cargo ? (Array.isArray(emp.cargo) ? emp.cargo[0] : emp.cargo) : null;
  const mentor = Array.isArray(onb.mentor) ? onb.mentor[0] : onb.mentor;
  const total = itens?.length ?? 0;
  const done = itens?.filter((i) => i.concluido).length ?? 0;

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Onboarding · <em>{emp?.nome_completo}</em>
        </h1>
        <div className={layout.topbarActions}>
          {done}/{total} ({onb.percentual_concluido}%)
        </div>
      </header>
      <div className={layout.content}>
        <Link
          href="/onboarding"
          style={{ color: "var(--cinza)", fontFamily: "var(--ui)", fontSize: 13, marginBottom: 16, display: "inline-block" }}
        >
          ← Voltar
        </Link>

        <div className={shared.headerPagina} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div>
            <h2>
              {emp?.nome_completo} · <em>{cargo?.nome ?? "—"}</em>
            </h2>
            <p>
              Início: {formatarDataLonga(onb.data_inicio)} · término previsto: {formatarData(onb.data_termino_previsto)}
              {mentor ? ` · mentor(a) ${mentor.nome_completo}` : ""}
            </p>
          </div>
          <div style={{ minWidth: 200 }}>
            <div style={{ height: 8, background: "var(--cinza-fundo)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${onb.percentual_concluido}%`, height: "100%", background: "var(--laranja)" }} />
            </div>
            <div style={{ fontFamily: "var(--ui)", fontSize: 11, color: "var(--cinza)", letterSpacing: 1, textTransform: "uppercase", marginTop: 4, textAlign: "right", fontWeight: 600 }}>
              {onb.percentual_concluido}% concluído
            </div>
          </div>
        </div>

        <div className={shared.painel}>
          <h3 className={shared.painelTitulo}>Checklist</h3>
          {(itens ?? []).map((it) => (
            <ChecklistItem key={it.id} item={it} onboardingId={id} />
          ))}
        </div>
      </div>
    </>
  );
}
