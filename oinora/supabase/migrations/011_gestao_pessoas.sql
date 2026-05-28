-- ====================================================
-- Oi Nora · Migration 011 · Onboarding + Treinamentos + Headcount + Avaliação 9-Box
-- ====================================================

-- ----------------------------------------------------
-- ONBOARDING
-- ----------------------------------------------------
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
  categoria TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  dia_alvo INTEGER,
  obrigatorio BOOLEAN DEFAULT TRUE,
  responsavel_padrao TEXT,
  curso_id UUID,
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
  status VARCHAR(20) DEFAULT 'em_curso',
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
CREATE INDEX idx_onb_emp ON onboarding_empregado(tenant_id, status);
CREATE INDEX idx_onb_check ON onboarding_checklist(onboarding_id, concluido);

-- ----------------------------------------------------
-- TREINAMENTOS
-- ----------------------------------------------------
CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id), -- NULL = catalogo global Oi Nora
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  provedor TEXT,
  carga_horaria_horas NUMERIC(5,2),
  obrigatorio BOOLEAN DEFAULT FALSE,
  nr_codigo VARCHAR(10),
  validade_meses INTEGER,
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
  status VARCHAR(20) DEFAULT 'matriculado',
  data_matricula DATE DEFAULT CURRENT_DATE,
  data_inicio DATE,
  data_conclusao DATE,
  data_expiracao DATE,
  nota_final NUMERIC(4,2),
  percentual_concluido NUMERIC(5,2) DEFAULT 0,
  certificado_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empregado_id, curso_id)
);
CREATE INDEX idx_matr_emp ON empregado_curso_matriculas(empregado_id);
CREATE INDEX idx_matr_exp ON empregado_curso_matriculas(tenant_id, data_expiracao);

-- ----------------------------------------------------
-- HEADCOUNT
-- ----------------------------------------------------
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
  cenario VARCHAR(20) NOT NULL,
  mes DATE NOT NULL,
  total_empregados_previsto INTEGER NOT NULL,
  custo_mensal_centavos BIGINT NOT NULL,
  contratacoes_previstas INTEGER DEFAULT 0,
  desligamentos_previstos INTEGER DEFAULT 0,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, cenario, mes)
);

-- ----------------------------------------------------
-- AVALIAÇÃO 9-BOX + PDI
-- ----------------------------------------------------
CREATE TABLE ciclos_avaliacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ano INTEGER NOT NULL,
  trimestre INTEGER,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'planejado',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ciclo_id UUID NOT NULL REFERENCES ciclos_avaliacao(id) ON DELETE CASCADE,
  empregado_id UUID NOT NULL REFERENCES empregados(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES usuarios(id),
  tipo VARCHAR(20),
  nota_desempenho NUMERIC(3,1),
  nota_potencial NUMERIC(3,1),
  ponto_forte TEXT,
  ponto_desenvolver TEXT,
  feedback_aberto TEXT,
  status VARCHAR(20) DEFAULT 'rascunho',
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
  tipo VARCHAR(30),
  recurso_id UUID,
  data_inicio DATE,
  data_prazo DATE,
  status VARCHAR(20) DEFAULT 'pendente',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- RLS
-- ----------------------------------------------------
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_template_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_empregado ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilha_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empregado_curso_matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE headcount_quadro ENABLE ROW LEVEL SECURITY;
ALTER TABLE headcount_projecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_acoes ENABLE ROW LEVEL SECURITY;

-- Padrão de policy tenant-aware
CREATE POLICY onb_tpl_select ON onboarding_templates FOR SELECT USING (tenant_id = auth_tenant_id() OR is_super_admin());
CREATE POLICY onb_tpl_write ON onboarding_templates FOR ALL USING (tenant_id = auth_tenant_id() AND auth_is_admin_tenant()) WITH CHECK (tenant_id = auth_tenant_id() AND auth_is_admin_tenant());

CREATE POLICY onb_tpl_it_select ON onboarding_template_itens FOR SELECT USING (
  EXISTS (SELECT 1 FROM onboarding_templates t WHERE t.id = template_id AND (t.tenant_id = auth_tenant_id() OR is_super_admin()))
);
CREATE POLICY onb_tpl_it_write ON onboarding_template_itens FOR ALL USING (
  EXISTS (SELECT 1 FROM onboarding_templates t WHERE t.id = template_id AND t.tenant_id = auth_tenant_id() AND auth_is_admin_tenant())
) WITH CHECK (
  EXISTS (SELECT 1 FROM onboarding_templates t WHERE t.id = template_id AND t.tenant_id = auth_tenant_id())
);

CREATE POLICY onb_emp_select ON onboarding_empregado FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin() OR empregado_id = auth_empregado_id()
);
CREATE POLICY onb_emp_write ON onboarding_empregado FOR ALL USING (tenant_id = auth_tenant_id() AND auth_is_admin_tenant()) WITH CHECK (tenant_id = auth_tenant_id() AND auth_is_admin_tenant());

