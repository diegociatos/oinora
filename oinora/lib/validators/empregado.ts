import { z } from "zod";

const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF precisa ter 11 dígitos");

const optionalString = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalNumberFromString = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : Number(v)))
  .nullable()
  .refine((v) => v === null || !Number.isNaN(v), "Número inválido");

const optionalDate = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : v))
  .nullable();

export const empregadoFormSchema = z.object({
  matricula: z.string().trim().min(1, "Matrícula obrigatória").max(20),
  nome_completo: z.string().trim().min(3, "Nome muito curto"),
  nome_social: optionalString,
  cpf: cpfSchema,
  rg: optionalString,
  data_nascimento: z.string().min(1, "Data de nascimento obrigatória"),
  sexo: optionalString,
  raca_cor: optionalString,
  estado_civil: optionalString,
  nacionalidade: optionalString,
  pis_pasep: optionalString,
  ctps_numero: optionalString,
  ctps_serie: optionalString,
  ctps_uf: optionalString,
  email_pessoal: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || /.+@.+\..+/.test(v),
      "Email inválido",
    ),
  telefone_principal: optionalString,
  cargo_id: z.string().uuid("Cargo obrigatório"),
  departamento_id: z.string().uuid("Departamento obrigatório"),
  centro_custo_id: z
    .string()
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  gestor_id: z
    .string()
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  jornada_id: z
    .string()
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  local_trabalho_id: z
    .string()
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  tipo_contrato: z.enum([
    "clt_efetivo",
    "clt_experiencia",
    "estagio",
    "aprendiz",
    "temporario",
    "intermitente",
    "terceirizado",
    "pj",
  ]),
  data_admissao: z.string().min(1, "Data de admissão obrigatória"),
  salario_centavos: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform((v) => parseInt(v, 10))
    .refine((v) => !Number.isNaN(v) && v > 0, "Salário obrigatório"),
  ultimo_aso: optionalDate,
  proximo_aso_periodico: optionalDate,
  nine_box_desempenho: optionalNumberFromString,
  nine_box_potencial: optionalNumberFromString,
});

export type EmpregadoFormInput = z.infer<typeof empregadoFormSchema>;
