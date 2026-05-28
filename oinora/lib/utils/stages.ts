export const STAGE_LABEL: Record<string, string> = {
  aplicado: "Aplicado",
  triagem: "Triagem",
  entrevista_recrutador: "Ent. Recrutador",
  teste: "Teste",
  entrevista_gestor: "Ent. Gestor",
  proposta: "Proposta",
  contratado: "Contratado",
  recusado: "Recusado",
  desistiu: "Desistiu",
};

export const STAGE_ORDER = [
  "aplicado",
  "triagem",
  "entrevista_recrutador",
  "teste",
  "entrevista_gestor",
  "proposta",
  "contratado",
] as const;

export const STAGE_COR: Record<string, string> = {
  aplicado: "#5C6478",
  triagem: "#3B4A6B",
  entrevista_recrutador: "#1F2A44",
  teste: "#7E5BCC",
  entrevista_gestor: "#5B3FA0",
  proposta: "#D4A02C",
  contratado: "#2D7D5A",
  recusado: "#C44545",
  desistiu: "#5C6478",
};

export const VAGA_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aprovada: "Aprovada",
  publicada: "Publicada",
  pausada: "Pausada",
  preenchida: "Preenchida",
  cancelada: "Cancelada",
};