CREATE POLICY onb_check_select ON onboarding_checklist FOR SELECT USING (tenant_id = auth_tenant_id() OR is_super_admin());
CREATE POLICY onb_check_write ON onboarding_checklist FOR ALL USING (tenant_id = auth_tenant_id() AND auth_is_admin_tenant()) WITH CHECK (tenant_id = auth_tenant_id() AND auth_is_admin_tenant());

CREATE POLICY cursos_select ON cursos FOR SELECT USING (tenant_id IS NULL OR tenant_id = auth_tenant_id() OR is_super_admin());
CREATE POLICY cursos_write ON cursos FOR ALL USING (tenant_id = auth_tenant_id() AND auth_is_admin_tenant()) WITH CHECK (tenant_id = auth_tenant_id() AND auth_is_admin_tenant());

CREATE POLICY trilhas_select ON trilhas FOR SELECT USING (tenant_id = auth_tenant_id() OR is_super_admin());
CREATE POLICY trilhas_write ON trilhas FOR ALL USING (tenant_id = auth_tenant_id() AND auth_is_admin_tenant()) WITH CHECK (tenant_id = auth_tenant_id() AND auth_is_admin_tenant());

CREATE POLICY trilha_cursos_all ON trilha_cursos FOR ALL USING (
  EXISTS (SELECT 1 FROM trilhas t WHERE t.id = trilha_id AND t.tenant_id = auth_tenant_id())
) WITH CHECK (
  EXISTS (SELECT 1 FROM trilhas t WHERE t.id = trilha_id AND t.tenant_id = auth_tenant_id())
);

CREATE POLICY matr_select ON empregado_curso_matriculas FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin() OR empregado_id = auth_empregado_id()
);
CREATE POLICY matr_write ON empregado_curso_matriculas FOR ALL USING (tenant_id = auth_tenant_id() AND auth_is_admin_tenant()) WITH CHECK (tenant_id = auth_tenant_id() AND auth_is_admin_tenant());

CREATE POLICY hc_quadro_select ON headcount_quadro FOR SELECT USING (tenant_id = auth_tenant_id() OR is_super_admin());
CREATE POLICY hc_quadro_write ON headcount_quadro FOR ALL USING (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin')) WITH CHECK (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin'));

CREATE POLICY hc_proj_select ON headcount_projecoes FOR SELECT USING (tenant_id = auth_tenant_id() OR is_super_admin());
CREATE POLICY hc_proj_write ON headcount_projecoes FOR ALL USING (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin')) WITH CHECK (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin'));

CREATE POLICY ciclos_select ON ciclos_avaliacao FOR SELECT USING (tenant_id = auth_tenant_id() OR is_super_admin());
CREATE POLICY ciclos_write ON ciclos_avaliacao FOR ALL USING (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')) WITH CHECK (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops'));

CREATE POLICY aval_select ON avaliacoes FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
  OR empregado_id = auth_empregado_id() OR avaliador_id = auth.uid()
);
CREATE POLICY aval_write ON avaliacoes FOR ALL USING (
  tenant_id = auth_tenant_id() AND (auth_is_admin_tenant() OR avaliador_id = auth.uid())
) WITH CHECK (
  tenant_id = auth_tenant_id() AND (auth_is_admin_tenant() OR avaliador_id = auth.uid())
);

