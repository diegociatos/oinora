-- ====================================================
-- Oi Nora · Migration 002 · Enumerações (MVP 1)
-- ====================================================
-- Inclui apenas os enums necessários para MVP 1.
-- Enums de vagas/candidatos/jurídico vêm em migrations posteriores.

-- Papéis no sistema (10 roles)
CREATE TYPE role AS ENUM (
  'super_admin',
  'recrutador_oinora',
  'owner',
  'admin',
  'gestor',
  'hr_ops',
  'empregado',
  'candidato',
  'advogado_externo',
  'advogado_interno'
);

-- Status do tenant (empresa-cliente)
CREATE TYPE tenant_status AS ENUM (
  'trial', 'ativo', 'suspenso', 'cancelado', 'inadimplente'
);

-- Planos comerciais
CREATE TYPE plano AS ENUM ('essencial', 'profissional', 'premium');

-- Status do empregado
CREATE TYPE empregado_status AS ENUM (
  'ativo', 'afastado', 'ferias',
  'licenca_maternidade', 'licenca_medica',
  'aviso_previo', 'desligado'
);

-- Tipo de contrato
CREATE TYPE tipo_contrato AS ENUM (
  'clt_efetivo', 'clt_experiencia', 'estagio', 'aprendiz',
  'temporario', 'intermitente', 'terceirizado', 'pj'
);

-- Tipo de movimentação no histórico
CREATE TYPE tipo_movimentacao AS ENUM (
  'admissao', 'desligamento', 'promocao', 'transferencia',
  'reajuste', 'mudanca_cargo', 'licenca'
);
