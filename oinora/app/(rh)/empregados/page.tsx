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
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireSession();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("empregados")
    .select(
      "id, matricula, nome_completo, cpf, status, data_admissao, salario_centavos, cargo:cargos!empregados_cargo_id_fkey(nome, nivel), departamento:departamentos!empregados_departamento_id_fkey(nome, sigla)",
    )
    .order("nome_completo", { ascending: true });

  if (q) {
    query = query.ilike("nome_completo", `%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  const empregados = (data ?? []) as unknown as Empregado[];

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
            <div className={styles.contador}>
              Mostrando {empregados.length}{" "}
              {empregados.length === 1 ? "empregado" : "empregados"}
            </div>
          </>
        )}
      </div>
    </>
  );
}
