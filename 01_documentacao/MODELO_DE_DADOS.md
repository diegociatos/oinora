# MODELO_DE_DADOS.md
## Schema Supabase completo · Oi Nora

> Schema PostgreSQL 16 com Row Level Security (RLS) obrigatória em todas as tabelas. Habilitar extensões `uuid-ossp`, `pgcrypto`, `pgvector`, `pg_trgm`.

---

## 1. Extensões necessárias

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector para embeddings IA
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- busca textual (CV, processos)
CREATE EXTENSION IF NOT EXISTS "btree_gin";    -- índices compostos
```

---

## 2. Tipos enumerados (ENUMs)

```sql
-- Papéis no sistema
CREATE TYPE role AS ENUM (
  'super_admin',          -- Cláudia · Oi Nora
  'recrutador_oinora',    -- Mariana · Oi Nora
  'owner',                -- Roberto · Aurora
  'admin',                -- Carla · Aurora
  'gestor',               -- Luísa · Aurora
  'hr_ops',               -- Bruna · Aurora (DP)
  'empregado',            -- Fernando · Aurora
  'candidato',            -- Letícia · externa
  'advogado_externo',     -- Dr. Henrique · Vasconcellos
  'advogado_interno'      -- Advogado CLT do tenant
);

-- Tipo de empresa-cliente
CREATE TYPE tenant_status AS ENUM (
  'trial', 'ativo', 'suspenso', 'cancelado', 'inadimplente'
);

-- Planos
CREATE TYPE plano AS ENUM ('essencial', 'profissional', 'premium');

-- Status de vaga
CREATE TYPE vaga_status AS ENUM (
  'rascunho', 'aprovada', 'publicada', 'pausada', 'preenchida', 'cancelada'
);

-- Status de candidato em uma vaga (pipeline ATS)
CREATE TYPE candidato_stage AS ENUM (
  'aplicado', 'triagem', 'entrevista_recrutador', 'teste',
  'entrevista_gestor', 'proposta', 'contratado', 'recusado', 'desistiu'
);

-- Status do empregado
CREATE TYPE empregado_status AS ENUM (
  'ativo', 'afastado', 'ferias', 'licenca_maternidade', 'licenca_medica',
  'aviso_previo', 'desligado'
);

-- Tipo de contrato
CREATE TYPE tipo_contrato AS ENUM (
  'clt_efetivo', 'clt_experiencia', 'estagio', 'aprendiz',
  'temporario', 'intermitente', 'terceirizado', 'pj'
);

-- Risco de processo (CPC 25)
CREATE TYPE risco_processo AS ENUM (
  'remoto', 'possivel', 'provavel', 'em_analise'
);

-- Fase processual
CREATE TYPE fase_processo AS ENUM (
  'pre_processual', 'conhecimento', 'instrucao', 'sentenciado',
  'recurso_ordinario', 'recurso_revista', 'execucao', 'acordo', 'arquivado'
);

-- Tipo de movimentação
CREATE TYPE tipo_movimentacao AS ENUM (
  'admissao', 'desligamento', 'promocao', 'transferencia',
  'reajuste', 'mudanca_cargo', 'licenca'
);
```

---

## 3. Tabelas principais

### 3.1. Tenants (empresas-clientes)

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj VARCHAR(14) UNIQUE NOT NULL,
  inscricao_estadual TEXT,
  cnae_principal TEXT,
  cct_codigo TEXT,                       -- ex: SINTRAICCMG-CONST-CIVIL
  fap NUMERIC(6,4),                      -- ex: 1.2317
  rat NUMERIC(4,2),                      -- ex: 3.00
  endereco JSONB,                        -- {logradouro, numero, bairro, cidade, uf, cep}
  contato JSONB,                         -- {telefone, email, responsavel}
  logo_url TEXT,
  plano plano NOT NULL DEFAULT 'essencial',
  status tenant_status NOT NULL DEFAULT 'trial',
  trial_termina_em TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  modulos_ativos TEXT[] DEFAULT ARRAY['rs', 'gestao_pessoas']::TEXT[],
  configuracoes JSONB DEFAULT '{}'::JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_cnpj ON tenants(cnpj);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### 3.2. Usuários & memberships

```sql
-- usuarios extende auth.users do Supabase
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(11) UNIQUE,
  telefone TEXT,
  foto_url TEXT,
  oab TEXT,                              -- só para advogados
  oab_uf VARCHAR(2),
  ultimo_login TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- relação N:N usuário-tenant com papéis
CREATE TABLE tenant_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role role NOT NULL,
  permissoes_extras JSONB DEFAULT '{}'::JSONB,  -- override granular
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, tenant_id, role)
);

CREATE INDEX idx_membership_usuario ON tenant_memberships(usuario_id);
CREATE INDEX idx_membership_tenant ON tenant_memberships(tenant_id);

