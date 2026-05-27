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

type TabId =
  | "resumo"
  | "pessoais"
  | "endereco"
  | "vinculo"
  | "dependentes"
  | "documentos"
  | "historico";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "resumo", label: "Resumo" },
  { id: "pessoais", label: "Dados pessoais" },
  { id: "endereco", label: "Endereço & contato" },
  { id: "vinculo", label: "Vínculo & cargo" },
  { id: "dependentes", label: "Dependentes" },
  { id: "documentos", label: "Documentos" },
  { id: "historico", label: "Histórico" },
];

function initials(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

type EnderecoJson = {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
};

type ContatoEmergenciaJson = {
  nome?: string;
  parentesco?: string;
  telefone?: string;
};

type BancoJson = {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo?: string;
  chave_pix?: string;
};

function formatarEndereco(e: EnderecoJson | null | undefined): string {
  if (!e) return "—";
  const linha1 = [e.logradouro, e.numero].filter(Boolean).join(", ");
  const linha2 = [e.bairro, e.cidade && e.uf ? `${e.cidade}/${e.uf}` : e.cidade]
    .filter(Boolean)
    .join(" · ");
  const cep = e.cep ? `CEP ${e.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}` : "";
  return [linha1, e.complemento, linha2, cep].filter(Boolean).join(" · ");
}

export default async function FichaEmpregadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const sp = await searchParams;
  const activeTab: TabId = (TABS.find((t) => t.id === sp.tab)?.id ??
    "resumo") as TabId;

  const supabase = await createClient();

  const { data: empregado } = await supabase
    .from("empregados")
    .select(
      `id, matricula, nome_completo, nome_social, cpf, rg, data_nascimento,
       sexo, raca_cor, estado_civil, nacionalidade, pis_pasep,
       ctps_numero, ctps_serie, ctps_uf, titulo_eleitor, reservista, banco,
       email_pessoal, telefone_principal, endereco, contato_emergencia,
       data_admissao, data_desligamento, tipo_contrato, salario_centavos, status,
       ultimo_aso, proximo_aso_periodico,
       nine_box_desempenho, nine_box_potencial,
       cargo:cargo_id(nome, nivel, cbo, codigo, faixa_salarial_min_centavos, faixa_salarial_max_centavos, jornada_horas_semana),
       departamento:departamento_id(nome, sigla),
       centro_custo:centro_custo_id(codigo, nome),
       local_trabalho:local_trabalho_id(nome, endereco),
       jornada:jornada_id(nome, horas_semana),
       gestor:gestor_id(nome_completo, matricula)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!empregado) {
    notFound();
  }

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

  const banco = empregado.banco as BancoJson | null;
  const endereco = empregado.endereco as EnderecoJson | null;
  const contatoEmergencia =
    empregado.contato_emergencia as ContatoEmergenciaJson | null;
  const localEndereco = localTrabalho?.endereco as EnderecoJson | null;

  const isEstrela =
    empregado.nine_box_desempenho === 3 && empregado.nine_box_potencial === 3;

  // Dados específicos por aba
  const [
    { data: dependentes },
    { data: documentos },
    { data: movimentacoes },
    { count: dependentesCount },
    { count: docsCount },
  ] = await Promise.all([
    activeTab === "dependentes"
      ? supabase
          .from("empregado_dependentes")
          .select(
            "id, nome_completo, cpf, data_nascimento, parentesco, ir_dependente, salario_familia, plano_saude",
          )
          .eq("empregado_id", id)
          .order("data_nascimento", { ascending: true })
      : Promise.resolve({ data: null }),
    activeTab === "documentos"
      ? supabase
          .from("empregado_documentos")
          .select("id, tipo, nome_arquivo, validade, criado_em")
          .eq("empregado_id", id)
          .order("criado_em", { ascending: false })
      : Promise.resolve({ data: null }),
    activeTab === "historico" || activeTab === "resumo"
      ? supabase
          .from("empregado_movimentacoes")
          .select(
            "id, tipo, data_efetiva, observacao, salario_anterior_centavos, salario_novo_centavos, cargo_anterior:cargo_anterior_id(nome), cargo_novo:cargo_novo_id(nome), departamento_anterior:departamento_anterior_id(nome), departamento_novo:departamento_novo_id(nome)",
          )
          .eq("empregado_id", id)
          .order("data_efetiva", { ascending: false })
      : Promise.resolve({ data: null }),
    supabase
      .from("empregado_dependentes")
      .select("id", { count: "exact", head: true })
      .eq("empregado_id", id),
    supabase
      .from("empregado_documentos")
      .select("id", { count: "exact", head: true })
      .eq("empregado_id", id),
  ]);

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

        <nav className={styles.tabs} aria-label="Seções da ficha">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`?tab=${t.id}`}
              className={`${styles.tab} ${activeTab === t.id ? styles.ativa : ""}`}
              aria-current={activeTab === t.id ? "page" : undefined}
              scroll={false}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {activeTab === "resumo" ? (
          <div className={styles.grid}>
            <div>
              <div className={styles.painel}>
                <h3 className={styles.painelTitulo}>Dados pessoais</h3>
                <dl className={styles.dl}>
                  <div>
                    <span className={styles.dlLabel}>Nome completo</span>
                    <span className={styles.dlValor}>
                      {empregado.nome_completo}
                    </span>
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
                    <span className={styles.dlLabel}>Departamento</span>
                    <span className={styles.dlValor}>
                      {departamento?.sigla ? `${departamento.sigla} · ` : ""}
                      {departamento?.nome ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Salário base</span>
                    <span className={styles.dlValor}>
                      <em>{formatarMoeda(empregado.salario_centavos)}</em>
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Tipo de contrato</span>
                    <span className={styles.dlValor}>
                      {empregado.tipo_contrato.replace("_", " ")}
                    </span>
                  </div>
                </dl>
              </div>

              <div className={styles.painel}>
                <h3 className={styles.painelTitulo}>
                  Histórico recente
                  <span className={styles.contador}>
                    · {movimentacoes?.length ?? 0}{" "}
                    {movimentacoes?.length === 1 ? "evento" : "eventos"}
                  </span>
                </h3>
                {!movimentacoes || movimentacoes.length === 0 ? (
                  <div className={styles.empty}>
                    Nenhuma movimentação registrada.
                  </div>
                ) : (
                  movimentacoes.slice(0, 5).map((m) => (
                    <div key={m.id} className={styles.movRow}>
                      <span className={styles.movData}>
                        {formatarData(m.data_efetiva)}
                      </span>
                      <div>
                        <div className={styles.movTipo}>
                          {m.tipo.replace("_", " ")}
                        </div>
                        {m.observacao ? (
                          <div className={styles.movDetalhes}>
                            {m.observacao}
                          </div>
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
                <dl className={`${styles.dl} ${styles.uma}`}>
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
                    Desempenho: <em>{empregado.nine_box_desempenho}</em> ·
                    Potencial: <em>{empregado.nine_box_potencial}</em>
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
                <dl className={`${styles.dl} ${styles.uma}`}>
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
        ) : null}

        {activeTab === "pessoais" ? (
          <div className={styles.gridUnica}>
            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Identificação</h3>
              <dl className={styles.dl}>
                <div>
                  <span className={styles.dlLabel}>Nome completo</span>
                  <span className={styles.dlValor}>
                    {empregado.nome_completo}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Nome social</span>
                  <span className={styles.dlValor}>
                    {empregado.nome_social ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>CPF</span>
                  <span className={styles.dlValor}>
                    {formatarCpf(empregado.cpf)}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>RG</span>
                  <span className={styles.dlValor}>{empregado.rg ?? "—"}</span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Data de nascimento</span>
                  <span className={styles.dlValor}>
                    {formatarData(empregado.data_nascimento)} ·{" "}
                    {calcularIdade(empregado.data_nascimento)} anos
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Sexo</span>
                  <span className={styles.dlValor}>
                    {empregado.sexo ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Raça/cor</span>
                  <span className={styles.dlValor}>
                    {empregado.raca_cor ?? "—"}
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
              <h3 className={styles.painelTitulo}>Documentos pessoais</h3>
              <dl className={styles.dl}>
                <div>
                  <span className={styles.dlLabel}>PIS / PASEP</span>
                  <span className={styles.dlValor}>
                    {empregado.pis_pasep ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>CTPS</span>
                  <span className={styles.dlValor}>
                    {empregado.ctps_numero
                      ? `${empregado.ctps_numero}${empregado.ctps_serie ? ` · série ${empregado.ctps_serie}` : ""}${empregado.ctps_uf ? ` · ${empregado.ctps_uf}` : ""}`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Título de eleitor</span>
                  <span className={styles.dlValor}>
                    {empregado.titulo_eleitor ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Reservista</span>
                  <span className={styles.dlValor}>
                    {empregado.reservista ?? "—"}
                  </span>
                </div>
              </dl>
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Dados bancários</h3>
              {banco ? (
                <dl className={styles.dl}>
                  <div>
                    <span className={styles.dlLabel}>Banco</span>
                    <span className={styles.dlValor}>{banco.banco ?? "—"}</span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Agência</span>
                    <span className={styles.dlValor}>
                      {banco.agencia ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Conta</span>
                    <span className={styles.dlValor}>
                      {banco.conta ? `${banco.conta} · ${banco.tipo ?? ""}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Chave PIX</span>
                    <span className={styles.dlValor}>
                      {banco.chave_pix ?? "—"}
                    </span>
                  </div>
                </dl>
              ) : (
                <div className={styles.empty}>
                  <strong>Sem dados bancários cadastrados</strong>
                  Será solicitado no fechamento da próxima folha.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "endereco" ? (
          <div className={styles.gridUnica}>
            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Contato</h3>
              <dl className={styles.dl}>
                <div>
                  <span className={styles.dlLabel}>Email pessoal</span>
                  <span className={styles.dlValor}>
                    {empregado.email_pessoal ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Telefone principal</span>
                  <span className={styles.dlValor}>
                    {empregado.telefone_principal ?? "—"}
                  </span>
                </div>
              </dl>
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Endereço residencial</h3>
              {endereco ? (
                <dl className={styles.dl}>
                  <div>
                    <span className={styles.dlLabel}>Logradouro · número</span>
                    <span className={styles.dlValor}>
                      {endereco.logradouro ?? "—"}
                      {endereco.numero ? `, ${endereco.numero}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Complemento</span>
                    <span className={styles.dlValor}>
                      {endereco.complemento ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Bairro</span>
                    <span className={styles.dlValor}>
                      {endereco.bairro ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Cidade / UF</span>
                    <span className={styles.dlValor}>
                      {endereco.cidade ?? "—"}
                      {endereco.uf ? ` / ${endereco.uf}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>CEP</span>
                    <span className={styles.dlValor}>
                      {endereco.cep
                        ? endereco.cep.replace(/(\d{5})(\d{3})/, "$1-$2")
                        : "—"}
                    </span>
                  </div>
                </dl>
              ) : (
                <div className={styles.empty}>
                  <strong>Endereço não cadastrado</strong>
                  Importante para envio de holerites físicos e correspondência
                  oficial.
                </div>
              )}
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Contato de emergência</h3>
              {contatoEmergencia ? (
                <dl className={`${styles.dl} ${styles.tres}`}>
                  <div>
                    <span className={styles.dlLabel}>Nome</span>
                    <span className={styles.dlValor}>
                      {contatoEmergencia.nome ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Parentesco</span>
                    <span className={styles.dlValor}>
                      {contatoEmergencia.parentesco ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className={styles.dlLabel}>Telefone</span>
                    <span className={styles.dlValor}>
                      {contatoEmergencia.telefone ?? "—"}
                    </span>
                  </div>
                </dl>
              ) : (
                <div className={styles.empty}>
                  <strong>Contato de emergência não cadastrado</strong>
                  Recomendado para empregados em obra/canteiro.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "vinculo" ? (
          <div className={styles.gridUnica}>
            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Cargo e nível</h3>
              <dl className={styles.dl}>
                <div>
                  <span className={styles.dlLabel}>Cargo</span>
                  <span className={styles.dlValor}>
                    <em>{cargo?.nome ?? "—"}</em>
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Nível</span>
                  <span className={styles.dlValor}>{cargo?.nivel ?? "—"}</span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Código interno</span>
                  <span className={styles.dlValor}>{cargo?.codigo ?? "—"}</span>
                </div>
                <div>
                  <span className={styles.dlLabel}>CBO</span>
                  <span className={styles.dlValor}>{cargo?.cbo ?? "—"}</span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Faixa salarial</span>
                  <span className={styles.dlValor}>
                    {cargo?.faixa_salarial_min_centavos &&
                    cargo?.faixa_salarial_max_centavos
                      ? `${formatarMoeda(cargo.faixa_salarial_min_centavos)} – ${formatarMoeda(cargo.faixa_salarial_max_centavos)}`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Salário atual</span>
                  <span className={styles.dlValor}>
                    <em>{formatarMoeda(empregado.salario_centavos)}</em>
                  </span>
                </div>
              </dl>
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Lotação</h3>
              <dl className={styles.dl}>
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
                  <span className={styles.dlLabel}>Endereço do local</span>
                  <span className={styles.dlValor}>
                    {formatarEndereco(localEndereco)}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Gestor direto</span>
                  <span className={styles.dlValor}>
                    {gestor?.nome_completo
                      ? `${gestor.nome_completo} · mat. ${gestor.matricula}`
                      : "—"}
                  </span>
                </div>
              </dl>
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Jornada e contrato</h3>
              <dl className={styles.dl}>
                <div>
                  <span className={styles.dlLabel}>Jornada</span>
                  <span className={styles.dlValor}>
                    {jornada?.nome ?? "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Horas semanais</span>
                  <span className={styles.dlValor}>
                    {jornada?.horas_semana ? `${jornada.horas_semana}h` : "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Tipo de contrato</span>
                  <span className={styles.dlValor}>
                    {empregado.tipo_contrato.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Data de admissão</span>
                  <span className={styles.dlValor}>
                    {formatarData(empregado.data_admissao)} ·{" "}
                    {calcularTempoCasa(empregado.data_admissao)}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Status</span>
                  <span className={styles.dlValor}>
                    {STATUS_LABEL[empregado.status] ?? empregado.status}
                  </span>
                </div>
                {empregado.data_desligamento ? (
                  <div>
                    <span className={styles.dlLabel}>Data de desligamento</span>
                    <span className={styles.dlValor}>
                      {formatarData(empregado.data_desligamento)}
                    </span>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>Saúde ocupacional</h3>
              <dl className={styles.dl}>
                <div>
                  <span className={styles.dlLabel}>Último ASO</span>
                  <span className={styles.dlValor}>
                    {formatarData(empregado.ultimo_aso)}
                  </span>
                </div>
                <div>
                  <span className={styles.dlLabel}>Próximo ASO periódico</span>
                  <span className={styles.dlValor}>
                    {formatarData(empregado.proximo_aso_periodico)}
                  </span>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        {activeTab === "dependentes" ? (
          <div className={styles.gridUnica}>
            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>
                Dependentes
                <span className={styles.contador}>
                  · {dependentes?.length ?? 0}{" "}
                  {dependentes?.length === 1 ? "registro" : "registros"}
                </span>
              </h3>
              {!dependentes || dependentes.length === 0 ? (
                <div className={styles.empty}>
                  <strong>Sem dependentes cadastrados</strong>
                  Use Server Action “Adicionar dependente” (em breve) para
                  registrar filhos, cônjuge ou outros beneficiários do plano.
                </div>
              ) : (
                <table className={styles.tabela}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Nascimento · idade</th>
                      <th>Parentesco</th>
                      <th>IR</th>
                      <th>Sal. família</th>
                      <th>Plano saúde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dependentes.map((d) => (
                      <tr key={d.id}>
                        <td>{d.nome_completo}</td>
                        <td>{formatarCpf(d.cpf)}</td>
                        <td>
                          {formatarData(d.data_nascimento)} ·{" "}
                          {calcularIdade(d.data_nascimento)} anos
                        </td>
                        <td>{d.parentesco}</td>
                        <td>
                          <span
                            className={`${styles.bolinha} ${d.ir_dependente ? styles.on : ""}`}
                          />
                        </td>
                        <td>
                          <span
                            className={`${styles.bolinha} ${d.salario_familia ? styles.on : ""}`}
                          />
                        </td>
                        <td>
                          <span
                            className={`${styles.bolinha} ${d.plano_saude ? styles.on : ""}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "documentos" ? (
          <div className={styles.gridUnica}>
            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>
                Documentos
                <span className={styles.contador}>
                  · {documentos?.length ?? 0}{" "}
                  {documentos?.length === 1 ? "arquivo" : "arquivos"}
                </span>
              </h3>
              {!documentos || documentos.length === 0 ? (
                <div className={styles.empty}>
                  <strong>Sem documentos anexados</strong>
                  Upload via Supabase Storage entra na próxima iteração.
                  Documentos esperados: RG, CPF, CTPS, comprovante de endereço,
                  ASO admissional, certificados de NRs.
                </div>
              ) : (
                <table className={styles.tabela}>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Arquivo</th>
                      <th>Validade</th>
                      <th>Enviado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((d) => (
                      <tr key={d.id}>
                        <td style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: 1, fontWeight: 700 }}>
                          {d.tipo}
                        </td>
                        <td style={{ fontFamily: "var(--serif)" }}>
                          {d.nome_arquivo}
                        </td>
                        <td>{formatarData(d.validade)}</td>
                        <td>{formatarData(d.criado_em)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "historico" ? (
          <div className={styles.gridUnica}>
            <div className={styles.painel}>
              <h3 className={styles.painelTitulo}>
                Histórico de movimentações
                <span className={styles.contador}>
                  · {movimentacoes?.length ?? 0}{" "}
                  {movimentacoes?.length === 1 ? "evento" : "eventos"}
                </span>
              </h3>
              {!movimentacoes || movimentacoes.length === 0 ? (
                <div className={styles.empty}>
                  <strong>Nenhuma movimentação registrada</strong>
                  Mudanças de cargo, promoções, transferências e desligamentos
                  aparecerão aqui automaticamente.
                </div>
              ) : (
                movimentacoes.map((m) => {
                  const cargoAnt = Array.isArray(m.cargo_anterior)
                    ? m.cargo_anterior[0]
                    : m.cargo_anterior;
                  const cargoNovo = Array.isArray(m.cargo_novo)
                    ? m.cargo_novo[0]
                    : m.cargo_novo;
                  return (
                    <div key={m.id} className={styles.movRow}>
                      <span className={styles.movData}>
                        {formatarData(m.data_efetiva)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className={styles.movTipo}>
                          {m.tipo.replace("_", " ")}
                        </div>
                        {cargoAnt && cargoNovo ? (
                          <div className={styles.movDetalhes}>
                            Cargo: {cargoAnt.nome} → {cargoNovo.nome}
                          </div>
                        ) : null}
                        {m.salario_novo_centavos &&
                        m.salario_anterior_centavos ? (
                          <div className={styles.movDetalhes}>
                            Salário:{" "}
                            {formatarMoeda(m.salario_anterior_centavos)} →{" "}
                            {formatarMoeda(m.salario_novo_centavos)}
                          </div>
                        ) : m.salario_novo_centavos ? (
                          <div className={styles.movDetalhes}>
                            Salário inicial:{" "}
                            {formatarMoeda(m.salario_novo_centavos)}
                          </div>
                        ) : null}
                        {m.observacao ? (
                          <div className={styles.movDetalhes}>
                            {m.observacao}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
