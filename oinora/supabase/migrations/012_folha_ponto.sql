-- ====================================================
-- Oi Nora · Migration 012 · Folha + Ponto
-- ====================================================

-- ----------------------------------------------------
-- PONTO
-- ----------------------------------------------------
CREATE TABLE batidas_ponto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario TIMESTAMPTZ NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  local_id UUID REFERENCES locais_trabalho(id),
  coordenadas POINT,
  metodo VARCHAR(20),
  ip TEXT,
  foto_url TEXT,
  ajustada BOOLEAN DEFAULT FALSE,
  justificativa TEXT,
  ajustada_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_batidas_emp ON batidas_ponto(empregado_id, data);

CREATE TABLE espelhos_ponto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  competencia DATE NOT NULL,
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

-- ----------------------------------------------------
-- FOLHA
-- ----------------------------------------------------
CREATE TABLE folha_competencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  competencia DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberta',
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
  pdf_url TEXT,
  liberado_para_empregado BOOLEAN DEFAULT FALSE,
  visualizado_pelo_empregado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competencia_id, empregado_id)
);

CREATE TABLE folha_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  holerite_id UUID NOT NULL REFERENCES folha_holerites(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  quantidade NUMERIC(8,2),
  base_calculo_centavos BIGINT,
  valor_centavos BIGINT NOT NULL,
  origem VARCHAR(30),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_eventos_holerite ON folha_eventos(holerite_id);

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

-- ----------------------------------------------------
-- RLS
-- ----------------------------------------------------
ALTER TABLE batidas_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE espelhos_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_holerites ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_eventos ENABLE ROW LEVEL SECURITY;

-- Tabelas INSS/IRRF são públicas (não tem RLS)

CREATE POLICY batidas_select ON batidas_ponto FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin() OR empregado_id = auth_empregado_id()
);
CREATE POLICY batidas_insert ON batidas_ponto FOR INSERT WITH CHECK (
  (tenant_id = auth_tenant_id() AND empregado_id = auth_empregado_id())
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops'))
);
CREATE POLICY batidas_update ON batidas_ponto FOR UPDATE USING (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
);

CREATE POLICY espelhos_select ON espelhos_ponto FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin() OR empregado_id = auth_empregado_id()
);
CREATE POLICY espelhos_write ON espelhos_ponto FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
);

CREATE POLICY folha_comp_select ON folha_competencias FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY folha_comp_write ON folha_competencias FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
);

CREATE POLICY holerites_select ON folha_holerites FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
  OR (empregado_id = auth_empregado_id() AND liberado_para_empregado = TRUE)
);
CREATE POLICY holerites_write ON folha_holerites FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
);

CREATE POLICY eventos_select ON folha_eventos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM folha_holerites h
    WHERE h.id = holerite_id
      AND (h.tenant_id = auth_tenant_id()
           OR is_super_admin()
           OR (h.empregado_id = auth_empregado_id() AND h.liberado_para_empregado))
  )
);
CREATE POLICY eventos_write ON folha_eventos FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
);

-- ----------------------------------------------------
-- Tabela INSS 2026
-- ----------------------------------------------------
INSERT INTO tabela_inss (vigencia_inicio, faixa_inicio_centavos, faixa_fim_centavos, aliquota, deduzir_centavos) VALUES
  ('2026-01-01', 0, 159600, 0.0750, 0),
  ('2026-01-01', 159601, 291905, 0.0900, 23940),
  ('2026-01-01', 291906, 437968, 0.1200, 111512),
  ('2026-01-01', 437969, 851000, 0.1400, 199089)
ON CONFLICT DO NOTHING;