-- escritórios jurídicos externos (Vasconcellos & Associados)
CREATE TABLE escritorios_juridicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social TEXT NOT NULL,
  cnpj VARCHAR(14) UNIQUE,
  responsavel_oab TEXT,
  contato JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- relação escritório-tenant (quais empresas o escritório atende)
CREATE TABLE escritorio_tenants (
  escritorio_id UUID REFERENCES escritorios_juridicos(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  PRIMARY KEY(escritorio_id, tenant_id)
);
```

### 3.3. Departamentos, Cargos, Centros de Custo

```sql
CREATE TABLE departamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sigla VARCHAR(8),
  diretor_id UUID,                       -- FK para empregados.id (preenchido depois)
  parent_id UUID REFERENCES departamentos(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departamentos_tenant ON departamentos(tenant_id);

CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,                  -- ex: ENG-CIVIL-SR
  nome TEXT NOT NULL,
  cbo VARCHAR(7),                        -- ex: 2142-05
  faixa_salarial_min_centavos BIGINT,
  faixa_salarial_max_centavos BIGINT,
  nivel TEXT,                            -- jr, pl, sr, espec
  jornada_horas_semana NUMERIC(5,2),    -- ex: 44.00
  insalubridade_pct NUMERIC(5,2),       -- ex: 20.00
  periculosidade_pct NUMERIC(5,2),
  departamento_id UUID REFERENCES departamentos(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

CREATE TABLE centros_custo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,                  -- ex: ENG-002
  nome TEXT NOT NULL,
  departamento_id UUID REFERENCES departamentos(id),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);
```

### 3.4. Empregados (a tabela mais importante)

```sql
CREATE TABLE empregados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  matricula VARCHAR(20) NOT NULL,        -- ex: 0112
  usuario_id UUID REFERENCES usuarios(id), -- se o empregado tiver acesso ao sistema

  -- dados pessoais
  nome_completo TEXT NOT NULL,
  nome_social TEXT,
  cpf VARCHAR(11) NOT NULL,
  rg TEXT,
  data_nascimento DATE NOT NULL,
  sexo VARCHAR(20),                      -- M, F, NB, NI
  raca_cor VARCHAR(20),                  -- branca, preta, parda, amarela, indigena, NI
  estado_civil VARCHAR(20),
  nacionalidade TEXT DEFAULT 'brasileira',
  pis_pasep VARCHAR(11),
  ctps_numero TEXT,
  ctps_serie TEXT,
  ctps_uf VARCHAR(2),
  titulo_eleitor TEXT,
  reservista TEXT,
  banco JSONB,                           -- {banco, agencia, conta, tipo, chave_pix}

  -- contato
  email_pessoal TEXT,
  telefone_principal TEXT,
  endereco JSONB,                        -- {logradouro, numero, complemento, bairro, cidade, uf, cep}
  contato_emergencia JSONB,              -- {nome, parentesco, telefone}

  -- vínculo
  cargo_id UUID NOT NULL REFERENCES cargos(id),
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  centro_custo_id UUID REFERENCES centros_custo(id),
  gestor_id UUID REFERENCES empregados(id),
  tipo_contrato tipo_contrato NOT NULL DEFAULT 'clt_efetivo',
  data_admissao DATE NOT NULL,
  data_desligamento DATE,
  motivo_desligamento TEXT,
  salario_centavos BIGINT NOT NULL,
  jornada_id UUID,                       -- FK para tabela jornadas (definida adiante)
  local_trabalho_id UUID,                -- FK para locais_trabalho
  status empregado_status NOT NULL DEFAULT 'ativo',

  -- saúde ocupacional
  ultimo_aso DATE,
  proximo_aso_periodico DATE,

  -- desempenho · 9-Box
  nine_box_desempenho INTEGER CHECK (nine_box_desempenho BETWEEN 1 AND 3),
  nine_box_potencial INTEGER CHECK (nine_box_potencial BETWEEN 1 AND 3),

  -- foto / documentos
  foto_url TEXT,

  -- metadata
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_por UUID REFERENCES usuarios(id),

  UNIQUE(tenant_id, matricula),
  UNIQUE(tenant_id, cpf)
);

CREATE INDEX idx_empregados_tenant ON empregados(tenant_id);
CREATE INDEX idx_empregados_status ON empregados(tenant_id, status);
CREATE INDEX idx_empregados_cargo ON empregados(cargo_id);
CREATE INDEX idx_empregados_gestor ON empregados(gestor_id);
CREATE INDEX idx_empregados_busca ON empregados USING gin(nome_completo gin_trgm_ops);

-- dependentes
CREATE TABLE empregado_dependentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(11),
  data_nascimento DATE NOT NULL,
  parentesco TEXT NOT NULL,
  ir_dependente BOOLEAN DEFAULT FALSE,
  salario_familia BOOLEAN DEFAULT FALSE,
  plano_saude BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- documentos do empregado (anexos)
CREATE TABLE empregado_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tipo TEXT NOT NULL,                    -- rg, cpf, ctps, aso, certificado_nr, etc
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,            -- supabase storage
  validade DATE,
  enviado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_empregado_docs_tipo ON empregado_documentos(empregado_id, tipo);

-- histórico de movimentações
CREATE TABLE empregado_movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tipo tipo_movimentacao NOT NULL,
  data_efetiva DATE NOT NULL,
  cargo_anterior_id UUID REFERENCES cargos(id),
  cargo_novo_id UUID REFERENCES cargos(id),
  departamento_anterior_id UUID REFERENCES departamentos(id),
  departamento_novo_id UUID REFERENCES departamentos(id),
  centro_custo_anterior_id UUID REFERENCES centros_custo(id),
  centro_custo_novo_id UUID REFERENCES centros_custo(id),
  salario_anterior_centavos BIGINT,
  salario_novo_centavos BIGINT,
  observacao TEXT,
  aprovado_por UUID REFERENCES usuarios(id),
  esocial_evento_id UUID,                -- FK para esocial_eventos
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5. Locais de trabalho, jornadas, escalas

```sql
CREATE TABLE locais_trabalho (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,                    -- ex: "Canteiro Sítio II"
  endereco JSONB,
  coordenadas POINT,                     -- geofence para ponto
  raio_metros INTEGER DEFAULT 100,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jornadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,                    -- ex: "08:00-17:00 seg-sex"
  horas_semana NUMERIC(5,2) NOT NULL,
  configuracao JSONB,                    -- {segunda: {entrada, almoco_inicio, almoco_fim, saida}, ...}
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6. Ponto eletrônico

```sql
CREATE TABLE batidas_ponto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario TIMESTAMPTZ NOT NULL,
  tipo VARCHAR(20) NOT NULL,             -- entrada, almoco_saida, almoco_volta, saida, intervalo
  local_id UUID REFERENCES locais_trabalho(id),
  coordenadas POINT,
  metodo VARCHAR(20),                    -- web, app_mobile, biometria, cartao
  ip TEXT,
  foto_url TEXT,                         -- foto da batida (opcional)
  ajustada BOOLEAN DEFAULT FALSE,
  justificativa TEXT,
  ajustada_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_batidas_empregado_data ON batidas_ponto(empregado_id, data);

CREATE TABLE espelhos_ponto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  competencia DATE NOT NULL,             -- 1º dia do mês
  total_horas_trabalhadas NUMERIC(7,2),
  horas_extras_50 NUMERIC(7,2),
  horas_extras_100 NUMERIC(7,2),
  banco_horas_saldo NUMERIC(7,2),
  faltas INTEGER DEFAULT 0,
  atrasos_minutos INTEGER DEFAULT 0,
  fechado BOOLEAN DEFAULT FALSE,
  fechado_em TIMESTAMPTZ,
  fechado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empregado_id, competencia)
);
```

### 3.7. Folha de pagamento

```sql
CREATE TABLE folha_competencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  competencia DATE NOT NULL,             -- 1º do mês
  status VARCHAR(20) NOT NULL DEFAULT 'aberta',  -- aberta, calculando, conferencia, fechada, paga
  total_proventos_centavos BIGINT DEFAULT 0,
  total_descontos_centavos BIGINT DEFAULT 0,
  total_liquido_centavos BIGINT DEFAULT 0,
  total_empregados INTEGER DEFAULT 0,
  encargos_inss_patronal_centavos BIGINT,
  encargos_fgts_centavos BIGINT,
  fechada_em TIMESTAMPTZ,
  fechada_por UUID REFERENCES usuarios(id),
  esocial_enviado BOOLEAN DEFAULT FALSE,
  esocial_enviado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, competencia)
);

