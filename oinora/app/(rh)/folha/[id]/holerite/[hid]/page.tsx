import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda, formatarCpf, formatarCnpj } from "@/lib/utils/format";
import styles from "./page.module.css";
import { BotaoImprimir } from "./_botao-imprimir";

export const metadata = { title: "Holerite" };

export default async function HoleritePage({
  params,
}: {
  params: Promise<{ id: string; hid: string }>;
}) {
  await requireSession();
  const { id, hid } = await params;
  const supabase = await createClient();

  const { data: h } = await supabase
    .from("folha_holerites")
    .select(
      `id, salario_base_centavos, total_proventos_centavos, total_descontos_centavos,
       total_liquido_centavos, inss_desconto_centavos, irrf_desconto_centavos, fgts_centavos,
       liberado_para_empregado,
       competencia:competencia_id(competencia, tenant_id),
       empregado:empregado_id(nome_completo, matricula, cpf, cargo:cargo_id(nome), departamento:departamento_id(nome))`,
    )
    .eq("id", hid)
    .eq("competencia_id", id)
    .maybeSingle();

  if (!h) notFound();

  const comp = Array.isArray(h.competencia) ? h.competencia[0] : h.competencia;
  const emp = Array.isArray(h.empregado) ? h.empregado[0] : h.empregado;
  const cargo = emp?.cargo ? (Array.isArray(emp.cargo) ? emp.cargo[0] : emp.cargo) : null;
  const dept = emp?.departamento ? (Array.isArray(emp.departamento) ? emp.departamento[0] : emp.departamento) : null;

  // Tenant info (pra logo + razão social no holerite)
  const { data: tenant } = await supabase
    .from("tenants")
    .select("razao_social, nome_fantasia, cnpj")
    .eq("id", comp?.tenant_id ?? "")
    .maybeSingle();

  // Eventos detalhados
  const { data: eventos } = await supabase
    .from("folha_eventos")
    .select("codigo, descricao, tipo, quantidade, base_calculo_centavos, valor_centavos")
    .eq("holerite_id", hid)
    .order("codigo");

  const proventos = (eventos ?? []).filter((e) => e.tipo === "provento");
  const descontos = (eventos ?? []).filter((e) => e.tipo === "desconto");
  const informativos = (eventos ?? []).filter((e) => e.tipo === "informativo");

  const compLabel = comp
    ? new Date(comp.competencia).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

  return (
    <div style={{ padding: "32px 24px", background: "var(--cinza-fundo)", minHeight: "100vh" }}>
      <div className={styles.barraAcoes}>
        <Link href={`/folha/${id}`} className={styles.voltar}>
          ← Voltar para competência
        </Link>
        <BotaoImprimir />
      </div>

      <article className={styles.holerite}>
        <header className={styles.cabecalho}>
          <div>
            <div className={styles.empresa}>
              {tenant?.nome_fantasia || tenant?.razao_social}
            </div>
            <div className={styles.empresaCnpj}>
              CNPJ {tenant ? formatarCnpj(tenant.cnpj) : "—"}
            </div>
            <div className={styles.empresaCnpj} style={{ marginTop: 4 }}>
              Recibo de pagamento de salário · CLT
            </div>
          </div>
          <div className={styles.competencia}>
            <div className={styles.competenciaLabel}>Competência</div>
            <div className={styles.competenciaValor}>{compLabel}</div>
          </div>
        </header>

        <dl className={styles.empregadoBox}>
          <div>
            <dt>Nome</dt>
            <dd>{emp?.nome_completo}</dd>
          </div>
          <div>
            <dt>Matrícula</dt>
            <dd>{emp?.matricula}</dd>
          </div>
          <div>
            <dt>CPF</dt>
            <dd>{formatarCpf(emp?.cpf)}</dd>
          </div>
          <div>
            <dt>Cargo</dt>
            <dd>
              {cargo?.nome ?? "—"} {dept ? `· ${dept.nome}` : ""}
            </dd>
          </div>
        </dl>

        <table className={styles.tabela}>
          <thead>
            <tr>
              <th style={{ width: 70 }}>Cód</th>
              <th>Descrição</th>
              <th className={styles.num} style={{ width: 90 }}>Qtde</th>
              <th className={styles.num} style={{ width: 120 }}>Base</th>
              <th className={styles.num} style={{ width: 120 }}>Provento</th>
              <th className={styles.num} style={{ width: 120 }}>Desconto</th>
            </tr>
          </thead>
          <tbody>
            {/* Se não houver eventos, mostra ao menos o salário base */}
            {(eventos ?? []).length === 0 ? (
              <tr className={styles.provento}>
                <td>001</td>
                <td>Salário base</td>
                <td className={styles.num}>30,00d</td>
                <td className={styles.num}>{formatarMoeda(h.salario_base_centavos)}</td>
                <td className={styles.num}>{formatarMoeda(h.salario_base_centavos)}</td>
                <td className={styles.num}></td>
              </tr>
            ) : null}
            {proventos.map((e, i) => (
              <tr key={`p-${i}`} className={styles.provento}>
                <td>{e.codigo}</td>
                <td>{e.descricao}</td>
                <td className={styles.num}>{e.quantidade ?? "—"}</td>
                <td className={styles.num}>{formatarMoeda(e.base_calculo_centavos)}</td>
                <td className={styles.num}>{formatarMoeda(e.valor_centavos)}</td>
                <td className={styles.num}></td>
              </tr>
            ))}
            {descontos.map((e, i) => (
              <tr key={`d-${i}`} className={styles.desconto}>
                <td>{e.codigo}</td>
                <td>{e.descricao}</td>
                <td className={styles.num}>{e.quantidade ?? "—"}</td>
                <td className={styles.num}>{formatarMoeda(e.base_calculo_centavos)}</td>
                <td className={styles.num}></td>
                <td className={styles.num}>{formatarMoeda(e.valor_centavos)}</td>
              </tr>
            ))}
            {informativos.map((e, i) => (
              <tr key={`i-${i}`} style={{ color: "var(--cinza)", fontStyle: "italic" }}>
                <td>{e.codigo}</td>
                <td>{e.descricao} (informativo)</td>
                <td className={styles.num}>—</td>
                <td className={styles.num}>—</td>
                <td className={styles.num}>—</td>
                <td className={styles.num}>{formatarMoeda(e.valor_centavos)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}>Totais</td>
              <td className={styles.num}>{formatarMoeda(h.total_proventos_centavos)}</td>
              <td className={styles.num}>{formatarMoeda(h.total_descontos_centavos)}</td>
            </tr>
          </tfoot>
        </table>

        <div className={styles.totalizadores}>
          <div className={styles.totalCard}>
            <div className={styles.label}>Base INSS</div>
            <div className={styles.valor} style={{ color: "var(--marinho)" }}>
              {formatarMoeda(h.salario_base_centavos)}
            </div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.label}>Base FGTS</div>
            <div className={styles.valor} style={{ color: "var(--marinho)" }}>
              {formatarMoeda(h.salario_base_centavos)}
            </div>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.label}>FGTS recolhido</div>
            <div className={styles.valor} style={{ color: "var(--laranja)" }}>
              {formatarMoeda(h.fgts_centavos)}
            </div>
          </div>
        </div>

        <div className={styles.liquido}>
          <span className={styles.label}>Líquido a receber</span>
          <span className={styles.valor}>{formatarMoeda(h.total_liquido_centavos)}</span>
        </div>

        <div className={styles.assinatura}>
          <div>
            <div className={styles.linha}>Assinatura do empregador</div>
          </div>
          <div>
            <div className={styles.linha}>Assinatura do empregado · {emp?.nome_completo}</div>
          </div>
        </div>
      </article>
    </div>
  );
}
