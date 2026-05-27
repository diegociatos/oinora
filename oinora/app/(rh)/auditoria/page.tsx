import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarDataLonga } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";
import styles from "./page.module.css";

export const metadata = { title: "Auditoria" };

const RECURSOS = [
  { value: "", label: "Todos os recursos" },
  { value: "empregados", label: "Empregados" },
  { value: "empregado_dependentes", label: "Dependentes" },
  { value: "empregado_documentos", label: "Documentos" },
  { value: "empregado_movimentacoes", label: "Movimentações" },
  { value: "tenants", label: "Tenant" },
  { value: "tenant_memberships", label: "Memberships" },
  { value: "usuarios", label: "Usuários" },
];

function detectTipo(acao: string): "insert" | "update" | "delete" | "other" {
  if (acao.endsWith(".insert")) return "insert";
  if (acao.endsWith(".update")) return "update";
  if (acao.endsWith(".delete")) return "delete";
  return "other";
}

function diffJsons(
  antes: Record<string, unknown> | null,
  depois: Record<string, unknown> | null,
): string {
  if (!antes && !depois) return "";
  if (!antes) return JSON.stringify(depois, null, 2);
  if (!depois) return JSON.stringify(antes, null, 2);

  const keys = new Set([...Object.keys(antes), ...Object.keys(depois)]);
  const diff: string[] = [];
  for (const k of Array.from(keys).sort()) {
    const a = antes[k];
    const b = depois[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diff.push(
        `${k}:\n  - ${JSON.stringify(a)}\n  + ${JSON.stringify(b)}`,
      );
    }
  }
  return diff.length > 0 ? diff.join("\n") : "(sem alterações detectadas)";
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ recurso?: string; q?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "owner") {
    redirect("/empregados");
  }

  const sp = await searchParams;
  const recurso = sp.recurso ?? "";
  const q = sp.q ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select(
      "id, criado_em, acao, recurso_tipo, recurso_id, dados_antes, dados_depois, usuario:usuario_id(nome_completo, email)",
    )
    .eq("tenant_id", session.tenantId)
    .order("criado_em", { ascending: false })
    .limit(100);

  if (recurso) query = query.eq("recurso_tipo", recurso);
  if (q) query = query.ilike("acao", `%${q}%`);

  const { data: eventos } = await query;
  const lista = eventos ?? [];

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Auditoria</em>
        </h1>
        <div className={layout.topbarActions}>
          {lista.length} eventos · últimos 100
        </div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            Trilha de <em>auditoria LGPD</em>
          </h2>
          <p>
            Toda alteração em dados pessoais é registrada automaticamente.
            Apenas owner do tenant tem acesso a este log.
          </p>
        </div>

        <form className={styles.filtros}>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por ação (ex: empregados.update)…"
            aria-label="Buscar evento"
          />
          <select name="recurso" defaultValue={recurso}>
            {RECURSOS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
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

        {lista.length === 0 ? (
          <div className={styles.vazio}>
            Nenhum evento de auditoria nesse filtro.
          </div>
        ) : (
          <div className={styles.lista}>
            {lista.map((e) => {
              const tipo = detectTipo(e.acao);
              const usr = Array.isArray(e.usuario) ? e.usuario[0] : e.usuario;
              const diff = diffJsons(
                e.dados_antes as Record<string, unknown> | null,
                e.dados_depois as Record<string, unknown> | null,
              );
              return (
                <article key={e.id} className={styles.evento}>
                  <div className={styles.eventoData}>
                    {formatarDataLonga(e.criado_em)}
                    <br />
                    <small style={{ fontFamily: "var(--ui)", fontStyle: "normal" }}>
                      {new Date(e.criado_em).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                  <div>
                    <div className={styles.eventoAcao}>
                      <span className={`${styles.tag} ${styles[tipo] ?? ""}`}>
                        {tipo}
                      </span>{" "}
                      <span className={styles.verbo}>{e.acao}</span>
                      <span style={{ color: "var(--cinza)" }}>
                        {" "}
                        · {e.recurso_tipo} · id {e.recurso_id.slice(0, 8)}…
                      </span>
                    </div>
                    <div className={styles.eventoUsuario}>
                      Por{" "}
                      <strong style={{ color: "var(--marinho)" }}>
                        {usr?.nome_completo ?? "sistema"}
                      </strong>
                      {usr?.email ? ` · ${usr.email}` : ""}
                    </div>
                    {diff ? (
                      <details>
                        <summary
                          style={{
                            fontFamily: "var(--ui)",
                            fontSize: "var(--fs-xs)",
                            color: "var(--cinza)",
                            marginTop: "var(--space-2)",
                            cursor: "pointer",
                          }}
                        >
                          Ver dados ↓
                        </summary>
                        <pre className={styles.eventoDiff}>{diff}</pre>
                      </details>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