CREATE TABLE folha_holerites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  competencia_id UUID NOT NULL REFERENCES folha_competencias(id) ON DELETE CASCADE,
  empregado_id UUID NOT NULL REFERENCES empregados(id),
  salario_base_centavos BIGINT NOT NULL,
  total_proventos_centavos BIGINT NOT NULL,
  total_descontos_centavos BIGINT NOT NULL,
  total_liquido_centavos BIGINT NOT NULL,
  inss_base_centavos BIGINT,
  inss_desconto_centavos BIGINT,
  irrf_base_centavos BIGINT,
  irrf_desconto_centavos BIGINT,
  fgts_base_centavos BIGINT,
  fgts_centavos BIGINT,
  pdf_url TEXT,                          -- supabase storage
  liberado_para_empregado BOOLEAN DEFAULT FALSE,
  visualizado_pelo_empregado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competencia_id, empregado_id)
);

CREATE TABLE folha_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  holerite_id UUID NOT NULL REFERENCES folha_holerites(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,                  -- ex: 001=salario, 050=horas_extras_50
  descricao TEXT NOT NULL,
  tipo VARCHAR(10) NOT NULL,             -- provento, desconto, informativo
  quantidade NUMERIC(8,2),               -- horas, dias
  base_calculo_centavos BIGINT,
  valor_centavos BIGINT NOT NULL,
  origem VARCHAR(30),                    -- folha, ponto, beneficios, manual
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_folha_eventos_holerite ON folha_eventos(holerite_id);

-- tabelas auxiliares: INSS, IRRF, salário-família
CREATE TABLE tabela_inss (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  faixa_inicio_centavos BIGINT NOT NULL,
  faixa_fim_centavos BIGINT NOT NULL,
  aliquota NUMERIC(5,4) NOT NULL,
  deduzir_centavos BIGINT DEFAULT 0
);

CREATE TABLE tabela_irrf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  faixa_inicio_centavos BIGINT NOT NULL,
  faixa_fim_centavos BIGINT NOT NULL,
  aliquota NUMERIC(5,4) NOT NULL,
  deduzir_centavos BIGINT DEFAULT 0,
  deducao_dependente_centavos BIGINT
);
```

### 3.8. Recrutamento & Seleção (ATS)

```sql
CREATE TABLE vagas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,                  -- ex: #2026-0042
  titulo TEXT NOT NULL,
  cargo_id UUID REFERENCES cargos(id),
  departamento_id UUID REFERENCES departamentos(id),
  gestor_solicitante_id UUID REFERENCES empregados(id),
  recrutador_oinora_id UUID REFERENCES usuarios(id),

  descricao_completa TEXT,
  responsabilidades TEXT,
  requisitos_obrigatorios TEXT[],
  requisitos_desejaveis TEXT[],
  beneficios TEXT[],
  salario_min_centavos BIGINT,
  salario_max_centavos BIGINT,
  jornada TEXT,
  local_trabalho_id UUID REFERENCES locais_trabalho(id),
  modelo_trabalho VARCHAR(20),           -- presencial, hibrido, remoto

  -- vaga afirmativa
  afirmativa BOOLEAN DEFAULT FALSE,
  publico_alvo TEXT,                     -- ex: pcd, mulheres_eng

  status vaga_status NOT NULL DEFAULT 'rascunho',
  data_publicacao DATE,
  data_fechamento DATE,
  motivo_fechamento TEXT,
  contratado_empregado_id UUID REFERENCES empregados(id),

  -- embeddings para match
  descricao_embedding VECTOR(1024),

  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

