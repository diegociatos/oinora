import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/utils/format";
import { STAGE_LABEL } from "@/lib/utils/stages";
import layout from "../layout.module.css";
import shared from "../_form.module.css";

export const metadata = { title: "Banco de talentos" };

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("candidatos")
    .select(
      "id, nome_completo, email, cidade, uf, pretensao_salarial_centavos, criado_em, candidaturas:candidatura_vaga(stage, vaga:vaga_id(codigo, titulo))",
    )
    .order("criado_em", { ascending: false })
    .limit(200);

  if (q) query = query.ilike("nome_completo", `%${q}%`);
  const { data: candidatos } = await query;

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Banco de talentos</em>
        </h1>
        <div className={layout.topbarActions}>
          {candidatos?.length ?? 0} candidatos
        </div>
      </header>

      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Pessoas que <em>se candidataram</em>
          </h2>
          <p>
            Match semântico ativa com VOYAGE_API_KEY. Por enquanto: busca por nome
            simples.
          </p>
        </div>

        <form
          style={{
            display: "flex",
            gap: "var(--space-3)",
            marginBottom: "var(--space-6)",
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar candidato por nome…"
            style={{
              minWidth: 320,
              padding: "8px 12px",
              border: "1px solid var(--cinza-cl)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "var(--marinho)",
              color: "var(--branco)",
              border: "none",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              cursor: "pointer",
            }}
          >
            Buscar
          </button>
        </form>

        <table
          style={{
            width: "100%",
            background: "var(--branco)",
            border: "1px solid var(--cinza-cl)",
            borderRadius: "var(--radius-sharp)",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontFamily: "var(--ui)",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {["Nome", "Email", "Cidade", "Pretensão", "Candidaturas", "Inscrito em"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: 10,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "var(--cinza)",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--cinza-cl)",
                    background: "var(--papel)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(candidatos ?? []).map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--cinza-cl)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 500, color: "var(--marinho-esc)" }}>
                  {c.nome_completo}
                </td>
                <td style={{ padding: "12px 16px" }}>{c.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  {c.cidade ? `${c.cidade}${c.uf ? `/${c.uf}` : ""}` : "—"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {c.pretensao_salarial_centavos
                    ? formatarMoeda(c.pretensao_salarial_centavos)
                    : "—"}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 11 }}>
                  {Array.isArray(c.candidaturas) && c.candidaturas.length > 0 ? (
                    c.candidaturas.map((cv: { stage: string; vaga: { codigo: string }[] | { codigo: string } | null }, i: number) => {
                      const v = Array.isArray(cv.vaga) ? cv.vaga[0] : cv.vaga;
                      return (
                        <div key={i} style={{ color: "var(--cinza)" }}>
                          {v?.codigo ?? "—"} ·{" "}
                          <span style={{ color: "var(--laranja)", fontStyle: "italic" }}>
                            {STAGE_LABEL[cv.stage] ?? cv.stage}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: "var(--cinza)" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--cinza)" }}>
                  {formatarData(c.criado_em)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
