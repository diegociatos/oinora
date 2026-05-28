import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarData, calcularTempoCasa } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  await requireSession();
  const supabase = await createClient();
  const { data: onbs } = await supabase
    .from("onboarding_empregado")
    .select(
      "id, status, data_inicio, data_termino_previsto, percentual_concluido, empregado:empregado_id(id, nome_completo, matricula, cargo:cargo_id(nome), data_admissao), mentor:mentor_id(nome_completo)",
    )
    .order("data_inicio", { ascending: false });

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Onboarding</em>
        </h1>
        <div className={layout.topbarActions}>{onbs?.length ?? 0} em curso</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Integração de <em>novos empregados</em>
          </h2>
          <p>
            Checklists D+0 a D+30. Mentores + RH acompanham progresso.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: 16,
          }}
        >
          {(onbs ?? []).map((o) => {
            const e = Array.isArray(o.empregado) ? o.empregado[0] : o.empregado;
            const c = e && e.cargo ? (Array.isArray(e.cargo) ? e.cargo[0] : e.cargo) : null;
            const m = Array.isArray(o.mentor) ? o.mentor[0] : o.mentor;
            return (
              <Link
                key={o.id}
                href={`/onboarding/${o.id}`}
                style={{
                  background: "var(--branco)",
                  border: "1px solid var(--cinza-cl)",
                  borderRadius: "var(--radius-sharp)",
                  padding: 20,
                  textDecoration: "none",
                  color: "var(--marinho)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: "var(--cinza)",
                    fontFamily: "var(--ui)",
                    fontWeight: 700,
                  }}
                >
                  {o.status} · {o.percentual_concluido}%
                </div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 400 }}>
                  {e?.nome_completo}
                </div>
                <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)" }}>
                  mat. {e?.matricula} · {c?.nome ?? "—"}
                </div>
                <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--cinza)" }}>
                  Início: {formatarData(o.data_inicio)} · termina {formatarData(o.data_termino_previsto)}
                </div>
                {m ? (
                  <div style={{ fontFamily: "var(--ui)", fontSize: 11, color: "var(--cinza)", marginTop: 4 }}>
                    Mentor(a): <strong style={{ color: "var(--marinho)" }}>{m.nome_completo}</strong>
                  </div>
                ) : null}
                {/* Progress bar */}
                <div style={{ marginTop: 8, height: 6, background: "var(--cinza-fundo)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${o.percentual_concluido}%`,
                      height: "100%",
                      background: "var(--laranja)",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
        {(onbs ?? []).length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              fontFamily: "var(--ui)",
              color: "var(--cinza)",
            }}
          >
            Nenhum onboarding em curso.
          </div>
        ) : null}
      </div>
    </>
  );
}