CREATE INDEX idx_vagas_status ON vagas(tenant_id, status);
CREATE INDEX idx_vagas_embedding ON vagas USING ivfflat (descricao_embedding vector_cosine_ops);

CREATE TABLE candidatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- NÃO tem tenant_id (candidato é global, pode aplicar em vagas de vários tenants)
  usuario_id UUID REFERENCES usuarios(id),
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(11),
  data_nascimento DATE,
  sexo VARCHAR(20),
  raca_cor VARCHAR(20),
  email TEXT NOT NULL,
  telefone TEXT,
  cidade TEXT,
  uf VARCHAR(2),
  cep VARCHAR(8),

  -- CV
  cv_url TEXT,                           -- supabase storage
  cv_texto_extraido TEXT,                -- OCR/parsing
  cv_embedding VECTOR(1024),             -- match semântico

  -- LinkedIn / outros
  linkedin_url TEXT,
  portfolio_url TEXT,
  pretensao_salarial_centavos BIGINT,
  disponibilidade_inicio DATE,
  modelo_trabalho_preferencia TEXT[],

  -- consentimento LGPD
  aceitou_lgpd BOOLEAN DEFAULT FALSE,
  aceitou_lgpd_em TIMESTAMPTZ,

  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidatos_cpf ON candidatos(cpf);
CREATE INDEX idx_candidatos_email ON candidatos(email);
CREATE INDEX idx_candidatos_embedding ON candidatos USING ivfflat (cv_embedding vector_cosine_ops);

CREATE TABLE candidatura_vaga (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  vaga_id UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,

  stage candidato_stage NOT NULL DEFAULT 'aplicado',
  score_ia NUMERIC(5,2),                 -- match% calculado pela IA
  parecer_triagem TEXT,                  -- texto gerado pela IA na triagem
  origem VARCHAR(30),                    -- linkedin, gupy, site_proprio, indicacao

  data_aplicacao TIMESTAMPTZ DEFAULT NOW(),
  data_ultima_movimentacao TIMESTAMPTZ DEFAULT NOW(),
  movimentado_por UUID REFERENCES usuarios(id),

  proposta_salario_centavos BIGINT,
  proposta_enviada_em TIMESTAMPTZ,
  proposta_resposta VARCHAR(20),         -- aceita, recusada, contraproposta
  observacoes TEXT,

  UNIQUE(vaga_id, candidato_id)
);

CREATE INDEX idx_candidatura_stage ON candidatura_vaga(vaga_id, stage);

