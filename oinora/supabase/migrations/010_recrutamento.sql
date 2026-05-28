-- ====================================================
-- Oi Nora · Migration 010 · Recrutamento (MVP 2)
-- ====================================================

-- Enums
CREATE TYPE vaga_status AS ENUM (
  'rascunho', 'aprovada', 'publicada', 'pausada', 'preenchida', 'cancelada'
);

CREATE TYPE candidato_stage AS ENUM (
  'aplicado', 'triagem', 'entrevista_recrutador', 'teste',
  'entrevista_gestor', 'proposta', 'contratado', 'recusado', 'desistiu'
);

-- ----------------------------------------------------
-- VAGAS
-- ----------------------------------------------------
CREATE TABLE vagas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
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
  modelo_trabalho VARCHAR(20),

  afirmativa BOOLEAN DEFAULT FALSE,
  publico_alvo TEXT,
  justificativa_afirmativa TEXT,

  status vaga_status NOT NULL DEFAULT 'rascunho',
  data_publicacao DATE,
  data_fechamento DATE,
  motivo_fechamento TEXT,
  contratado_empregado_id UUID REFERENCES empregados(id),

  -- coluna reservada para embeddings quando ANTHROPIC/VOYAGE estiverem ligados
  descricao_embedding VECTOR(1024),

  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);
CREATE INDEX idx_vagas_status ON vagas(tenant_id, status);
CREATE INDEX idx_vagas_publicacao ON vagas(status) WHERE status = 'publicada';

-- ----------------------------------------------------
-- CANDIDATOS (global · sem tenant_id)
-- ----------------------------------------------------
CREATE TABLE candidatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

  cv_url TEXT,
  cv_texto_extraido TEXT,
  cv_embedding VECTOR(1024),

  linkedin_url TEXT,
  portfolio_url TEXT,
  pretensao_salarial_centavos BIGINT,
  disponibilidade_inicio DATE,
  modelo_trabalho_preferencia TEXT[],

  aceitou_lgpd BOOLEAN DEFAULT FALSE,
  aceitou_lgpd_em TIMESTAMPTZ,

  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_candidatos_cpf ON candidatos(cpf);
CREATE INDEX idx_candidatos_email ON candidatos(email);
CREATE INDEX idx_candidatos_busca ON candidatos USING gin(nome_completo gin_trgm_ops);

-- ----------------------------------------------------
-- CANDIDATURA_VAGA (N:N candidato × vaga · com tenant_id)
-- ----------------------------------------------------
CREATE TABLE candidatura_vaga (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vaga_id UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,

  stage candidato_stage NOT NULL DEFAULT 'aplicado',
  score_ia NUMERIC(5,2),
  parecer_triagem TEXT,
  origem VARCHAR(30),

  data_aplicacao TIMESTAMPTZ DEFAULT NOW(),
  data_ultima_movimentacao TIMESTAMPTZ DEFAULT NOW(),
  movimentado_por UUID REFERENCES usuarios(id),

  proposta_salario_centavos BIGINT,
  proposta_enviada_em TIMESTAMPTZ,
  proposta_resposta VARCHAR(20),
  observacoes TEXT,

  UNIQUE(vaga_id, candidato_id)
);
CREATE INDEX idx_candidatura_stage ON candidatura_vaga(vaga_id, stage);
CREATE INDEX idx_candidatura_tenant ON candidatura_vaga(tenant_id);

-- ----------------------------------------------------
-- ENTREVISTAS
-- ----------------------------------------------------
CREATE TABLE entrevistas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  candidatura_id UUID NOT NULL REFERENCES candidatura_vaga(id) ON DELETE CASCADE,
  entrevistador_id UUID REFERENCES usuarios(id),
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER DEFAULT 60,
  modalidade VARCHAR(20),
  link_video TEXT,
  feedback TEXT,
  nota_geral NUMERIC(3,1),
  recomendacao VARCHAR(20),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_entrevistas_data ON entrevistas(data_hora);

-- ----------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------
CREATE TRIGGER trg_vagas_atualizado_em BEFORE UPDATE ON vagas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_candidatos_atualizado_em BEFORE UPDATE ON candidatos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_audit_vagas AFTER INSERT OR UPDATE OR DELETE ON vagas
  FOR EACH ROW EXECUTE FUNCTION auditar();
CREATE TRIGGER trg_audit_candidatura AFTER INSERT OR UPDATE OR DELETE ON candidatura_vaga
  FOR EACH ROW EXECUTE FUNCTION auditar();

-- ----------------------------------------------------
-- RLS
-- ----------------------------------------------------
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_vaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevistas ENABLE ROW LEVEL SECURITY;

