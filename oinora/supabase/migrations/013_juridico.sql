-- ====================================================
-- Oi Nora · Migration 013 · Jurídico Trabalhista
-- ====================================================

-- Enums
CREATE TYPE risco_processo AS ENUM ('remoto', 'possivel', 'provavel', 'em_analise');
CREATE TYPE fase_processo AS ENUM (
  'pre_processual', 'conhecimento', 'instrucao', 'sentenciado',
  'recurso_ordinario', 'recurso_revista', 'execucao', 'acordo', 'arquivado'
);

-- ----------------------------------------------------
-- ESCRITÓRIOS JURÍDICOS
-- ----------------------------------------------------
CREATE TABLE escritorios_juridicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social TEXT NOT NULL,
  cnpj VARCHAR(14) UNIQUE,
  responsavel_oab TEXT,
  contato JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE escritorio_tenants (
  escritorio_id UUID REFERENCES escritorios_juridicos(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  PRIMARY KEY(escritorio_id, tenant_id)
);

-- ----------------------------------------------------
-- PROCESSOS
-- ----------------------------------------------------
CREATE TABLE processos_juridicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  escritorio_id UUID REFERENCES escritorios_juridicos(id),
  advogado_responsavel_id UUID REFERENCES usuarios(id),

  cnj_numero VARCHAR(25) NOT NULL UNIQUE,
  vara TEXT NOT NULL,
  juiz_nome TEXT,
  comarca TEXT,
  uf VARCHAR(2),

  reclamante_nome TEXT NOT NULL,
  reclamante_cpf VARCHAR(11),
  reclamante_ex_empregado_id UUID REFERENCES empregados(id),
  reclamante_procurador_nome TEXT,
  reclamante_procurador_oab TEXT,

  tipo_acao TEXT,
  data_ajuizamento DATE NOT NULL,
  data_citacao DATE,
  fase fase_processo NOT NULL DEFAULT 'conhecimento',

  valor_causa_centavos BIGINT NOT NULL,
  pleitos TEXT[],

  risco risco_processo NOT NULL DEFAULT 'em_analise',
  provisao_centavos BIGINT,
  risco_definido_por UUID REFERENCES usuarios(id),
  risco_definido_em TIMESTAMPTZ,

  calc_melhor_caso_centavos BIGINT,
  calc_realista_centavos BIGINT,
  calc_pior_caso_centavos BIGINT,
  calc_atualizado_em TIMESTAMPTZ,

  resumo_embedding VECTOR(1024),

  status VARCHAR(20) DEFAULT 'ativo',

  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_processos_tenant ON processos_juridicos(tenant_id);
CREATE INDEX idx_processos_risco ON processos_juridicos(tenant_id, risco);

CREATE TABLE processo_andamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  data_evento TIMESTAMPTZ NOT NULL,
  tipo VARCHAR(30),
  titulo TEXT NOT NULL,
  descricao TEXT,
  documento_storage_path TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_andamentos ON processo_andamentos(processo_id, data_evento DESC);

CREATE TABLE processo_audiencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo VARCHAR(30),
  vara TEXT,
  sala TEXT,
  preposto_nome TEXT,
  preposto_documento TEXT,
  resultado TEXT,
  registrado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audiencias_data ON processo_audiencias(data_hora);

CREATE TABLE processo_calculo_parcelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  cenario VARCHAR(20),
  parcela TEXT NOT NULL,
  fundamento_legal TEXT,
  periodo TEXT,
  base_calculo TEXT,
  valor_centavos BIGINT NOT NULL,
  ordem INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE processo_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  tipo VARCHAR(30),
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
  privada_para VARCHAR(20),
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
  termo_url TEXT,
  homologado BOOLEAN DEFAULT FALSE,
  homologado_em DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- Helper function: advogado externo do tenant
-- ----------------------------------------------------
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
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------------------
-- Triggers
-- ----------------------------------------------------
CREATE TRIGGER trg_proc_atualizado_em BEFORE UPDATE ON processos_juridicos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_audit_processos AFTER INSERT OR UPDATE OR DELETE ON processos_juridicos
  FOR EACH ROW EXECUTE FUNCTION auditar();

-- ----------------------------------------------------
-- RLS
-- ----------------------------------------------------
ALTER TABLE escritorios_juridicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE escritorio_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_juridicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processo_andamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processo_audiencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE processo_calculo_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE processo_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processo_anotacoes_privadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE processo_acordos ENABLE ROW LEVEL SECURITY;

-- Escritórios: super_admin total, advogados do escritorio veem o próprio
CREATE POLICY escritorios_select ON escritorios_juridicos FOR SELECT USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM escritorio_tenants et WHERE et.escritorio_id = escritorios_juridicos.id AND et.tenant_id = auth_tenant_id()
  ) OR is_advogado_externo_de(auth_tenant_id())
);
CREATE POLICY escritorios_write ON escritorios_juridicos FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY esc_tenants_select ON escritorio_tenants FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin() OR is_advogado_externo_de(tenant_id)
);
CREATE POLICY esc_tenants_write ON escritorio_tenants FOR ALL USING (
  is_super_admin() OR (tenant_id = auth_tenant_id() AND auth_role() = 'owner')
) WITH CHECK (
  is_super_admin() OR (tenant_id = auth_tenant_id() AND auth_role() = 'owner')
);

