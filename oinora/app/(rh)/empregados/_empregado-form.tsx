"use client";

import { useActionState } from "react";
import {
  criarEmpregado,
  atualizarEmpregado,
  initialEmpregadoFormState,
  type FormState,
} from "@/server/actions/empregados";
import styles from "../_form.module.css";

export type EmpregadoFormData = {
  matricula?: string;
  nome_completo?: string;
  nome_social?: string | null;
  cpf?: string;
  rg?: string | null;
  data_nascimento?: string;
  sexo?: string | null;
  raca_cor?: string | null;
  estado_civil?: string | null;
  nacionalidade?: string | null;
  pis_pasep?: string | null;
  ctps_numero?: string | null;
  ctps_serie?: string | null;
  ctps_uf?: string | null;
  email_pessoal?: string | null;
  telefone_principal?: string | null;
  cargo_id?: string;
  departamento_id?: string;
  centro_custo_id?: string | null;
  gestor_id?: string | null;
  jornada_id?: string | null;
  local_trabalho_id?: string | null;
  tipo_contrato?: string;
  data_admissao?: string;
  salario_centavos?: number;
  ultimo_aso?: string | null;
  proximo_aso_periodico?: string | null;
  nine_box_desempenho?: number | null;
  nine_box_potencial?: number | null;
};

type Opcao = { id: string; label: string };

type Props = {
  modo: "criar" | "editar";
  empregadoId?: string;
  inicial?: EmpregadoFormData;
  cargos: Opcao[];
  departamentos: Opcao[];
  centrosCusto: Opcao[];
  jornadas: Opcao[];
  locais: Opcao[];
  gestoresPossiveis: Opcao[];
};

const TIPOS_CONTRATO = [
  { v: "clt_efetivo", l: "CLT · efetivo" },
  { v: "clt_experiencia", l: "CLT · experiência" },
  { v: "estagio", l: "Estágio" },
  { v: "aprendiz", l: "Aprendiz" },
  { v: "temporario", l: "Temporário" },
  { v: "intermitente", l: "Intermitente" },
  { v: "terceirizado", l: "Terceirizado" },
  { v: "pj", l: "PJ" },
];

const SEXO = ["", "M", "F", "NB", "NI"];
const RACA = ["", "branca", "preta", "parda", "amarela", "indigena", "NI"];
const ESTADO_CIVIL = [
  "",
  "solteiro",
  "casado",
  "uniao_estavel",
  "divorciado",
  "viuvo",
];