-- Tabela IRRF 2026
INSERT INTO tabela_irrf (vigencia_inicio, faixa_inicio_centavos, faixa_fim_centavos, aliquota, deduzir_centavos, deducao_dependente_centavos) VALUES
  ('2026-01-01', 0, 227664, 0.0000, 0, 18994),
  ('2026-01-01', 227665, 282665, 0.0750, 17075, 18994),
  ('2026-01-01', 282666, 375105, 0.1500, 38353, 18994),
  ('2026-01-01', 375106, 466493, 0.2250, 66468, 18994),
  ('2026-01-01', 466494, 999999999, 0.2750, 89788, 18994)
ON CONFLICT DO NOTHING;

-- Competência maio/2026 fechada
INSERT INTO folha_competencias (
  id, tenant_id, competencia, status,
  total_proventos_centavos, total_descontos_centavos, total_liquido_centavos, total_empregados,
  encargos_inss_patronal_centavos, encargos_fgts_centavos,
  fechada_em
) VALUES (
  '33333333-bbbb-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '2026-05-01', 'fechada',
  335400000, 56500000, 278900000, 7,
  67080000, 26832000,
  '2026-05-25 18:00:00-03'
)
ON CONFLICT DO NOTHING;

-- Holerites maio/2026 (apenas Roberto e Fernando como demonstração)
INSERT INTO folha_holerites (
  tenant_id, competencia_id, empregado_id,
  salario_base_centavos, total_proventos_centavos, total_descontos_centavos, total_liquido_centavos,
  inss_base_centavos, inss_desconto_centavos,
  irrf_base_centavos, irrf_desconto_centavos,
  fgts_base_centavos, fgts_centavos,
  liberado_para_empregado
) VALUES
  ('11111111-1111-4111-8111-111111111111', '33333333-bbbb-4000-8000-000000000001',
   '77777777-0001-4000-8000-000000000001', -- Roberto
   3500000, 3500000, 875000, 2625000,
   3500000, 490000,
   3010000, 385000,
   3500000, 280000,
   TRUE),
  ('11111111-1111-4111-8111-111111111111', '33333333-bbbb-4000-8000-000000000001',
   '77777777-0001-4000-8000-000000000005', -- Fernando · +18% banco de horas
   1480000, 1747000, 348000, 1399000,
   1747000, 217700,
   1529300, 130300,
   1747000, 139760,
   TRUE)
ON CONFLICT DO NOTHING;

-- Eventos dos holerites (sample)
WITH h_roberto AS (
  SELECT id FROM folha_holerites
  WHERE empregado_id = '77777777-0001-4000-8000-000000000001'
    AND competencia_id = '33333333-bbbb-4000-8000-000000000001'
), h_fernando AS (
  SELECT id FROM folha_holerites
  WHERE empregado_id = '77777777-0001-4000-8000-000000000005'
    AND competencia_id = '33333333-bbbb-4000-8000-000000000001'
)
INSERT INTO folha_eventos (tenant_id, holerite_id, codigo, descricao, tipo, valor_centavos, origem) VALUES
  ('11111111-1111-4111-8111-111111111111', (SELECT id FROM h_roberto), '001', 'Salário', 'provento', 3500000, 'folha'),
  ('11111111-1111-4111-8111-111111111111', (SELECT id FROM h_roberto), '901', 'INSS', 'desconto', 490000, 'folha'),
  ('11111111-1111-4111-8111-111111111111', (SELECT id FROM h_roberto), '902', 'IRRF', 'desconto', 385000, 'folha'),
  ('11111111-1111-4111-8111-111111111111', (SELECT id FROM h_fernando), '001', 'Salário', 'provento', 1480000, 'folha'),
  ('11111111-1111-4111-8111-111111111111', (SELECT id FROM h_fernando), '050', 'Horas extras 50% (12h banco)', 'provento', 267000, 'ponto'),
  ('11111111-1111-4111-8111-111111111111', (SELECT id FROM h_fernando), '901', 'INSS', 'desconto', 217700, 'folha'),
  ('11111111-1111-4111-8111-111111111111', (SELECT id FROM h_fernando), '902', 'IRRF', 'desconto', 130300, 'folha')
ON CONFLICT DO NOTHING;
