/**
 * Validação de CPF brasileiro com dígito verificador.
 * Retorna true se o CPF é matematicamente válido (não verifica se existe).
 */
export function validarCpf(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false; // 00000000000, 11111111111, etc.

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digitos[i], 10) * (10 - i);
  let dv1 = 11 - (soma % 11);
  if (dv1 >= 10) dv1 = 0;
  if (dv1 !== parseInt(digitos[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digitos[i], 10) * (11 - i);
  let dv2 = 11 - (soma % 11);
  if (dv2 >= 10) dv2 = 0;
  return dv2 === parseInt(digitos[10], 10);
}

/**
 * Validação de CNPJ brasileiro com dígito verificador.
 */
export function validarCnpj(cnpj: string): boolean {
  const digitos = cnpj.replace(/\D/g, "");
  if (digitos.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digitos)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(digitos[i], 10) * pesos1[i];
  let dv1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (dv1 !== parseInt(digitos[12], 10)) return false;

  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(digitos[i], 10) * pesos2[i];
  let dv2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return dv2 === parseInt(digitos[13], 10);
}

/**
 * Validação de PIS/PASEP/NIT (11 dígitos com DV).
 */
export function validarPis(pis: string): boolean {
  const digitos = pis.replace(/\D/g, "");
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digitos[i], 10) * pesos[i];
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  return dv === parseInt(digitos[10], 10);
}

/**
 * Validação de CNJ (número de processo judicial brasileiro).
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function validarCnj(cnj: string): boolean {
  const limpo = cnj.replace(/\D/g, "");
  if (limpo.length !== 20) return false;
  return /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(cnj);
}
