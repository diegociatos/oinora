import Link from "next/link";

const PAGE_SIZE_PADRAO = 25;

type Props = {
  total: number;
  paginaAtual: number;
  baseSearchParams: URLSearchParams | string;
  pageSize?: number;
  basePath: string;
};

/**
 * Paginação server-side reutilizável.
 * Use junto com Supabase .range() na query.
 *
 * Uso:
 *   <Paginacao total={count} paginaAtual={page} basePath="/empregados" baseSearchParams={sp} />
 */
export function Paginacao({
  total,
  paginaAtual,
  baseSearchParams,
  pageSize = PAGE_SIZE_PADRAO,
  basePath,
}: Props) {
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  if (totalPaginas <= 1) return null;

  const sp =
    typeof baseSearchParams === "string"
      ? new URLSearchParams(baseSearchParams)
      : new URLSearchParams(baseSearchParams.toString());

  function url(p: number) {
    const params = new URLSearchParams(sp.toString());
    if (p === 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  const inicio = (paginaAtual - 1) * pageSize + 1;
  const fim = Math.min(paginaAtual * pageSize, total);

  // Páginas a mostrar: primeira, última, atual±1
  const pages = new Set<number>([1, totalPaginas, paginaAtual]);
  if (paginaAtual > 1) pages.add(paginaAtual - 1);
  if (paginaAtual < totalPaginas) pages.add(paginaAtual + 1);
  const sorted = Array.from(pages).sort((a, b) => a - b);

  return (
    <nav
      aria-label="Paginação"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginTop: 16,
        flexWrap: "wrap",
        fontFamily: "var(--ui)",
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--cinza)" }}>
        Mostrando <strong>{inicio}–{fim}</strong> de <strong>{total}</strong>
      </div>
      <ul style={{ display: "flex", listStyle: "none", padding: 0, gap: 4, alignItems: "center" }}>
        {paginaAtual > 1 ? (
          <li>
            <Link href={url(paginaAtual - 1)} style={btnStyle(false)} aria-label="Página anterior">
              ← Anterior
            </Link>
          </li>
        ) : null}
        {sorted.map((p, i) => {
          const prev = sorted[i - 1];
          const ellipsis = prev != null && p - prev > 1;
          return (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {ellipsis ? (
                <span style={{ color: "var(--cinza)", padding: "0 4px" }}>…</span>
              ) : null}
              <li>
                <Link
                  href={url(p)}
                  style={btnStyle(p === paginaAtual)}
                  aria-current={p === paginaAtual ? "page" : undefined}
                  aria-label={`Página ${p}`}
                >
                  {p}
                </Link>
              </li>
            </span>
          );
        })}
        {paginaAtual < totalPaginas ? (
          <li>
            <Link href={url(paginaAtual + 1)} style={btnStyle(false)} aria-label="Próxima página">
              Próxima →
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

function btnStyle(ativo: boolean): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "6px 10px",
    background: ativo ? "var(--laranja)" : "var(--branco)",
    color: ativo ? "var(--branco)" : "var(--marinho)",
    border: `1px solid ${ativo ? "var(--laranja)" : "var(--cinza-cl)"}`,
    borderRadius: "var(--radius-sharp)",
    textDecoration: "none",
    fontWeight: ativo ? 600 : 400,
    minWidth: 32,
    textAlign: "center" as const,
  };
}

export const PAGE_SIZE = PAGE_SIZE_PADRAO;
