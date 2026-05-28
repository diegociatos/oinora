import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarData } from "@/lib/utils/format";
import { VAGA_STATUS_LABEL } from "@/lib/utils/stages";
import layout from "../../layout.module.css";
import shared from "../../_form.module.css";
import styles from "../page.module.css";

export const metadata = { title: "Vagas" };

export default async function VagasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const status = sp.status ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("vagas")
    .select(
      "id, codigo, titulo, status, afirmativa, publico_alvo, data_publicacao, salario_min_centavos, salario_max_centavos, cargo:cargo_id(nome), departamento:departamento_id(nome, sigla)",
    )
    .order("data_publicacao", { ascending: false, nullsFirst: false });

  if (status) query = query.eq("status", status);
  const { data: vagas } = await query;

  // Contagens de candidatos por vaga
  const ids = (vagas ?? []).map((v) => v.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: cv } = await supabase
      .from("candidatura_vaga")
      .select("vaga_id");
    for (const c of cv ?? []) {
      counts[c.vaga_id] = (counts[c.vaga_id] ?? 0) + 1;
    }
  }

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Vagas</em>
        </h1>
        <div className={layout.topbarActions}>
          {vagas?.length ?? 0} vagas
        </div>
      </header>
      <div className={layout.content}>
        <div className={styles.headerLista}>
          <div>
            <h2>
              Pipeline de <em>recrutamento</em>
            </h2>
            <p>
              Vagas em aberto, publicadas no portal e preenchidas. Match com IA virá quando ANTHROPIC_API_KEY estiver configurada.
            </p>
          </div>
          <Link
            href="/recrutamento/vagas/novo"
            style={{
              padding: "10px 20px",
              background: "var(--laranja)",
              color: "var(--branco)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: "var(--fs-sm)",
              fontWeight: 500,
            }}
          >
            + Nova vaga
          </Link>
        </div>

        <form
          style={{
            display: "flex",
            gap: "var(--space-3)",
            marginBottom: "var(--space-6)",
          }}
        >
          <select
            name="status"
            defaultValue={status}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--cinza-cl)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: "var(--fs-sm)",
            }}
          >
            <option value="">Todos os status</option>
            {Object.entries(VAGA_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "var(--marinho)",
              color: "var(--branco)",
              border: "none",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: "var(--fs-sm)",
              cursor: "pointer",
            }}
          >
            Filtrar
          </button>
        </form>

        {!vagas || vagas.length === 0 ? (
          <div
            style={{
              padding: "var(--space-10)",
              textAlign: "center",
              color: "var(--cinza)",
              fontFamily: "var(--ui)",
            }}
          >
            Nenhuma vaga cadastrada.
          </div>
        ) : (
          <div className={styles.cards}>
            {vagas.map((v) => {
              const c = Array.isArray(v.cargo) ? v.cargo[0] : v.cargo;
              const d = Array.isArray(v.departamento) ? v.departamento[0] : v.departamento;
              return (
                <Link
                  key={v.id}
                  href={`/recrutamento/vagas/${v.id}`}
                  className={styles.card}
                >
                  <div className={styles.cardHead}>
                    <span className={styles.codigo}>{v.codigo}</span>
                    <span
                      className={`${styles.statusTag} ${styles[v.status] ?? ""}`}
                    >
                      {VAGA_STATUS_LABEL[v.status] ?? v.status}
                    </span>
                  </div>
                  <div className={styles.titulo}>{v.titulo}</div>
                  {v.afirmativa ? (
                    <span className={styles.afirmativa}>
                      ★ Vaga afirmativa
                      {v.publico_alvo ? ` · ${v.publico_alvo}` : ""}
                    </span>
                  ) : null}
                  <div className={styles.meta}>
                    {d ? (
                      <span>
                        <strong>{d.sigla ? `${d.sigla} · ` : ""}{d.nome}</strong>
                      </span>
                    ) : null}
                    {c ? <span>{c.nome}</span> : null}
                    {v.salario_min_centavos && v.salario_max_centavos ? (
                      <span>
                        {formatarMoeda(v.salario_min_centavos)} –{" "}
                        {formatarMoeda(v.salario_max_centavos)}
                      </span>
                    ) : null}
                    <span style={{ marginTop: 4, color: "var(--marinho)" }}>
                      <strong>{counts[v.id] ?? 0}</strong> candidato{counts[v.id] === 1 ? "" : "s"}
                      {v.data_publicacao ? ` · publicada em ${formatarData(v.data_publicacao)}` : ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