-- Processos: tenant + advogado externo do tenant + advogado interno
CREATE POLICY proc_select ON processos_juridicos FOR SELECT USING (
  is_super_admin()
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'advogado_interno'))
  OR is_advogado_externo_de(tenant_id)
);
CREATE POLICY proc_insert ON processos_juridicos FOR INSERT WITH CHECK (
  is_advogado_externo_de(tenant_id)
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('advogado_interno', 'owner'))
);
CREATE POLICY proc_update ON processos_juridicos FOR UPDATE USING (
  is_advogado_externo_de(tenant_id)
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('advogado_interno', 'owner'))
);

CREATE POLICY proc_and_select ON processo_andamentos FOR SELECT USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (p.tenant_id = auth_tenant_id() OR is_advogado_externo_de(p.tenant_id) OR is_super_admin()))
);
CREATE POLICY proc_and_write ON processo_andamentos FOR ALL USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
) WITH CHECK (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
);

CREATE POLICY proc_aud_select ON processo_audiencias FOR SELECT USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (p.tenant_id = auth_tenant_id() OR is_advogado_externo_de(p.tenant_id) OR is_super_admin()))
);
CREATE POLICY proc_aud_write ON processo_audiencias FOR ALL USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
) WITH CHECK (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
);

CREATE POLICY proc_calc_select ON processo_calculo_parcelas FOR SELECT USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (p.tenant_id = auth_tenant_id() OR is_advogado_externo_de(p.tenant_id) OR is_super_admin()))
);
CREATE POLICY proc_calc_write ON processo_calculo_parcelas FOR ALL USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
) WITH CHECK (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
);

CREATE POLICY proc_doc_select ON processo_documentos FOR SELECT USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (p.tenant_id = auth_tenant_id() OR is_advogado_externo_de(p.tenant_id) OR is_super_admin()))
);
CREATE POLICY proc_doc_write ON processo_documentos FOR ALL USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
) WITH CHECK (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
);

-- Anotações privadas: só escritório vê 'escritorio', só tenant vê 'tenant'
CREATE POLICY proc_anot_select ON processo_anotacoes_privadas FOR SELECT USING (
  (privada_para = 'escritorio' AND is_advogado_externo_de(tenant_id))
  OR (privada_para = 'tenant' AND tenant_id = auth_tenant_id())
  OR autor_id = auth.uid()
);
CREATE POLICY proc_anot_write ON processo_anotacoes_privadas FOR ALL USING (
  autor_id = auth.uid() OR is_super_admin()
) WITH CHECK (autor_id = auth.uid() OR is_super_admin());

CREATE POLICY proc_ac_select ON processo_acordos FOR SELECT USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (p.tenant_id = auth_tenant_id() OR is_advogado_externo_de(p.tenant_id) OR is_super_admin()))
);
CREATE POLICY proc_ac_write ON processo_acordos FOR ALL USING (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
) WITH CHECK (
  EXISTS (SELECT 1 FROM processos_juridicos p WHERE p.id = processo_id
    AND (is_advogado_externo_de(p.tenant_id)
         OR (p.tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'advogado_interno'))))
);

-- ====================================================
-- SEED · Vasconcellos & Associados + processo José Roberto
-- ====================================================
INSERT INTO escritorios_juridicos (id, razao_social, cnpj, responsavel_oab, contato) VALUES
  ('44444444-cccc-4000-8000-000000000001', 'Vasconcellos & Associados Advocacia Trabalhista', '11222333000144',
   'OAB/MG 88.123 · Dr. Henrique Vasconcellos',
   '{"telefone":"+5531998877665","email":"henrique@vasconcellos.adv.br","endereco":"Av. Afonso Pena, 4200, sala 1502, BH/MG"}'::JSONB)
ON CONFLICT DO NOTHING;