CREATE POLICY pdi_select ON pdi FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin() OR empregado_id = auth_empregado_id()
);
CREATE POLICY pdi_write ON pdi FOR ALL USING (
  tenant_id = auth_tenant_id() AND (auth_is_admin_tenant() OR empregado_id = auth_empregado_id())
) WITH CHECK (
  tenant_id = auth_tenant_id() AND (auth_is_admin_tenant() OR empregado_id = auth_empregado_id())
);

CREATE POLICY pdi_acoes_all ON pdi_acoes FOR ALL USING (
  EXISTS (SELECT 1 FROM pdi p WHERE p.id = pdi_id AND p.tenant_id = auth_tenant_id())
) WITH CHECK (
  EXISTS (SELECT 1 FROM pdi p WHERE p.id = pdi_id AND p.tenant_id = auth_tenant_id())
);

-- ====================================================
-- SEED · cursos catálogo Oi Nora + onboarding template Aurora
-- ====================================================

-- Cursos globais (tenant_id NULL = catálogo Oi Nora)
INSERT INTO cursos (id, tenant_id, titulo, categoria, provedor, carga_horaria_horas, obrigatorio, nr_codigo, validade_meses) VALUES
  ('dddddddd-0001-4000-8000-000000000001', NULL, 'NR-18 · Condições de Segurança na Construção Civil', 'nr', 'oinora_interno', 16, TRUE, 'NR-18', 24),
  ('dddddddd-0001-4000-8000-000000000002', NULL, 'NR-35 · Trabalho em Altura', 'nr', 'oinora_interno', 8, TRUE, 'NR-35', 24),
  ('dddddddd-0001-4000-8000-000000000003', NULL, 'NR-06 · Equipamento de Proteção Individual', 'nr', 'oinora_interno', 4, TRUE, 'NR-06', 36),
  ('dddddddd-0001-4000-8000-000000000004', NULL, 'NR-10 · Segurança em Instalações Elétricas', 'nr', 'oinora_interno', 40, FALSE, 'NR-10', 24),
  ('dddddddd-0001-4000-8000-000000000005', NULL, 'LGPD para profissionais de RH', 'compliance', 'oinora_interno', 2, TRUE, NULL, NULL),
  ('dddddddd-0001-4000-8000-000000000006', NULL, 'Integração Oi Nora · Bem-vindo', 'integracao', 'oinora_interno', 1, TRUE, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Cursos Aurora
INSERT INTO cursos (id, tenant_id, titulo, categoria, provedor, carga_horaria_horas, obrigatorio) VALUES
  ('dddddddd-0001-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', 'BIM com Revit · Aurora Avançado', 'sistemas', 'alura', 60, FALSE),
  ('dddddddd-0001-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'Onboarding canteiro Aurora', 'integracao', 'aurora_interno', 4, TRUE),
  ('dddddddd-0001-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', 'Liderança de pessoas técnicas', 'gestao', 'fdc', 24, FALSE),
  ('dddddddd-0001-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111', 'Sienge ERP · Operações Aurora', 'sistemas', 'aurora_interno', 16, TRUE)
ON CONFLICT DO NOTHING;

-- Trilha BIM (Fernando)
INSERT INTO trilhas (id, tenant_id, nome, descricao, cargo_alvo_id, obrigatoria, carga_horaria_total) VALUES
  ('eeeeeeee-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'BIM para Engenharia Aurora', 'Trilha de proficiência BIM/Revit para engenheiros civis.',
   '33333333-0001-4000-8000-000000000001', FALSE, 76)
ON CONFLICT DO NOTHING;

INSERT INTO trilha_cursos (trilha_id, curso_id, ordem) VALUES
  ('eeeeeeee-0001-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000010', 1),
  ('eeeeeeee-0001-4000-8000-000000000001', 'dddddddd-0001-4000-8000-000000000013', 2)
ON CONFLICT DO NOTHING;

-- Matrículas Fernando
INSERT INTO empregado_curso_matriculas (
  tenant_id, empregado_id, curso_id, trilha_id, status, data_matricula, data_inicio, percentual_concluido
) VALUES
  ('11111111-1111-4111-8111-111111111111', '77777777-0001-4000-8000-000000000005',
   'dddddddd-0001-4000-8000-000000000010', 'eeeeeeee-0001-4000-8000-000000000001',
   'em_curso', '2026-03-01', '2026-03-15', 62),
  ('11111111-1111-4111-8111-111111111111', '77777777-0001-4000-8000-000000000005',
   'dddddddd-0001-4000-8000-000000000001', NULL,
   'concluido', '2025-03-15', '2025-03-15', 100)
ON CONFLICT DO NOTHING;

UPDATE empregado_curso_matriculas SET
  data_conclusao = '2025-03-15',
  data_expiracao = '2027-03-15',
  nota_final = 9.2,
  certificado_url = 'documentos-empregado/0112/nr18_2025.pdf'
WHERE empregado_id = '77777777-0001-4000-8000-000000000005'
  AND curso_id = 'dddddddd-0001-4000-8000-000000000001';

-- Onboarding template Paula
INSERT INTO onboarding_templates (id, tenant_id, nome, cargo_id, duracao_dias) VALUES
  ('ffffffff-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Onboarding Coordenador de RH', '33333333-0001-4000-8000-000000000005', 30)
ON CONFLICT DO NOTHING;

INSERT INTO onboarding_template_itens (template_id, ordem, categoria, titulo, dia_alvo, obrigatorio, responsavel_padrao) VALUES
  ('ffffffff-0001-4000-8000-000000000001', 1, 'documentacao', 'Entrega de documentos pessoais (RG, CPF, CTPS, comprovante de residência)', 0, TRUE, 'hr_ops'),
  ('ffffffff-0001-4000-8000-000000000001', 2, 'integracao', 'Boas-vindas com Roberto + tour pela sede', 0, TRUE, 'gestor'),
  ('ffffffff-0001-4000-8000-000000000001', 3, 'integracao', 'Apresentação da equipe de RH (Carla, Bruna)', 1, TRUE, 'mentor'),
  ('ffffffff-0001-4000-8000-000000000001', 4, 'equipamentos', 'Setup do notebook e acesso aos sistemas (Sienge, eSocial gateway, Slack)', 1, TRUE, 'hr_ops'),
  ('ffffffff-0001-4000-8000-000000000001', 5, 'treinamento', 'LGPD para profissionais de RH (curso obrigatório)', 5, TRUE, 'empregado'),
  ('ffffffff-0001-4000-8000-000000000001', 6, 'integracao', 'Almoço com diretoria (Roberto e Luísa)', 7, FALSE, 'gestor'),
  ('ffffffff-0001-4000-8000-000000000001', 7, 'treinamento', 'Sienge ERP · Operações Aurora', 14, TRUE, 'empregado'),
  ('ffffffff-0001-4000-8000-000000000001', 8, 'avaliacao', 'Check-in 30 dias com Carla (mentora)', 30, TRUE, 'mentor')
ON CONFLICT DO NOTHING;

-- Paula em onboarding (admitida hoje · 26/05)
INSERT INTO onboarding_empregado (
  id, tenant_id, empregado_id, template_id, data_inicio, data_termino_previsto, mentor_id, status, percentual_concluido
) VALUES (
  '11111111-aaaa-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '77777777-0001-4000-8000-000000000006', -- Paula
  'ffffffff-0001-4000-8000-000000000001',
  '2026-05-26', '2026-06-25',
  '77777777-0001-4000-8000-000000000002', -- mentora Carla
  'em_curso', 25
)
ON CONFLICT DO NOTHING;

-- Checklist Paula (alguns concluídos)
INSERT INTO onboarding_checklist (
  tenant_id, onboarding_id, titulo, descricao, dia_alvo, data_alvo, concluido, concluido_em
) VALUES
  ('11111111-1111-4111-8111-111111111111', '11111111-aaaa-4000-8000-000000000001',
   'Entrega de documentos pessoais', 'RG, CPF, CTPS, comprovante de residência', 0, '2026-05-26', TRUE, '2026-05-26 09:30:00-03'),
  ('11111111-1111-4111-8111-111111111111', '11111111-aaaa-4000-8000-000000000001',
   'Boas-vindas com Roberto + tour', NULL, 0, '2026-05-26', TRUE, '2026-05-26 10:00:00-03'),
  ('11111111-1111-4111-8111-111111111111', '11111111-aaaa-4000-8000-000000000001',
   'Apresentação RH (Carla, Bruna)', NULL, 1, '2026-05-27', FALSE, NULL),
  ('11111111-1111-4111-8111-111111111111', '11111111-aaaa-4000-8000-000000000001',
   'Setup notebook + Sienge + Slack', NULL, 1, '2026-05-27', FALSE, NULL),
  ('11111111-1111-4111-8111-111111111111', '11111111-aaaa-4000-8000-000000000001',
   'Curso LGPD para RH', '2h via plataforma', 5, '2026-05-31', FALSE, NULL),
  ('11111111-1111-4111-8111-111111111111', '11111111-aaaa-4000-8000-000000000001',
   'Almoço com diretoria', NULL, 7, '2026-06-02', FALSE, NULL),
  ('11111111-1111-4111-8111-111111111111', '11111111-aaaa-4000-8000-000000000001',
   'Treinamento Sienge ERP', '16h', 14, '2026-06-09', FALSE, NULL),
  ('11111111-1111-4111-8111-111111111111', '11111111-aaaa-4000-8000-000000000001',
   'Check-in 30 dias com mentora', NULL, 30, '2026-06-25', FALSE, NULL)
ON CONFLICT DO NOTHING;

-- Headcount 2026 Aurora
INSERT INTO headcount_quadro (tenant_id, ciclo_ano, departamento_id, cargo_id, posicoes_autorizadas, observacao) VALUES
  ('11111111-1111-4111-8111-111111111111', 2026, '22222222-0001-4000-8000-000000000001', '33333333-0001-4000-8000-000000000001', 8, 'Engenharia · Sr'),
  ('11111111-1111-4111-8111-111111111111', 2026, '22222222-0001-4000-8000-000000000001', '33333333-0001-4000-8000-000000000002', 12, 'Engenharia · Pleno'),
  ('11111111-1111-4111-8111-111111111111', 2026, '22222222-0001-4000-8000-000000000003', '33333333-0001-4000-8000-000000000005', 3, 'Coord RH'),
  ('11111111-1111-4111-8111-111111111111', 2026, '22222222-0001-4000-8000-000000000003', '33333333-0001-4000-8000-000000000006', 4, 'Analista DP'),
  ('11111111-1111-4111-8111-111111111111', 2026, '22222222-0001-4000-8000-000000000002', '33333333-0001-4000-8000-000000000007', 80, 'Pedreiros'),
  ('11111111-1111-4111-8111-111111111111', 2026, '22222222-0001-4000-8000-000000000002', '33333333-0001-4000-8000-000000000008', 60, 'Serventes')
ON CONFLICT DO NOTHING;

-- Ciclo Q2/2026
INSERT INTO ciclos_avaliacao (id, tenant_id, nome, ano, trimestre, data_inicio, data_fim, status) VALUES
  ('22222222-aaaa-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Avaliação Q2/2026', 2026, 2, '2026-04-01', '2026-06-30', 'em_curso')
ON CONFLICT DO NOTHING;

-- Avaliação Fernando (Estrela 9-Box)
INSERT INTO avaliacoes (
  tenant_id, ciclo_id, empregado_id, avaliador_id, tipo,
  nota_desempenho, nota_potencial, ponto_forte, ponto_desenvolver, status
) VALUES
  ('11111111-1111-4111-8111-111111111111', '22222222-aaaa-4000-8000-000000000001',
   '77777777-0001-4000-8000-000000000005', -- Fernando
   (SELECT id FROM auth.users WHERE email = 'roberto.aurora@auroraconstrutora.com.br'),
   'gestor', 9.5, 9.0,
   'Excelência técnica em compatibilização de projetos. Liderança natural emergente no canteiro.',
   'Comunicação com áreas não-técnicas (financeiro, comercial). Inglês fluente para projetos internacionais futuros.',
   'calibrada')
ON CONFLICT DO NOTHING;