CREATE TABLE entrevistas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  candidatura_id UUID NOT NULL REFERENCES candidatura_vaga(id) ON DELETE CASCADE,
  entrevistador_id UUID REFERENCES usuarios(id),
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER DEFAULT 60,
  modalidade VARCHAR(20),                -- presencial, video, telefone
  link_video TEXT,
  feedback TEXT,
  nota_geral NUMERIC(3,1),               -- 0.0-10.0
  recomendacao VARCHAR(20),              -- avancar, pendente, rejeitar
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.9. Onboarding

```sql
CREATE TABLE onboarding_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo_id UUID REFERENCES cargos(id),
  duracao_dias INTEGER NOT NULL DEFAULT 30,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_template_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  categoria TEXT,                        -- documentacao, integracao, treinamento, equipamentos
  titulo TEXT NOT NULL,
  descricao TEXT,
  dia_alvo INTEGER,                      -- D+0, D+5, D+30
  obrigatorio BOOLEAN DEFAULT TRUE,
  responsavel_padrao TEXT,               -- hr_ops, gestor, mentor, empregado
  curso_id UUID,                         -- FK opcional para cursos
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_empregado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  template_id UUID REFERENCES onboarding_templates(id),
  data_inicio DATE NOT NULL,
  data_termino_previsto DATE NOT NULL,
  mentor_id UUID REFERENCES empregados(id),
  status VARCHAR(20) DEFAULT 'em_curso', -- em_curso, concluido, atrasado, cancelado
  percentual_concluido NUMERIC(5,2) DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  onboarding_id UUID NOT NULL REFERENCES onboarding_empregado(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES onboarding_template_itens(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  dia_alvo INTEGER,
  data_alvo DATE,
  concluido BOOLEAN DEFAULT FALSE,
  concluido_em TIMESTAMPTZ,
  concluido_por UUID REFERENCES usuarios(id),
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.10. Treinamentos & Trilhas

```sql
CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id), -- NULL = curso de catálogo global Oi Nora
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,                        -- nr, sistemas, gestao, idiomas, compliance
  provedor TEXT,                         -- alura, udemy, fdc, aurora_interno
  carga_horaria_horas NUMERIC(5,2),
  obrigatorio BOOLEAN DEFAULT FALSE,
  nr_codigo VARCHAR(10),                 -- NR-18, NR-35, etc.
  validade_meses INTEGER,                -- ex: NR-35 vale 2 anos
  url_externa TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trilhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  cargo_alvo_id UUID REFERENCES cargos(id),
  obrigatoria BOOLEAN DEFAULT FALSE,
  carga_horaria_total NUMERIC(7,2),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trilha_cursos (
  trilha_id UUID REFERENCES trilhas(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES cursos(id),
  ordem INTEGER NOT NULL,
  PRIMARY KEY(trilha_id, curso_id)
);

CREATE TABLE empregado_curso_matriculas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos(id),
  trilha_id UUID REFERENCES trilhas(id),
  status VARCHAR(20) DEFAULT 'matriculado', -- matriculado, em_curso, concluido, expirado
  data_matricula DATE DEFAULT CURRENT_DATE,
  data_inicio DATE,
  data_conclusao DATE,
  data_expiracao DATE,                   -- para NRs com validade
  nota_final NUMERIC(4,2),
  percentual_concluido NUMERIC(5,2) DEFAULT 0,
  certificado_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empregado_id, curso_id)
);

CREATE INDEX idx_matricula_empregado ON empregado_curso_matriculas(empregado_id);
CREATE INDEX idx_matricula_expiracao ON empregado_curso_matriculas(tenant_id, data_expiracao);
```

### 3.11. Headcount & Quadro de posições

```sql
CREATE TABLE headcount_quadro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ciclo_ano INTEGER NOT NULL,
  departamento_id UUID REFERENCES departamentos(id),
  cargo_id UUID REFERENCES cargos(id),
  posicoes_autorizadas INTEGER NOT NULL,
  observacao TEXT,
  aprovado_por UUID REFERENCES usuarios(id),
  aprovado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, ciclo_ano, departamento_id, cargo_id)
);