INSERT INTO escritorio_tenants (escritorio_id, tenant_id, data_inicio) VALUES
  ('44444444-cccc-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2025-01-15')
ON CONFLICT DO NOTHING;

-- Processo José Roberto (audiência hoje 14:30)
INSERT INTO processos_juridicos (
  id, tenant_id, escritorio_id, cnj_numero, vara, juiz_nome, comarca, uf,
  reclamante_nome, reclamante_cpf, reclamante_procurador_nome, reclamante_procurador_oab,
  tipo_acao, data_ajuizamento, data_citacao, fase,
  valor_causa_centavos, pleitos,
  risco, provisao_centavos, calc_melhor_caso_centavos, calc_realista_centavos, calc_pior_caso_centavos
) VALUES (
  '55555555-dddd-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '44444444-cccc-4000-8000-000000000001',
  '0011234-56.2024.5.03.0021',
  '1ª VT Belo Horizonte', 'Dra. Mariana Lopes', 'Belo Horizonte', 'MG',
  'José Roberto Pinheiro Silva', '99988877766',
  'Dr. Carlos Eduardo Albuquerque', 'OAB/MG 95.422',
  'reclamatoria_trabalhista', '2024-11-08', '2025-01-12', 'instrucao',
  35000000,
  ARRAY['horas_extras_50', 'horas_extras_100', 'insalubridade_nr15', 'fgts_recolhimento', 'verbas_rescisorias'],
  'provavel', 18600000,
  8000000, 18600000, 35200000
)
ON CONFLICT DO NOTHING;

-- Andamentos
INSERT INTO processo_andamentos (tenant_id, processo_id, data_evento, tipo, titulo, descricao) VALUES
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   '2024-11-08 14:00:00-03', 'peticao', 'Petição inicial protocolada',
   'Reclamatória trabalhista distribuída na 1ª VT BH.'),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   '2025-01-12 09:30:00-03', 'citacao', 'Citação Construtora Aurora', NULL),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   '2025-02-20 11:00:00-03', 'peticao', 'Contestação apresentada',
   'Contestação assinada por Dr. Henrique Vasconcellos com preliminares de incompetência territorial.'),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   '2025-04-15 10:00:00-03', 'audiencia', 'Audiência inaugural (conciliação)',
   'Sem proposta de acordo. Designada instrução para 26/05.'),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   '2026-05-26 11:30:00-03', 'despacho', 'Despacho saneador',
   'Juíza designa audiência de instrução para hoje às 14:30.')
ON CONFLICT DO NOTHING;

-- Audiência hoje
INSERT INTO processo_audiencias (tenant_id, processo_id, data_hora, tipo, vara, sala, preposto_nome) VALUES
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   '2026-05-26 14:30:00-03', 'instrucao', '1ª VT BH', 'Sala 305',
   'Roberto Aurora dos Santos · Dir RH (preposto designado)')
ON CONFLICT DO NOTHING;

-- Cálculo de parcelas (cenário realista)
INSERT INTO processo_calculo_parcelas (tenant_id, processo_id, cenario, parcela, fundamento_legal, periodo, base_calculo, valor_centavos, ordem) VALUES
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   'realista', 'Horas extras 50%', 'CLT art. 7º XVI', '2020-08 a 2024-09', '2.847h × R$ 21,55', 6135210, 1),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   'realista', 'Reflexos h.e. em DSR/férias/13º', 'Súmula 264 TST', NULL, '32% sobre h.e.', 1963270, 2),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   'realista', 'Insalubridade NR-15 grau médio', 'NR-15 anexo 13', '2020-08 a 2024-09', '20% × salário mínimo', 3640000, 3),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   'realista', 'FGTS não recolhido + multa', 'Lei 8.036/90', NULL, '8% sobre verbas vincendas', 2240000, 4),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   'realista', 'Honorários sucumbência', 'CLT art. 791-A', NULL, '15% sobre valor da condenação', 2790550, 5),
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   'realista', 'Custas processuais', NULL, NULL, NULL, 1830970, 6)
ON CONFLICT DO NOTHING;

-- Anotações privadas
INSERT INTO processo_anotacoes_privadas (tenant_id, processo_id, conteudo, privada_para, autor_id) VALUES
  ('11111111-1111-4111-8111-111111111111', '55555555-dddd-4000-8000-000000000001',
   'Reclamante tem 3 condenações similares no mesmo cartório (cf. juriscloud). Histórico do juízo é desfavorável: 78% de procedência para horas extras.',
   'escritorio',
   (SELECT id FROM auth.users WHERE email = 'roberto.aurora@auroraconstrutora.com.br'))
ON CONFLICT DO NOTHING;
