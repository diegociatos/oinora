import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABEL,
  calcularTempoCasa,
  formatarCpf,
  formatarData,
  formatarMoeda,
} from "@/lib/utils/format";
import { Paginacao } from "@/components/ui/Paginacao";
import layout from "../layout.module.css";
import styles from "./page.module.css";

export const metadata = { title: "Empregados" };

type Empregado = {
  id: string;
  matricula: string;
  nome_completo: string;
  cpf: string;
  status: keyof typeof STATUS_LABEL;
  data_admissao: string;
  salario_centavos: number;
  cargo: { nome: string; nivel: string | null } | null;
  departamento: { nome: string; sigla: string | null } | null;
};

const STATUS_FILTROS = [
  { value: "", label: "Todos os status" },
  { value: "ativo", label: "Ativos" },
  { value: "ferias", label: "Em férias" },
  { value: "afastado", label: "Afastados" },
  { value: "aviso_previo", label: "Aviso prévio" },
  { value: "desligado", label: "Desligados" },
] as const;

export default async function EmpregadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; departamento?: string; page?: string }>;
}) {
  await requireSession();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();
  const departamento = (params.departamento ?? "").trim();
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const PAGE_SIZE_LOCAL = 25;

  const supabase = await createClient();
  let query = supabase
    .from("empregados")
    .select(
      "id, matricula, nome_completo, cpf, status, data_admissao, salario_centavos, cargo:cargos!empregados_cargo_id_fkey(nome, nivel), departamento:departamentos!empregados_departamento_id_fkey(nome, sigla)",
      { count: "exact" },
    )
    .order("nome_completo", { ascending: true })
    .range((page - 1) * PAGE_SIZE_LOCAL, page * PAGE_SIZE_LOCAL - 1);

  if (q) query = query.ilike("nome_completo", `%${q}%`);
  if (status) query = query.eq("status", status);
  if (departamento) query = query.eq("departamento_id", departamento);

  // Carregar departamentos pra dropdown filtro
  const { data: deptos } = await supabase
    .from("departamentos")
    .select("id, nome, sigla")
    .order("nome");

  const { data, error, count } = await query;
  const empregados = (data ?? []) as unknown as Empregado[];
  const total = count ?? 0;

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Empregados</em>
        </h1>
        <div className={layout.topbarActions}>
          {empregados.length} {empregados.length === 1 ? "registro" : "registros"}
        </div>
      </header>

      <div className={layout.content}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.headerTitulo}>
              Quadro <em>vivo</em> de pessoas
            </h2>
            <p className={styles.headerSub}>
              Todos os empregados cadastrados no tenant — RLS isola por empresa.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href="/api/exportar/empregados"
              download
              style={{
                padding: "10px 16px",
                background: "var(--branco)",
                color: "var(--marinho)",
                border: "1px solid var(--cinza-cl)",
                borderRadius: "var(--radius-sharp)",
                fontFamily: "var(--ui)",
                fontSize: "var(--fs-sm)",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              📥 Exportar CSV
            </a>
          <Link
            href="/empregados/novo"
            style={{
              padding: "10px 20px",
              background: "var(--laranja)",
              color: "var(--branco)",
              borderRadius: "var(--radius-sharp)",
              fontFamily: "var(--ui)",
              fontSize: "var(--fs-sm)",
              fontWeight: 500,
              transition: "background 0.15s ease",
              display: "inline-block",
            }}
          >
            + Novo empregado
          </Link>
          </div>
        </div>

        <form className={styles.filtros}>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome…"
            aria-label="Buscar empregado por nome"
          />
          <select
            name="status"
            defaultValue={status}
            aria-label="Filtrar por status"
          >
            {STATUS_FILTROS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            name="departamento"
            defaultValue={departamento}
            aria-label="Filtrar por departamento"
          >
            <option value="">Todos os departamentos</option>
            {(deptos ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.sigla ? `${d.sigla} · ${d.nome}` : d.nome}
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

        {error ? (
          <div className={styles.vazio}>
            Erro ao carregar empregados: {error.message}
          </div>
        ) : empregados.length === 0 ? (
          <div className={styles.vazio}>
            Nenhum empregado encontrado.{" "}
            {q || status ? "Tente ajustar os filtros." : ""}
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th>Mat.</th>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Cargo · Departamento</th>
                    <th>Admissão</th>
                    <th>Tempo de casa</th>
                    <th>Salário</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {empregados.map((e) => (
                    <tr key={e.id}>
                      <td className={styles.matricula}>{e.matricula}</td>
                      <td className={styles.nomeCompleto}>
                        <Link href={`/empregados/${e.id}`}>{e.nome_completo}</Link>
                      </td>
                      <td>{formatarCpf(e.cpf)}</td>
                      <td>
                        <div className={styles.cargoNome}>
                          {e.cargo?.nome ?? "—"}
                          {e.cargo?.nivel ? ` · ${e.cargo.nivel}` : ""}
                        </div>
                        <div className={styles.cargoSub}>
                          {e.departamento?.sigla ?? ""}
                          {e.departamento ? " · " : ""}
                          {e.departamento?.nome ?? ""}
                        </div>
                      </td>
                      <td>{formatarData(e.data_admissao)}</td>
                      <td>{calcularTempoCasa(e.data_admissao)}</td>
                      <td>{formatarMoeda(e.salario_centavos)}</td>
                      <td>
                        <span className={`${styles.tag} ${styles[e.status] ?? ""}`}>
                          {STATUS_LABEL[e.status] ?? e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacao
              total={total}
              paginaAtual={page}
              basePath="/empregados"
              baseSearchParams={new URLSearchParams({
                ...(q ? { q } : {}),
                ...(status ? { status } : {}),
                ...(departamento ? { departamento } : {}),
              })}
              pageSize={PAGE_SIZE_LOCAL}
            />
          </>
        )}
      </div>
    </>
  );
}
