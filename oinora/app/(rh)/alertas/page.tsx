import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { carregarAlertas } from "@/lib/db/alertas";
import { formatarData } from "@/lib/utils/format";
import layout from "../layout.module.css";
import shared from "../_form.module.css";
import styles from "./page.module.css";

export const metadata = { title: "Alertas" };

export default async function AlertasPage() {
  await requireSession();
  const alertas = await carregarAlertas();
  const criticos = alertas.filter((a) => a.severidade === "critico").length;
  const avisos = alertas.filter((a) => a.severidade === "aviso").length;

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          <em>Alertas</em> de saúde ocupacional
        </h1>
        <div className={layout.topbarActions}>{alertas.length} pendências</div>
      </header>
      <div className={layout.content}>
        <div className={shared.headerPagina}>
          <h2>
            ASOs e <em>NRs</em> que precisam de atenção
          </h2>
          <p>
            Lista automática de empregados ativos com ASO periódico ou
            certificados de NR vencidos / vencendo em até 30 dias.
          </p>
        </div>

        <div className={styles.resumo}>
          <div className={styles.resumoCard}>
            <div className={`${styles.resumoNum} ${styles.critico}`}>
              {criticos}
            </div>
            <div className={styles.resumoLabel}>Críticos (vencidos)</div>
          </div>
          <div className={styles.resumoCard}>
            <div className={`${styles.resumoNum} ${styles.aviso}`}>
              {avisos}
            </div>
            <div className={styles.resumoLabel}>Avisos (próximos 30 dias)</div>
          </div>
        </div>

        {alertas.length === 0 ? (
          <div className={styles.vazio}>
            <em>Tudo em dia ✓</em>
            Nenhum ASO ou NR vencendo nos próximos 30 dias para empregados ativos.
          </div>
        ) : (
          <div className={styles.lista}>
            {alertas.map((a) => (
              <article key={a.id} className={`${styles.alerta} ${styles[a.severidade]}`}>
                <div>
                  <div className={styles.titulo}>
                    <em>{a.empregadoNome}</em>
                    <span style={{ color: "var(--cinza)", fontSize: 12, fontFamily: "var(--ui)" }}>
                      {" "}· mat. {a.matricula}
                    </span>
                  </div>
                  <div className={styles.detalhes}>
                    {a.titulo} · validade {formatarData(a.data)}
                  </div>
                </div>
                <Link
                  href={`/empregados/${a.empregadoId}?tab=${a.tipo.startsWith("aso") ? "vinculo" : "documentos"}`}
                  className={styles.acao}
                >
                  Ver empregado →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
