import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABEL,
  calcularIdade,
  calcularTempoCasa,
  formatarCpf,
  formatarData,
  formatarMoeda,
} from "@/lib/utils/format";
import layout from "../../layout.module.css";
import styles from "./page.module.css";

const TABS = [
  { id: "resumo", label: "Resumo", soon: false },
  { id: "pessoais", label: "Dados pessoais", soon: true },
  { id: "endereco", label: "Endereço & contato", soon: true },
  { id: "vinculo", label: "Vínculo & cargo", soon: true },
  { id: "dependentes", label: "Dependentes", soon: true },
  { id: "documentos", label: "Documentos", soon: true },
  { id: "movimentacoes", label: "Histórico", soon: true },
];

function initials(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function FichaEmpregadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: empregado } = await supabase
    .from("empregados")
    .select(
      `id, matricula, nome_completo, nome_social, cpf, rg, data_nascimento,
       sexo, raca_cor, estado_civil, nacionalidade, pis_pasep,
       email_pessoal, telefone_principal, endereco, contato_emergencia,
       data_admissao, tipo_contrato, salario_centavos, status,
       nine_box_desempenho, nine_box_potencial,
       cargo:cargos(nome, nivel, cbo, codigo),
       departamento:departamentos(nome, sigla),
       centro_custo:centros_custo(codigo, nome),
       local_trabalho:locais_trabalho(nome),
       jornada:jornadas(nome, horas_semana),
       gestor:gestor_id(nome_completo, matricula)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!empregado) {
    notFound();
  }

  const { data: movimentacoes } = await supabase
    .from("empregado_movimentacoes")
    .select(
      "id, tipo, data_efetiva, observacao, salario_anterior_centavos, salario_novo_centavos",
    )
    .eq("empregado_id", id)
    .order("data_efetiva", { ascending: false });

  const { count: dependentesCount } = await supabase
    .from("empregado_dependentes")
    .select("id", { count: "exact", head: true })
    .eq("empregado_id", id);

  const { count: docsCount } = await supabase
    .from("empregado_documentos")
    .select("id", { count: "exact", head: true })
    .eq("empregado_id", id);

  const isEstrela =
    empregado.nine_box_desempenho === 3 && empregado.nine_box_potencial === 3;

  const cargo = Array.isArray(empregado.cargo)
    ? empregado.cargo[0]
    : empregado.cargo;
  const departamento = Array.isArray(empregado.departamento)
    ? empregado.departamento[0]
    : empregado.departamento;
  const centroCusto = Array.isArray(empregado.centro_custo)
    ? empregado.centro_custo[0]
    : empregado.centro_custo;
  const localTrabalho = Array.isArray(empregado.local_trabalho)
    ? empregado.local_trabalho[0]
    : empregado.local_trabalho;
  const jornada = Array.isArray(empregado.jornada)
    ? empregado.jornada[0]
    : empregado.jornada;
  const gestor = Array.isArray(empregado.gestor)
    ? empregado.gestor[0]
    : empregado.gestor;

  return (
    <>
      <header className={layout.topbar}>
        <h1 className={layout.topbarTitulo}>
          Ficha · <em>{empregado.nome_completo}</em>
        </h1>
        <div className={layout.topbarActions}>MAT {empregado.matricula}</div>
      </header>

      <div className={layout.content}>
        <Link href="/empregados" className={styles.voltar}>
          ← Voltar para Empregados
        </Link>

        <section className={styles.hero}>
          <div className={styles.avatar} aria-hidden="true">
            {initials(empregado.nome_completo)}
          </div>
          <div className={styles.heroInfo}>
            <div className={styles.matricula}>
              Matrícula {empregado.matricula} ·{" "}
              {STATUS_LABEL[empregado.status] ?? empregado.status}
            </div>
            <h2 className={styles.nome}>{empregado.nome_completo}</h2>
            <p className={styles.cargo}>
              <em>{cargo?.nome ?? "Sem cargo"}</em>
              {cargo?.nivel ? ` · ${cargo.nivel}` : ""}
              {departamento ? ` · ${departamento.nome}` : ""}
              {gestor?.nome_completo ? ` · gestor ${gestor.nome_completo}` : ""}
            </p>
            <div className={styles.heroTags}>
              {isEstrela ? (
                <span className={`${styles.heroTag} ${styles.estrela}`}>
                  ★ Estrela 9-Box (3·3)
                </span>
              ) : null}
              <span className={styles.heroTag}>
                Admitido {formatarData(empregado.data_admissao)}
              </span>
              <span className={styles.heroTag}>
                {calcularTempoCasa(empregado.data_admissao)} de casa
              </span>
            </div>
          </div>
        </section>

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.tab} ${t.id === "resumo" ? styles.ativa : ""}`}
              disabled={t.soon}
              title={t.soon ? "Em breve · próximo MVP" : undefined}
            >
              {t.label}
              {t.soon ? <span className={styles.tabSoon}>soon</span> : null}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          <div>
            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Dados pessoais</h3>
              <dl className={styles.dl}>
                <div>
                  <span className={styles.dlLabel}>Nome completo</span>
                  <span className={styles.dlValor}>{empregado.nome_completo}</span>
                </div>
                <div>
                  <span className={styles.dlLabel}>CPF</span>
                  <span className={styles.dlValor}>
                    {formatarCpf(empregado.cpf)}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Data de nascimento</span>
                  <span className={styles.dlValor}>
                    {formatarData(empregado.data_nascimento)} ·{" "}
                    {calcularIdade(empregado.data_nascimento)} anos
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Sexo · Raça/cor</span>
                  <span className={styles.dlValor}>
                    {empregado.sexo ?? "—"} · {empregado.raca_cor ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Estado civil</span>
                  <span className={styles.dlValor}>
                    {empregado.estado_civil ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Nacionalidade</span>
                  <span className={styles.dlValor}>
                    {empregado.nacionalidade ?? "—"}
                  </span>
                </div>
              </dl>
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Vínculo & cargo</h3>
              <dl className={styles.dl}>
                <div>
                  <span className={styles.dlLabel}>Cargo</span>
                  <span className={styles.dlValor}>
                    <em>{cargo?.nome ?? "—"}</em>
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>CBO</span>
                  <span className={styles.dlValor}>{cargo?.cbo ?? "—"}</span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Departamento</span>
                  <span className={styles.dlValor}>
                    {departamento?.sigla ? `${departamento.sigla} · ` : ""}
                    {departamento?.nome ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Centro de custo</span>
                  <span className={styles.dlValor}>
                    {centroCusto?.codigo
                      ? `${centroCusto.codigo} · ${centroCusto.nome}`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Local de trabalho</span>
                  <span className={styles.dlValor}>
                    {localTrabalho?.nome ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Jornada</span>
                  <span className={styles.dlValor}>
                    {jornada?.nome ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Tipo de contrato</span>
                  <span className={styles.dlValor}>
                    {empregado.tipo_contrato.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Salário base</span>
                  <span className={styles.dlValor}>
                    <em>{formatarMoeda(empregado.salario_centavos)}</em>
                  </span>
                </div>
              </dl>
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>
                Histórico de movimentações ({movimentacoes?.length ?? 0})
              </h3>
              {!movimentacoes || movimentacoes.length === 0 ? (
                <p style={{ color: "var(--cinza)", fontFamily: "var(--ui)" }}>
                  Nenhuma movimentação registrada.
                </p>
              ) : (
                movimentacoes.map((m) => (
                  <div key={m.id} className={styles.movRow}>
                    <span className={styles.movData}>
                      {formatarData(m.data_efetiva)}
                    </span>
                    <div>
                      <div className={styles.movTipo}>
                        {m.tipo.replace("_", " ")}
                      </div>
                      {m.salario_novo_centavos &&
                      m.salario_anterior_centavos ? (
                        <div className={styles.movDetalhes}>
                          {formatarMoeda(m.salario_anterior_centavos)} →{" "}
                          {formatarMoeda(m.salario_novo_centavos)}
                        </div>
                      ) : m.salario_novo_centavos ? (
                        <div className={styles.movDetalhes}>
                          Salário inicial: {formatarMoeda(m.salario_novo_centavos)}
                        </div>
                      ) : null}
                      {m.observacao ? (
                        <div className={styles.movDetalhes}>{m.observacao}</div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside>
            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Contato</h3>
              <dl
                className={styles.dl}
                style={{ gridTemplateColumns: "1fr" }}
              >
                <div>
                  <span className={styles.dlLabel}>Email pessoal</span>
                  <span className={styles.dlValor}>
                    {empregado.email_pessoal ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Telefone</span>
                  <span className={styles.dlValor}>
                    {empregado.telefone_principal ?? "—"}
                  </span>
                </div>
              </dl>
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Avaliação 9-Box</h3>
              {empregado.nine_box_desempenho && empregado.nine_box_potencial ? (
                <p style={{ fontFamily: "var(--serif)", fontSize: 22 }}>
                  Desempenho: <em>{empregado.nine_box_desempenho}</em> · Potencial:{" "}
                  <em>{empregado.nine_box_potencial}</em>
                  <br />
                  {isEstrela ? (
                    <span
                      style={{
                        color: "var(--laranja)",
                        fontStyle: "italic",
                        fontSize: 18,
                      }}
                    >
                      ★ Estrela
                    </span>
                  ) : null}
                </p>
              ) : (
                <p style={{ color: "var(--cinza)", fontFamily: "var(--ui)" }}>
                  Sem calibração no ciclo atual.
                </p>
              )}
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Resumo rápido</h3>
              <dl
                className={styles.dl}
                style={{ gridTemplateColumns: "1fr" }}
              >
                <div>
                  <span className={styles.dlLabel}>Dependentes</span>
                  <span className={styles.dlValor}>{dependentesCount ?? 0}</span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Documentos</span>
                  <span className={styles.dlValor}>{docsCount ?? 0}</span>
                </div>
                <div>
                  <span className={styles.dlLabel}>PIS / PASEP</span>
                  <span className={styles.dlValor}>
                    {empregado.pis_pasep ?? "—"}
                  </span>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