export function EmpregadoForm({
  modo,
  empregadoId,
  inicial = {},
  cargos,
  departamentos,
  centrosCusto,
  jornadas,
  locais,
  gestoresPossiveis,
}: Props) {
  const action =
    modo === "criar"
      ? criarEmpregado
      : atualizarEmpregado.bind(null, empregadoId!);

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    initialEmpregadoFormState,
  );

  const fe = (campo: string): string | undefined =>
    state.status === "error" ? state.fieldErrors?.[campo] : undefined;

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? (
        <div className={styles.alertaErro} role="alert">
          {state.message}
        </div>
      ) : null}

      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Identificação</h3>
        <div className={styles.formGrid}>
          <Campo nome="matricula" label="Matrícula" obrig erro={fe("matricula")} defaultValue={inicial.matricula} />
          <Campo nome="nome_completo" label="Nome completo" obrig erro={fe("nome_completo")} defaultValue={inicial.nome_completo} />
          <Campo nome="nome_social" label="Nome social" defaultValue={inicial.nome_social ?? ""} />
          <Campo nome="cpf" label="CPF (só dígitos)" obrig erro={fe("cpf")} defaultValue={inicial.cpf} />
          <Campo nome="rg" label="RG" defaultValue={inicial.rg ?? ""} />
          <Campo nome="data_nascimento" label="Data de nascimento" tipo="date" obrig erro={fe("data_nascimento")} defaultValue={inicial.data_nascimento} />
          <Select nome="sexo" label="Sexo" opcoes={SEXO.map(o => ({ id: o, label: o || "—" }))} defaultValue={inicial.sexo ?? ""} />
          <Select nome="raca_cor" label="Raça/cor" opcoes={RACA.map(o => ({ id: o, label: o || "—" }))} defaultValue={inicial.raca_cor ?? ""} />
          <Select nome="estado_civil" label="Estado civil" opcoes={ESTADO_CIVIL.map(o => ({ id: o, label: o || "—" }))} defaultValue={inicial.estado_civil ?? ""} />
          <Campo nome="nacionalidade" label="Nacionalidade" defaultValue={inicial.nacionalidade ?? "brasileira"} />
        </div>
      </div>

      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Documentos pessoais</h3>
        <div className={styles.formGrid}>
          <Campo nome="pis_pasep" label="PIS / PASEP" defaultValue={inicial.pis_pasep ?? ""} />
          <Campo nome="ctps_numero" label="CTPS · número" defaultValue={inicial.ctps_numero ?? ""} />
          <Campo nome="ctps_serie" label="CTPS · série" defaultValue={inicial.ctps_serie ?? ""} />
          <Campo nome="ctps_uf" label="CTPS · UF" defaultValue={inicial.ctps_uf ?? ""} />
        </div>
      </div>

      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Contato</h3>
        <div className={styles.formGrid}>
          <Campo nome="email_pessoal" label="Email pessoal" tipo="email" erro={fe("email_pessoal")} defaultValue={inicial.email_pessoal ?? ""} />
          <Campo nome="telefone_principal" label="Telefone principal" defaultValue={inicial.telefone_principal ?? ""} />
        </div>
      </div>

      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Vínculo & cargo</h3>
        <div className={styles.formGrid}>
          <Select nome="cargo_id" label="Cargo" obrig erro={fe("cargo_id")} opcoes={cargos} defaultValue={inicial.cargo_id ?? ""} />
          <Select nome="departamento_id" label="Departamento" obrig erro={fe("departamento_id")} opcoes={departamentos} defaultValue={inicial.departamento_id ?? ""} />
          <Select nome="centro_custo_id" label="Centro de custo" opcoes={[{ id: "", label: "—" }, ...centrosCusto]} defaultValue={inicial.centro_custo_id ?? ""} />
          <Select nome="gestor_id" label="Gestor direto" opcoes={[{ id: "", label: "—" }, ...gestoresPossiveis]} defaultValue={inicial.gestor_id ?? ""} />
          <Select nome="jornada_id" label="Jornada" opcoes={[{ id: "", label: "—" }, ...jornadas]} defaultValue={inicial.jornada_id ?? ""} />
          <Select nome="local_trabalho_id" label="Local de trabalho" opcoes={[{ id: "", label: "—" }, ...locais]} defaultValue={inicial.local_trabalho_id ?? ""} />
          <Select nome="tipo_contrato" label="Tipo de contrato" obrig opcoes={TIPOS_CONTRATO.map(t => ({ id: t.v, label: t.l }))} defaultValue={inicial.tipo_contrato ?? "clt_efetivo"} />
          <Campo nome="data_admissao" label="Data de admissão" tipo="date" obrig erro={fe("data_admissao")} defaultValue={inicial.data_admissao} />
          <Campo nome="salario_centavos" label="Salário (em centavos)" tipo="number" obrig erro={fe("salario_centavos")} defaultValue={inicial.salario_centavos?.toString()} />
        </div>
      </div>

      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Saúde ocupacional & 9-Box</h3>
        <div className={styles.formGrid}>
          <Campo nome="ultimo_aso" label="Último ASO" tipo="date" defaultValue={inicial.ultimo_aso ?? ""} />
          <Campo nome="proximo_aso_periodico" label="Próximo ASO periódico" tipo="date" defaultValue={inicial.proximo_aso_periodico ?? ""} />
          <Select nome="nine_box_desempenho" label="9-Box desempenho (1-3)" opcoes={[{ id: "", label: "—" }, { id: "1", label: "1" }, { id: "2", label: "2" }, { id: "3", label: "3" }]} defaultValue={inicial.nine_box_desempenho?.toString() ?? ""} />
          <Select nome="nine_box_potencial" label="9-Box potencial (1-3)" opcoes={[{ id: "", label: "—" }, { id: "1", label: "1" }, { id: "2", label: "2" }, { id: "3", label: "3" }]} defaultValue={inicial.nine_box_potencial?.toString() ?? ""} />
        </div>
      </div>

      <div className={styles.actions}>
        <a href={empregadoId ? `/empregados/${empregadoId}` : "/empregados"} className={`${styles.btn} ${styles.btnFantasma}`}>
          Cancelar
        </a>
        <button type="submit" className={`${styles.btn} ${styles.btnPrimario}`} disabled={pending}>
          {pending ? "Salvando…" : modo === "criar" ? "Cadastrar empregado" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function Campo({
  nome,
  label,
  tipo = "text",
  obrig = false,
  erro,
  defaultValue,
}: {
  nome: string;
  label: string;
  tipo?: string;
  obrig?: boolean;
  erro?: string;
  defaultValue?: string;
}) {
  return (
    <div className={styles.campo}>
      <label htmlFor={nome}>
        {label} {obrig ? <span className={styles.obrig}>*</span> : null}
      </label>
      <input
        type={tipo}
        id={nome}
        name={nome}
        defaultValue={defaultValue ?? ""}
        required={obrig}
      />
      {erro ? <span className={styles.campoErro}>{erro}</span> : null}
    </div>
  );
}

function Select({
  nome,
  label,
  opcoes,
  obrig = false,
  erro,
  defaultValue,
}: {
  nome: string;
  label: string;
  opcoes: Opcao[];
  obrig?: boolean;
  erro?: string;
  defaultValue?: string;
}) {
  return (
    <div className={styles.campo}>
      <label htmlFor={nome}>
        {label} {obrig ? <span className={styles.obrig}>*</span> : null}
      </label>
      <select
        id={nome}
        name={nome}
        defaultValue={defaultValue ?? ""}
        required={obrig}
      >
        {opcoes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {erro ? <span className={styles.campoErro}>{erro}</span> : null}
    </div>
  );
}
