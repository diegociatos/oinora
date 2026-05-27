/**
 * Formatters Brasil-aware para uso na UI.
 * Backend mantém valores crus (centavos, ISO, CPF sem máscara).
 */

const fmtMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const fmtDataLonga = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function formatarMoeda(centavos: number | null | undefined): string {
  if (centavos == null) return "—";
  return fmtMoeda.format(centavos / 100);
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fmtData.format(new Date(iso));
}

export function formatarDataLonga(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fmtDataLonga.format(new Date(iso));
}

export function formatarCpf(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const limpo = cpf.replace(/\D/g, "").padStart(11, "0");
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
}

export function formatarCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return "—";
  const limpo = cnpj.replace(/\D/g, "").padStart(14, "0");
  return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12, 14)}`;
}

export function calcularIdade(dataNascISO: string | null | undefined): number | null {
  if (!dataNascISO) return null;
  const nasc = new Date(dataNascISO);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export function calcularTempoCasa(dataAdmissaoISO: string | null | undefined): string {
  if (!dataAdmissaoISO) return "—";
  const adm = new Date(dataAdmissaoISO);
  const hoje = new Date();
  let anos = hoje.getFullYear() - adm.getFullYear();
  let meses = hoje.getMonth() - adm.getMonth();
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  if (anos === 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  if (meses === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos}a ${meses}m`;
}

export const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  afastado: "Afastado",
  ferias: "Férias",
  licenca_maternidade: "Lic. maternidade",
  licenca_medica: "Lic. médica",
  aviso_previo: "Aviso prévio",
  desligado: "Desligado",
};

export const STATUS_TAG_COR: Record<string, string> = {
  ativo: "verde",
  afastado: "amarelo",
  ferias: "marinho",
  licenca_maternidade: "roxo",
  licenca_medica: "roxo",
  aviso_previo: "amarelo",
  desligado: "vermelho",
};