CREATE TABLE headcount_projecoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cenario VARCHAR(20) NOT NULL,          -- conservador, realista, otimista
  mes DATE NOT NULL,                     -- 1º do mês
  total_empregados_previsto INTEGER NOT NULL,
  custo_mensal_centavos BIGINT NOT NULL,
  contratacoes_previstas INTEGER DEFAULT 0,
  desligamentos_previstos INTEGER DEFAULT 0,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, cenario, mes)
);
```

### 3.12. Jurídico Trabalhista

```sql
CREATE TABLE processos_juridicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  escritorio_id UUID REFERENCES escritorios_juridicos(id),
  advogado_responsavel_id UUID REFERENCES usuarios(id),

  cnj_numero VARCHAR(25) NOT NULL UNIQUE, -- 0011234-56.2024.5.03.0021
  vara TEXT NOT NULL,                    -- "1ª VT BH"
  juiz_nome TEXT,
  comarca TEXT,
  uf VARCHAR(2),

  -- partes
  reclamante_nome TEXT NOT NULL,
  reclamante_cpf VARCHAR(11),
  reclamante_ex_empregado_id UUID REFERENCES empregados(id),
  reclamante_procurador_nome TEXT,
  reclamante_procurador_oab TEXT,

  -- ação
  tipo_acao TEXT,                        -- reclamatoria, acidente_trabalho, execucao
  data_ajuizamento DATE NOT NULL,
  data_citacao DATE,
  fase fase_processo NOT NULL DEFAULT 'conhecimento',

  -- valores
  valor_causa_centavos BIGINT NOT NULL,
  pleitos TEXT[],                        -- ['horas_extras', 'insalubridade_nr15', 'fgts']

  -- risco (CPC 25)
  risco risco_processo NOT NULL DEFAULT 'em_analise',
  provisao_centavos BIGINT,
  risco_definido_por UUID REFERENCES usuarios(id),
  risco_definido_em TIMESTAMPTZ,

  -- cálculo IA
  calc_melhor_caso_centavos BIGINT,
  calc_realista_centavos BIGINT,
  calc_pior_caso_centavos BIGINT,
  calc_atualizado_em TIMESTAMPTZ,

  -- embeddings para similaridade
  resumo_embedding VECTOR(1024),

  -- status
  status VARCHAR(20) DEFAULT 'ativo',    -- ativo, encerrado_acordo, encerrado_sentenca, arquivado

  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_processos_tenant ON processos_juridicos(tenant_id);
CREATE INDEX idx_processos_risco ON processos_juridicos(tenant_id, risco);
CREATE INDEX idx_processos_embedding ON processos_juridicos USING ivfflat (resumo_embedding vector_cosine_ops);

CREATE TABLE processo_andamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  data_evento TIMESTAMPTZ NOT NULL,
  tipo VARCHAR(30),                      -- audiencia, peticao, despacho, sentenca, citacao
  titulo TEXT NOT NULL,
  descricao TEXT,
  documento_storage_path TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_andamentos_processo ON processo_andamentos(processo_id, data_evento DESC);

CREATE TABLE processo_audiencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo VARCHAR(30),                      -- conciliacao_inicial, instrucao, julgamento, pericia
  vara TEXT,
  sala TEXT,
  preposto_nome TEXT,
  preposto_documento TEXT,
  resultado TEXT,                        -- acordo, designacao_audiencia, sentenca, etc.
  registrado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audiencias_data ON processo_audiencias(data_hora);

CREATE TABLE processo_calculo_parcelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  cenario VARCHAR(20),                   -- melhor, realista, pior
  parcela TEXT NOT NULL,                 -- "Horas extras 50%"
  fundamento_legal TEXT,                 -- "CLT art. 7º XVI"
  periodo TEXT,
  base_calculo TEXT,                     -- "2.847h × R$ 21,55"
  valor_centavos BIGINT NOT NULL,
  ordem INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE processo_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  tipo VARCHAR(30),                      -- peticao_inicial, contestacao, replica, sentenca
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  enviado_ao_pje BOOLEAN DEFAULT FALSE,
  enviado_ao_pje_em TIMESTAMPTZ,
  enviado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE processo_anotacoes_privadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  privada_para VARCHAR(20),              -- escritorio, advogado, tenant
  autor_id UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE processo_acordos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  data_acordo DATE NOT NULL,
  valor_acordo_centavos BIGINT NOT NULL,
  numero_parcelas INTEGER DEFAULT 1,
  data_primeira_parcela DATE,
  economia_vs_provavel_centavos BIGINT,
  termo_url TEXT,                        -- supabase storage
  homologado BOOLEAN DEFAULT FALSE,
  homologado_em DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.13. Avaliação de desempenho (9-Box, PDI)

