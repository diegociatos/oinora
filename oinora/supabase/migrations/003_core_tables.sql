-- ====================================================
-- Oi Nora · Migration 003 · Tabelas core (MVP 1)
-- ====================================================
-- Ordem respeita dependências de FK.

-- ----------------------------------------------------
-- 3.1 · TENANTS (empresas-clientes da Oi Nora)
-- ----------------------------------------------------
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj VARCHAR(14) UNIQUE NOT NULL,
  inscricao_estadual TEXT,
  cnae_principal TEXT,
  cct_codigo TEXT,
  fap NUMERIC(6,4),
  rat NUMERIC(4,2),
  endereco JSONB,
  contato JSONB,
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

-- ----------------------------------------------------
-- 3.2 · USUÁRIOS (extensão de auth.users)
-- ----------------------------------------------------
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(11) UNIQUE,
  telefone TEXT,
  foto_url TEXT,
  oab TEXT,
  oab_uf VARCHAR(2),
  ultimo_login TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 3.3 · TENANT_MEMBERSHIPS (N:N usuario × tenant × role)
-- ----------------------------------------------------
CREATE TABLE tenant_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role role NOT NULL,
  permissoes_extras JSONB DEFAULT '{}'::JSONB,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, tenant_id, role)
);
CREATE INDEX idx_membership_usuario ON tenant_memberships(usuario_id);
CREATE INDEX idx_membership_tenant  ON tenant_memberships(tenant_id);
CREATE INDEX idx_membership_ativo   ON tenant_memberships(usuario_id, ativo) WHERE ativo = TRUE;

-- ----------------------------------------------------
-- 3.4 · DEPARTAMENTOS (com hierarquia)
-- ----------------------------------------------------
CREATE TABLE departamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sigla VARCHAR(8),
  diretor_id UUID,
  parent_id UUID REFERENCES departamentos(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_departamentos_tenant ON departamentos(tenant_id);

-- ----------------------------------------------------
-- 3.5 · CARGOS
-- ----------------------------------------------------
CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  cbo VARCHAR(7),
  faixa_salarial_min_centavos BIGINT,
  faixa_salarial_max_centavos BIGINT,
  nivel TEXT,
  jornada_horas_semana NUMERIC(5,2),
  insalubridade_pct NUMERIC(5,2),
  periculosidade_pct NUMERIC(5,2),
  departamento_id UUID REFERENCES departamentos(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);
CREATE INDEX idx_cargos_tenant ON cargos(tenant_id);

-- ----------------------------------------------------
-- 3.6 · CENTROS DE CUSTO
-- ----------------------------------------------------
CREATE TABLE centros_custo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  departamento_id UUID REFERENCES departamentos(id),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

-- ----------------------------------------------------
-- 3.7 · LOCAIS DE TRABALHO (com geofence)
-- ----------------------------------------------------
CREATE TABLE locais_trabalho (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  endereco JSONB,
  coordenadas POINT,
  raio_metros INTEGER DEFAULT 100,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_locais_tenant ON locais_trabalho(tenant_id);

-- ----------------------------------------------------
-- 3.8 · JORNADAS
-- ----------------------------------------------------
CREATE TABLE jornadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  horas_semana NUMERIC(5,2) NOT NULL,
  configuracao JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_jornadas_tenant ON jornadas(tenant_id);

-- ----------------------------------------------------
-- 3.9 · EMPREGADOS (tabela central do MVP 1)
-- ----------------------------------------------------
CREATE TABLE empregados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  matricula VARCHAR(20) NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),

  -- dados pessoais
  nome_completo TEXT NOT NULL,
  nome_social TEXT,
  cpf VARCHAR(11) NOT NULL,
  rg TEXT,
  data_nascimento DATE NOT NULL,
  sexo VARCHAR(20),
  raca_cor VARCHAR(20),
  estado_civil VARCHAR(20),
  nacionalidade TEXT DEFAULT 'brasileira',
  pis_pasep VARCHAR(11),
  ctps_numero TEXT,
  ctps_serie TEXT,
  ctps_uf VARCHAR(2),
  titulo_eleitor TEXT,
  reservista TEXT,
  banco JSONB,

  -- contato
  email_pessoal TEXT,
  telefone_principal TEXT,
  endereco JSONB,
  contato_emergencia JSONB,

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
  jornada_id UUID REFERENCES jornadas(id),
  local_trabalho_id UUID REFERENCES locais_trabalho(id),
  status empregado_status NOT NULL DEFAULT 'ativo',

  -- saúde ocupacional
  ultimo_aso DATE,
  proximo_aso_periodico DATE,

  -- desempenho 9-Box
  nine_box_desempenho INTEGER CHECK (nine_box_desempenho BETWEEN 1 AND 3),
  nine_box_potencial INTEGER CHECK (nine_box_potencial BETWEEN 1 AND 3),

  foto_url TEXT,

  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_por UUID REFERENCES usuarios(id),

  UNIQUE(tenant_id, matricula),
  UNIQUE(tenant_id, cpf)
);
CREATE INDEX idx_empregados_tenant ON empregados(tenant_id);
CREATE INDEX idx_empregados_status ON empregados(tenant_id, status);
CREATE INDEX idx_empregados_cargo  ON empregados(cargo_id);
CREATE INDEX idx_empregados_gestor ON empregados(gestor_id);
CREATE INDEX idx_empregados_busca  ON empregados USING gin(nome_completo gin_trgm_ops);

-- FK tardia: departamentos.diretor_id → empregados.id (resolve dependência circular)
ALTER TABLE departamentos
  ADD CONSTRAINT fk_departamentos_diretor
  FOREIGN KEY (diretor_id) REFERENCES empregados(id);

-- ----------------------------------------------------
-- 3.10 · DEPENDENTES DO EMPREGADO
-- ----------------------------------------------------
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
CREATE INDEX idx_dependentes_empregado ON empregado_dependentes(empregado_id);

-- ----------------------------------------------------
-- 3.11 · DOCUMENTOS DO EMPREGADO (anexos via Storage)
-- ----------------------------------------------------
CREATE TABLE empregado_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tipo TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  validade DATE,
  enviado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_empregado_docs_tipo ON empregado_documentos(empregado_id, tipo);

-- ----------------------------------------------------
-- 3.12 · MOVIMENTAÇÕES DO EMPREGADO (histórico)
-- ----------------------------------------------------
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
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_movimentacoes_empregado ON empregado_movimentacoes(empregado_id, data_efetiva DESC);

-- ----------------------------------------------------
-- 3.13 · AUDIT LOG (LGPD)
-- ----------------------------------------------------
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  usuario_id UUID REFERENCES usuarios(id),
  acao TEXT NOT NULL,
  recurso_tipo TEXT NOT NULL,
  recurso_id UUID NOT NULL,
  dados_antes JSONB,
  dados_depois JSONB,
  ip TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_tenant   ON audit_log(tenant_id, criado_em DESC);
CREATE INDEX idx_audit_recurso  ON audit_log(recurso_tipo, recurso_id);
CREATE INDEX idx_audit_usuario  ON audit_log(usuario_id, criado_em DESC);

-- ----------------------------------------------------
-- 3.14 · NOTIFICAÇÕES
-- ----------------------------------------------------
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(30),
  titulo TEXT NOT NULL,
  mensagem TEXT,
  link TEXT,
  lida BOOLEAN DEFAULT FALSE,
  lida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notif_usuario ON notificacoes(usuario_id, lida, criado_em DESC);