-- VAGAS · membros do tenant veem; vagas publicadas tambem visiveis para candidatos anon
CREATE POLICY vagas_select_tenant ON vagas FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
-- Vagas publicadas são públicas no portal (sem auth.uid)
CREATE POLICY vagas_select_publicas ON vagas FOR SELECT
  TO anon USING (status = 'publicada');

CREATE POLICY vagas_insert ON vagas FOR INSERT WITH CHECK (
  tenant_id = auth_tenant_id()
  AND auth_role() IN ('owner', 'admin', 'recrutador_oinora', 'hr_ops')
);
CREATE POLICY vagas_update ON vagas FOR UPDATE USING (
  tenant_id = auth_tenant_id()
  AND auth_role() IN ('owner', 'admin', 'recrutador_oinora', 'hr_ops')
);
CREATE POLICY vagas_delete ON vagas FOR DELETE USING (
  tenant_id = auth_tenant_id() AND auth_role() = 'owner'
);

-- CANDIDATOS · candidato vê a si mesmo; tenants veem se tem candidatura ligada
CREATE POLICY candidatos_select ON candidatos FOR SELECT USING (
  usuario_id = auth.uid()
  OR is_super_admin()
  OR EXISTS (
    SELECT 1 FROM candidatura_vaga cv
    WHERE cv.candidato_id = candidatos.id
      AND cv.tenant_id = auth_tenant_id()
  )
);
-- Candidatos podem se cadastrar/atualizar a si mesmos
CREATE POLICY candidatos_insert ON candidatos FOR INSERT WITH CHECK (
  usuario_id = auth.uid() OR auth.uid() IS NULL
);
CREATE POLICY candidatos_update_self ON candidatos FOR UPDATE USING (
  usuario_id = auth.uid()
);

-- CANDIDATURA_VAGA · tenant-isolated; candidato vê próprias
CREATE POLICY candidatura_select ON candidatura_vaga FOR SELECT USING (
  tenant_id = auth_tenant_id()
  OR is_super_admin()
  OR EXISTS (
    SELECT 1 FROM candidatos c
    WHERE c.id = candidatura_vaga.candidato_id
      AND c.usuario_id = auth.uid()
  )
);
CREATE POLICY candidatura_insert ON candidatura_vaga FOR INSERT WITH CHECK (
  -- Candidato pode aplicar
  EXISTS (
    SELECT 1 FROM candidatos c
    WHERE c.id = candidato_id
      AND (c.usuario_id = auth.uid() OR c.usuario_id IS NULL)
  )
  -- OU tenant cria diretamente
  OR (tenant_id = auth_tenant_id()
        AND auth_role() IN ('owner', 'admin', 'recrutador_oinora', 'hr_ops'))
);
CREATE POLICY candidatura_update ON candidatura_vaga FOR UPDATE USING (
  tenant_id = auth_tenant_id()
  AND auth_role() IN ('owner', 'admin', 'recrutador_oinora', 'hr_ops')
);

-- ENTREVISTAS · tenant-isolated
CREATE POLICY entrevistas_select ON entrevistas FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY entrevistas_write ON entrevistas FOR ALL USING (
  tenant_id = auth_tenant_id()
  AND auth_role() IN ('owner', 'admin', 'recrutador_oinora', 'hr_ops', 'gestor')
) WITH CHECK (
  tenant_id = auth_tenant_id()
  AND auth_role() IN ('owner', 'admin', 'recrutador_oinora', 'hr_ops', 'gestor')
);