```sql
CREATE TABLE ciclos_avaliacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,                    -- "Avaliação Q1/2026"
  ano INTEGER NOT NULL,
  trimestre INTEGER,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'planejado', -- planejado, em_curso, calibracao, fechado
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ciclo_id UUID NOT NULL REFERENCES ciclos_avaliacao(id) ON DELETE CASCADE,
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES usuarios(id),
  tipo VARCHAR(20),                      -- autoavaliacao, gestor, par, subordinado
  nota_desempenho NUMERIC(3,1),
  nota_potencial NUMERIC(3,1),
  ponto_forte TEXT,
  ponto_desenvolver TEXT,
  feedback_aberto TEXT,
  status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, enviada, calibrada
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pdi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  ciclo_id UUID REFERENCES ciclos_avaliacao(id),
  objetivo_principal TEXT,
  objetivo_secundario TEXT,
  horizonte_meses INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pdi_acoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  pdi_id UUID NOT NULL REFERENCES pdi(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  tipo VARCHAR(30),                      -- curso, mentoria, projeto, leitura
  recurso_id UUID,                       -- FK para cursos, mentorias, etc.
  data_inicio DATE,
  data_prazo DATE,
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, em_curso, concluida
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.14. eSocial · auditoria de envios

```sql
CREATE TABLE esocial_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo_evento VARCHAR(10) NOT NULL,    -- S-1200, S-2200, S-2210, S-2299
  empregado_id UUID REFERENCES empregados(id),
  competencia DATE,
  xml_enviado TEXT,
  protocolo TEXT,
  recibo TEXT,
  status VARCHAR(20),                    -- pendente, enviado, processado, rejeitado
  retorno_xml TEXT,
  enviado_em TIMESTAMPTZ,
  processado_em TIMESTAMPTZ,
  erro_descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_esocial_status ON esocial_eventos(tenant_id, status);
```

### 3.15. Audit log (LGPD)

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  usuario_id UUID REFERENCES usuarios(id),
  acao TEXT NOT NULL,                    -- ex: "empregado.atualizar", "processo.criar"
  recurso_tipo TEXT NOT NULL,            -- empregado, processo, vaga, candidato
  recurso_id UUID NOT NULL,
  dados_antes JSONB,
  dados_depois JSONB,
  ip TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id, criado_em DESC);
CREATE INDEX idx_audit_recurso ON audit_log(recurso_tipo, recurso_id);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id, criado_em DESC);
```

### 3.16. Notificações e chat

```sql
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(30),                      -- nr_vencendo, processo_audiencia, folha_fechada
  titulo TEXT NOT NULL,
  mensagem TEXT,
  link TEXT,
  lida BOOLEAN DEFAULT FALSE,
  lida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON notificacoes(usuario_id, lida, criado_em DESC);

-- chats (3 contextos: RH↔empregado, OiNora↔empresa, recrutador↔candidato)
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  contexto VARCHAR(30),                  -- rh_empregado, oinora_empresa, recrutador_candidato
  titulo TEXT,
  ultima_mensagem_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_participantes (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  papel_no_chat VARCHAR(20),             -- empregado, rh, recrutador, candidato, owner
  ultima_leitura_em TIMESTAMPTZ,
  PRIMARY KEY(chat_id, usuario_id)
);

CREATE TABLE chat_mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES usuarios(id),
  conteudo TEXT NOT NULL,
  anexo_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.17. IA · cache de chamadas, embeddings, prompts

```sql
CREATE TABLE ia_chamadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  usuario_id UUID REFERENCES usuarios(id),
  prompt_nome TEXT NOT NULL,             -- ex: triagem_curriculo_v1
  modelo TEXT NOT NULL,                  -- claude-haiku-4-5
  input_tokens INTEGER,
  output_tokens INTEGER,
  custo_centavos INTEGER,
  duracao_ms INTEGER,
  recurso_tipo TEXT,                     -- candidatura, processo
  recurso_id UUID,
  input_resumo TEXT,
  output_resumo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ia_chamadas_tenant ON ia_chamadas(tenant_id, criado_em DESC);
CREATE INDEX idx_ia_chamadas_recurso ON ia_chamadas(recurso_tipo, recurso_id);
```

---

## 4. Row Level Security (RLS) — políticas

### Funções auxiliares

```sql
-- pega o tenant_id ativo do usuário logado
CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_memberships
  WHERE usuario_id = auth.uid() AND ativo = TRUE
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- pega o role do usuário no tenant ativo
CREATE OR REPLACE FUNCTION auth_role() RETURNS role AS $$
  SELECT role FROM tenant_memberships
  WHERE usuario_id = auth.uid() AND tenant_id = auth_tenant_id() AND ativo = TRUE
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- checa se é super admin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM tenant_memberships
    WHERE usuario_id = auth.uid() AND role = 'super_admin' AND ativo = TRUE
  );
$$ LANGUAGE sql STABLE;

-- checa se é advogado externo com acesso a este tenant
CREATE OR REPLACE FUNCTION is_advogado_externo_de(t_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM tenant_memberships tm
    JOIN escritorio_tenants et ON et.tenant_id = t_id
    WHERE tm.usuario_id = auth.uid()
      AND tm.role = 'advogado_externo'
      AND tm.ativo = TRUE
      AND (et.data_fim IS NULL OR et.data_fim >= CURRENT_DATE)
  );
$$ LANGUAGE sql STABLE;
```

### Habilitar RLS em todas as tabelas

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE empregados ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_vaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_holerites ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE batidas_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_juridicos ENABLE ROW LEVEL SECURITY;
-- ... habilitar em todas
```

### Políticas-exemplo (aplicar padrão similar a todas as tabelas tenant-aware)

```sql
-- EMPREGADOS · isolamento por tenant
CREATE POLICY empregados_select ON empregados
  FOR SELECT USING (
    tenant_id = auth_tenant_id()
    OR is_super_admin()
    OR is_advogado_externo_de(tenant_id)
  );

CREATE POLICY empregados_insert ON empregados
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('owner', 'admin', 'hr_ops')
  );

CREATE POLICY empregados_update ON empregados
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('owner', 'admin', 'hr_ops')
  );

CREATE POLICY empregados_delete ON empregados
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'owner'
  );

-- EMPREGADO vê APENAS seus próprios dados
CREATE POLICY empregado_self ON empregados
  FOR SELECT USING (
    usuario_id = auth.uid()
  );

-- PROCESSOS · advogado externo só vê processos das empresas que atende
CREATE POLICY processos_select ON processos_juridicos
  FOR SELECT USING (
    (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'advogado_interno'))
    OR is_advogado_externo_de(tenant_id)
    OR is_super_admin()
  );

CREATE POLICY processos_insert ON processos_juridicos
  FOR INSERT WITH CHECK (
    is_advogado_externo_de(tenant_id)
    OR (tenant_id = auth_tenant_id() AND auth_role() IN ('advogado_interno', 'owner'))
  );

-- ANOTAÇÕES PRIVADAS · só o próprio escritório vê
CREATE POLICY anotacoes_select ON processo_anotacoes_privadas
  FOR SELECT USING (
    (privada_para = 'escritorio' AND is_advogado_externo_de(tenant_id))
    OR (privada_para = 'tenant' AND tenant_id = auth_tenant_id())
    OR autor_id = auth.uid()
  );
```

---

## 5. Funções e triggers

### Atualizar `atualizado_em` automaticamente

```sql
CREATE OR REPLACE FUNCTION set_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- aplicar em todas as tabelas que têm coluna atualizado_em:
CREATE TRIGGER set_atualizado_em_empregados BEFORE UPDATE ON empregados
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
-- ... repetir para outras tabelas
```

### Audit log automático

```sql
CREATE OR REPLACE FUNCTION auditar() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (tenant_id, usuario_id, acao, recurso_tipo, recurso_id, dados_antes, dados_depois)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_OP || '.' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- aplicar em tabelas sensíveis
CREATE TRIGGER audit_empregados AFTER INSERT OR UPDATE OR DELETE ON empregados
  FOR EACH ROW EXECUTE FUNCTION auditar();
CREATE TRIGGER audit_processos AFTER INSERT OR UPDATE OR DELETE ON processos_juridicos
  FOR EACH ROW EXECUTE FUNCTION auditar();
CREATE TRIGGER audit_folha AFTER INSERT OR UPDATE OR DELETE ON folha_holerites
  FOR EACH ROW EXECUTE FUNCTION auditar();
```

---

## 6. Seed inicial (Aurora + personagens)

Ver arquivo SQL completo `seed.sql` para inserts dos personagens e dados do universo. Resumo:

- **1 tenant**: Construtora Aurora (CNPJ 12.345.678/0001-90)
- **6 departamentos**: Operações, Engenharia, Financeiro, Comercial, Suprimentos, RH
- **20 cargos**: Eng. Civil Sr, Pedreiro, Servente, Coord. RH, etc. com CBO
- **128 empregados** (Fernando, Paula, Marcelo, etc.)
- **10 processos jurídicos** (José Roberto, Carlos Mendes, etc.)
- **4 trilhas de treinamento** (BIM, Onboarding canteiro, Liderança, Sienge)
- **24 cursos** (NR-18, NR-35, LGPD, etc.)
- **1 escritório jurídico**: Vasconcellos & Associados

---

## 7. Storage buckets (Supabase Storage)

```sql
-- buckets a criar via dashboard ou API
-- privado, acesso via signed URLs

INSERT INTO storage.buckets (id, name, public) VALUES
  ('cvs', 'cvs', false),
  ('holerites', 'holerites', false),
  ('documentos-empregado', 'documentos-empregado', false),
  ('documentos-processo', 'documentos-processo', false),
  ('logos-empresa', 'logos-empresa', true),
  ('fotos-empregado', 'fotos-empregado', false),
  ('certificados', 'certificados', false);
```

---

## 8. Próximos passos para o Codex

1. Criar projeto Supabase
2. Executar `migrations/001_extensions.sql`
3. Executar `migrations/002_enums.sql`
4. Executar `migrations/003_tabelas_principais.sql` (em ordem de FK)
5. Executar `migrations/004_rls_policies.sql`
6. Executar `migrations/005_triggers.sql`
7. Executar `seed.sql` (popular Aurora)
8. Gerar Prisma client com `npx prisma db pull` ou usar `pgtyped`
9. Validar acesso multi-tenant fazendo login com diferentes usuários

---

🤖 Oi Nora · Schema v1.0 · 2026