-- ====================================================
-- SEED · Vaga afirmativa #2026-0042 Aurora
-- ====================================================
INSERT INTO vagas (
  id, tenant_id, codigo, titulo, cargo_id, departamento_id,
  gestor_solicitante_id, descricao_completa, responsabilidades,
  requisitos_obrigatorios, requisitos_desejaveis, beneficios,
  salario_min_centavos, salario_max_centavos, jornada,
  local_trabalho_id, modelo_trabalho, afirmativa, publico_alvo,
  justificativa_afirmativa, status, data_publicacao
) VALUES (
  'aaaaaaaa-0042-4042-8042-000000000042',
  '11111111-1111-4111-8111-111111111111',
  '#2026-0042',
  'Engenheira Civil Pleno · vaga afirmativa para mulheres',
  '33333333-0001-4000-8000-000000000002', -- ENG-CIVIL-PL
  '22222222-0001-4000-8000-000000000001', -- ENG
  '77777777-0001-4000-8000-000000000004', -- Luísa
  E'Construtora Aurora está expandindo o time de engenharia da obra Sítio II e tem uma vaga aberta exclusivamente para mulheres engenheiras civis com experiência em obras residenciais de médio/grande porte.\n\nEsta é uma vaga afirmativa que faz parte do programa interno de aumentar a representatividade feminina no time técnico (atualmente 18% → meta 35% em 2027).',
  E'• Acompanhar execução de 2-3 obras residenciais simultâneas\n• Compatibilização de projetos arquitetônico/estrutural/instalações\n• Medição mensal e gestão de subempreiteiros\n• Apoio à engenheira sênior responsável (Eng. Luísa Mendonça)',
  ARRAY['CREA-MG ativo', 'Experiência mínima 5 anos em obras residenciais', 'NR-18 e NR-35 vigentes', 'Disponibilidade para Sítio II (Sete Lagoas)'],
  ARRAY['BIM (Revit/AutoCAD)', 'MS Project ou Primavera', 'Inglês intermediário', 'Pós em Gerenciamento de Obras'],
  ARRAY['Plano de saúde extensivo família', 'Carro corporativo', 'Bônus por meta de obra', 'Dia útil de aniversário'],
  900000, 1300000, '44h · 07:00-16:48 seg-sex',
  '55555555-0001-4000-8000-000000000002', 'presencial',
  TRUE, 'mulheres_eng',
  'Aumentar representatividade feminina no time técnico de engenharia conforme programa interno 2026-2027.',
  'publicada', '2026-05-15'
)
ON CONFLICT DO NOTHING;

-- Candidatas
INSERT INTO candidatos (
  id, nome_completo, cpf, data_nascimento, sexo, raca_cor,
  email, telefone, cidade, uf,
  pretensao_salarial_centavos, disponibilidade_inicio,
  aceitou_lgpd, aceitou_lgpd_em
) VALUES
  (
    'cccccccc-0001-4000-8000-000000000001',
    'Letícia Ferraz Almeida', '88811122233', '1990-09-12',
    'F', 'parda',
    'leticia.ferraz@email.com', '+5531999991111',
    'Belo Horizonte', 'MG',
    1100000, '2026-06-15',
    TRUE, '2026-05-20 10:11:00-03'
  ),
  (
    'cccccccc-0001-4000-8000-000000000002',
    'Camila Resende Oliveira', '88822233344', '1987-04-22',
    'F', 'branca',
    'camila.resende@email.com', '+5531999992222',
    'Belo Horizonte', 'MG',
    1250000, '2026-07-01',
    TRUE, '2026-05-22 14:30:00-03'
  ),
  (
    'cccccccc-0001-4000-8000-000000000003',
    'Renata Souza Carneiro', '88833344455', '1985-11-08',
    'F', 'preta',
    'renata.souza@email.com', '+5531999993333',
    'Contagem', 'MG',
    1200000, '2026-06-30',
    TRUE, '2026-05-25 09:15:00-03'
  ),
  (
    'cccccccc-0001-4000-8000-000000000004',
    'Mariana Pacheco Lopes', '88844455566', '1992-07-19',
    'F', 'parda',
    'mariana.pacheco@email.com', '+5531999994444',
    'Sete Lagoas', 'MG',
    1000000, '2026-06-01',
    TRUE, '2026-05-26 16:00:00-03'
  )
ON CONFLICT DO NOTHING;

-- Candidaturas (pipeline ATS)
INSERT INTO candidatura_vaga (
  tenant_id, vaga_id, candidato_id, stage, score_ia, parecer_triagem, origem,
  proposta_salario_centavos
) VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-0042-4042-8042-000000000042',
    'cccccccc-0001-4000-8000-000000000001',
    'proposta', 92.5,
    'Excelente match com requisitos · CREA-MG ativo, 7 anos em construção residencial, NR-18/35 em dia. Tem BIM intermediário (Revit). Pretensão dentro da faixa.',
    'linkedin', 1100000
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-0042-4042-8042-000000000042',
    'cccccccc-0001-4000-8000-000000000002',
    'entrevista_gestor', 87.0,
    'Forte experiência (10 anos), mas em obras industriais — adaptação ao segmento residencial possível.',
    'gupy', NULL
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-0042-4042-8042-000000000042',
    'cccccccc-0001-4000-8000-000000000003',
    'entrevista_recrutador', 78.5,
    'Boa formação (UFMG), 5 anos exatos de experiência. Pretensão um pouco acima da faixa.',
    'site_proprio', NULL
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-0042-4042-8042-000000000042',
    'cccccccc-0001-4000-8000-000000000004',
    'triagem', 68.0,
    'Recém-formada (3 anos de experiência), próxima ao limite mínimo. Vale entrevista por proatividade demonstrada no CV.',
    'indicacao', NULL
  )
ON CONFLICT DO NOTHING;
