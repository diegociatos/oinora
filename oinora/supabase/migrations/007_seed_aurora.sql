-- ====================================================
-- Oi Nora · Migration 007 · Seed Construtora Aurora
-- ====================================================
-- Tenant fictício para desenvolvimento e demos.
-- Usuários reais (Roberto, Carla, Fernando, etc.) só ganham vínculo
-- via tenant_memberships quando fazem signup.

-- ----------------------------------------------------
-- TENANT
-- ----------------------------------------------------
INSERT INTO tenants (
  id, razao_social, nome_fantasia, cnpj, plano, status,
  cct_codigo, fap, rat, endereco, contato,
  modulos_ativos
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Construtora Aurora Ltda',
  'Construtora Aurora',
  '12345678000190',
  'premium',
  'ativo',
  'SINTRAICCMG-CONST-CIVIL',
  1.2317,
  3.00,
  '{"logradouro":"Avenida do Contorno","numero":"6541","complemento":"sala 1801","bairro":"Funcionários","cidade":"Belo Horizonte","uf":"MG","cep":"30110042"}'::JSONB,
  '{"telefone":"+5531999991234","email":"contato@auroraconstrutora.com.br","responsavel":"Roberto Aurora"}'::JSONB,
  ARRAY['rs','gestao_pessoas','folha','ponto','juridico','treinamentos','onboarding']
)
ON CONFLICT (cnpj) DO NOTHING;

-- ----------------------------------------------------
-- DEPARTAMENTOS
-- ----------------------------------------------------
INSERT INTO departamentos (id, tenant_id, nome, sigla) VALUES
  ('22222222-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Engenharia',  'ENG'),
  ('22222222-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Operações',   'OPE'),
  ('22222222-0001-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Recursos Humanos', 'RH'),
  ('22222222-0001-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Financeiro',  'FIN'),
  ('22222222-0001-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Comercial',   'COM'),
  ('22222222-0001-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Suprimentos', 'SUP')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- CARGOS
-- ----------------------------------------------------
INSERT INTO cargos (id, tenant_id, codigo, nome, cbo, nivel,
                     faixa_salarial_min_centavos, faixa_salarial_max_centavos,
                     jornada_horas_semana, departamento_id) VALUES
  ('33333333-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'ENG-CIVIL-SR', 'Engenheiro Civil Sênior', '2142-05', 'sr',
   1200000, 1800000, 44.00, '22222222-0001-4000-8000-000000000001'),
  ('33333333-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'ENG-CIVIL-PL', 'Engenheiro Civil Pleno', '2142-05', 'pl',
   800000, 1200000, 44.00, '22222222-0001-4000-8000-000000000001'),
  ('33333333-0001-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   'DIR-ENG', 'Diretor de Engenharia', '1236-05', 'espec',
   2500000, 4500000, 44.00, '22222222-0001-4000-8000-000000000001'),
  ('33333333-0001-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
   'DIR-RH', 'Diretor de Recursos Humanos', '1232-05', 'espec',
   2200000, 4000000, 44.00, '22222222-0001-4000-8000-000000000003'),
  ('33333333-0001-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111',
   'COORD-RH', 'Coordenador de RH', '1421-10', 'pl',
   700000, 1000000, 44.00, '22222222-0001-4000-8000-000000000003'),
  ('33333333-0001-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111',
   'ANL-DP', 'Analista de Departamento Pessoal', '2524-05', 'pl',
   400000, 650000, 44.00, '22222222-0001-4000-8000-000000000003'),
  ('33333333-0001-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111',
   'PEDREIRO', 'Pedreiro', '7152-10', 'jr',
   220000, 320000, 44.00, '22222222-0001-4000-8000-000000000002'),
  ('33333333-0001-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111',
   'SERVENTE', 'Servente de Obras', '7170-20', 'jr',
   150000, 220000, 44.00, '22222222-0001-4000-8000-000000000002')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- CENTROS DE CUSTO
-- ----------------------------------------------------
INSERT INTO centros_custo (id, tenant_id, codigo, nome, departamento_id) VALUES
  ('44444444-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'ENG-001', 'Engenharia · Sede',            '22222222-0001-4000-8000-000000000001'),
  ('44444444-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'ENG-002', 'Engenharia · Obra Sítio II',   '22222222-0001-4000-8000-000000000001'),
  ('44444444-0001-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   'RH-001',  'RH · Sede',                    '22222222-0001-4000-8000-000000000003'),
  ('44444444-0001-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
   'OPE-002', 'Operações · Obra Sítio II',    '22222222-0001-4000-8000-000000000002')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- LOCAIS DE TRABALHO
-- ----------------------------------------------------
INSERT INTO locais_trabalho (id, tenant_id, nome, endereco, raio_metros) VALUES
  ('55555555-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Sede Belo Horizonte',
   '{"logradouro":"Avenida do Contorno","numero":"6541","bairro":"Funcionários","cidade":"Belo Horizonte","uf":"MG","cep":"30110042"}'::JSONB,
   50),
  ('55555555-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'Canteiro Sítio II',
   '{"logradouro":"BR-040","numero":"km 632","bairro":"Centro","cidade":"Sete Lagoas","uf":"MG","cep":"35702000"}'::JSONB,
   200)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- JORNADAS
-- ----------------------------------------------------
INSERT INTO jornadas (id, tenant_id, nome, horas_semana, configuracao) VALUES
  ('66666666-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   '44h · 08:00-17:00 seg-sex',
   44.00,
   '{"segunda":{"entrada":"08:00","almoco_inicio":"12:00","almoco_fim":"13:00","saida":"17:00"},"terca":{"entrada":"08:00","almoco_inicio":"12:00","almoco_fim":"13:00","saida":"17:00"},"quarta":{"entrada":"08:00","almoco_inicio":"12:00","almoco_fim":"13:00","saida":"17:00"},"quinta":{"entrada":"08:00","almoco_inicio":"12:00","almoco_fim":"13:00","saida":"17:00"},"sexta":{"entrada":"08:00","almoco_inicio":"12:00","almoco_fim":"13:00","saida":"17:00"}}'::JSONB),
  ('66666666-0001-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   '44h · Canteiro 07:00-16:48 seg-sex',
   44.00,
   '{"segunda":{"entrada":"07:00","almoco_inicio":"11:30","almoco_fim":"12:30","saida":"16:48"},"terca":{"entrada":"07:00","almoco_inicio":"11:30","almoco_fim":"12:30","saida":"16:48"},"quarta":{"entrada":"07:00","almoco_inicio":"11:30","almoco_fim":"12:30","saida":"16:48"},"quinta":{"entrada":"07:00","almoco_inicio":"11:30","almoco_fim":"12:30","saida":"16:48"},"sexta":{"entrada":"07:00","almoco_inicio":"11:30","almoco_fim":"12:30","saida":"16:48"}}'::JSONB)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- EMPREGADOS
-- usuario_id NULL: vínculo será criado quando o usuário fizer signup.
-- ----------------------------------------------------

-- Roberto Aurora — Diretor de RH (owner futuro)
INSERT INTO empregados (
  id, tenant_id, matricula, nome_completo, cpf, data_nascimento, sexo, raca_cor,
  estado_civil, email_pessoal, telefone_principal,
  cargo_id, departamento_id, centro_custo_id, jornada_id, local_trabalho_id,
  tipo_contrato, data_admissao, salario_centavos, status
) VALUES (
  '77777777-0001-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '0001',
  'Roberto Aurora dos Santos',
  '11111111111',
  '1972-03-15',
  'M', 'branca', 'casado',
  'roberto.aurora@auroraconstrutora.com.br',
  '+5531988880001',
  '33333333-0001-4000-8000-000000000004', -- DIR-RH
  '22222222-0001-4000-8000-000000000003', -- RH
  '44444444-0001-4000-8000-000000000003', -- RH-001
  '66666666-0001-4000-8000-000000000001',
  '55555555-0001-4000-8000-000000000001',
  'clt_efetivo', '2008-04-01', 3500000, 'ativo'
)
ON CONFLICT DO NOTHING;

-- Carla Aurora — Coordenadora de RH (admin)
INSERT INTO empregados (
  id, tenant_id, matricula, nome_completo, cpf, data_nascimento, sexo, raca_cor,
  estado_civil, email_pessoal, telefone_principal,
  cargo_id, departamento_id, centro_custo_id, gestor_id, jornada_id, local_trabalho_id,
  tipo_contrato, data_admissao, salario_centavos, status
) VALUES (
  '77777777-0001-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  '0023',
  'Carla Aurora Mendes',
  '22222222222',
  '1985-08-22',
  'F', 'parda', 'solteiro',
  'carla.aurora@auroraconstrutora.com.br',
  '+5531988880023',
  '33333333-0001-4000-8000-000000000005', -- COORD-RH
  '22222222-0001-4000-8000-000000000003',
  '44444444-0001-4000-8000-000000000003',
  '77777777-0001-4000-8000-000000000001',
  '66666666-0001-4000-8000-000000000001',
  '55555555-0001-4000-8000-000000000001',
  'clt_efetivo', '2015-02-09', 850000, 'ativo'
)
ON CONFLICT DO NOTHING;

-- Bruna Lima — Analista de DP (hr_ops)
INSERT INTO empregados (
  id, tenant_id, matricula, nome_completo, cpf, data_nascimento, sexo, raca_cor,
  estado_civil, email_pessoal, telefone_principal,
  cargo_id, departamento_id, centro_custo_id, gestor_id, jornada_id, local_trabalho_id,
  tipo_contrato, data_admissao, salario_centavos, status
) VALUES (
  '77777777-0001-4000-8000-000000000003',
  '11111111-1111-4111-8111-111111111111',
  '0047',
  'Bruna Lima Ferreira',
  '33333333333',
  '1990-11-04',
  'F', 'branca', 'casado',
  'bruna.lima@auroraconstrutora.com.br',
  '+5531988880047',
  '33333333-0001-4000-8000-000000000006', -- ANL-DP
  '22222222-0001-4000-8000-000000000003',
  '44444444-0001-4000-8000-000000000003',
  '77777777-0001-4000-8000-000000000002', -- gestora Carla
  '66666666-0001-4000-8000-000000000001',
  '55555555-0001-4000-8000-000000000001',
  'clt_efetivo', '2019-06-17', 580000, 'ativo'
)
ON CONFLICT DO NOTHING;

-- Luísa Mendonça — Diretora de Engenharia (gestor)
INSERT INTO empregados (
  id, tenant_id, matricula, nome_completo, cpf, data_nascimento, sexo, raca_cor,
  estado_civil, email_pessoal, telefone_principal,
  cargo_id, departamento_id, centro_custo_id, jornada_id, local_trabalho_id,
  tipo_contrato, data_admissao, salario_centavos, status
) VALUES (
  '77777777-0001-4000-8000-000000000004',
  '11111111-1111-4111-8111-111111111111',
  '0008',
  'Luísa Mendonça Carvalho',
  '44444444444',
  '1978-05-30',
  'F', 'branca', 'casado',
  'luisa.mendonca@auroraconstrutora.com.br',
  '+5531988880008',
  '33333333-0001-4000-8000-000000000003', -- DIR-ENG
  '22222222-0001-4000-8000-000000000001', -- ENG
  '44444444-0001-4000-8000-000000000001',
  '66666666-0001-4000-8000-000000000001',
  '55555555-0001-4000-8000-000000000001',
  'clt_efetivo', '2011-09-12', 3200000, 'ativo'
)
ON CONFLICT DO NOTHING;

-- Fernando Lacerda — Engenheiro Civil Sr ★ Estrela 9-Box (empregado)
INSERT INTO empregados (
  id, tenant_id, matricula, nome_completo, cpf, data_nascimento, sexo, raca_cor,
  estado_civil, email_pessoal, telefone_principal,
  cargo_id, departamento_id, centro_custo_id, gestor_id, jornada_id, local_trabalho_id,
  tipo_contrato, data_admissao, salario_centavos, status,
  nine_box_desempenho, nine_box_potencial
) VALUES (
  '77777777-0001-4000-8000-000000000005',
  '11111111-1111-4111-8111-111111111111',
  '0112',
  'Fernando Lacerda Costa',
  '55555555555',
  '1989-07-19',
  'M', 'parda', 'casado',
  'fernando.lacerda@auroraconstrutora.com.br',
  '+5531988880112',
  '33333333-0001-4000-8000-000000000001', -- ENG-CIVIL-SR
  '22222222-0001-4000-8000-000000000001',
  '44444444-0001-4000-8000-000000000002', -- ENG-002 Sítio II
  '77777777-0001-4000-8000-000000000004', -- gestora Luísa
  '66666666-0001-4000-8000-000000000002', -- jornada canteiro
  '55555555-0001-4000-8000-000000000002', -- Canteiro Sítio II
  'clt_efetivo', '2017-03-22', 1480000, 'ativo',
  3, 3
)
ON CONFLICT DO NOTHING;

-- Paula Marques — Coord. RH admitida HOJE (em onboarding)
INSERT INTO empregados (
  id, tenant_id, matricula, nome_completo, cpf, data_nascimento, sexo, raca_cor,
  estado_civil, email_pessoal, telefone_principal,
  cargo_id, departamento_id, centro_custo_id, gestor_id, jornada_id, local_trabalho_id,
  tipo_contrato, data_admissao, salario_centavos, status
) VALUES (
  '77777777-0001-4000-8000-000000000006',
  '11111111-1111-4111-8111-111111111111',
  '0264',
  'Paula Marques Souza',
  '66666666666',
  '1991-12-08',
  'F', 'preta', 'solteiro',
  'paula.marques@auroraconstrutora.com.br',
  '+5531988880264',
  '33333333-0001-4000-8000-000000000005', -- COORD-RH
  '22222222-0001-4000-8000-000000000003',
  '44444444-0001-4000-8000-000000000003',
  '77777777-0001-4000-8000-000000000001', -- gestor Roberto
  '66666666-0001-4000-8000-000000000001',
  '55555555-0001-4000-8000-000000000001',
  'clt_experiencia', '2026-05-26', 780000, 'ativo'
)
ON CONFLICT DO NOTHING;

-- Marcelo Andrade — Eng. Civil Pl com NR-18 vencida
INSERT INTO empregados (
  id, tenant_id, matricula, nome_completo, cpf, data_nascimento, sexo, raca_cor,
  estado_civil, email_pessoal, telefone_principal,
  cargo_id, departamento_id, centro_custo_id, gestor_id, jornada_id, local_trabalho_id,
  tipo_contrato, data_admissao, salario_centavos, status
) VALUES (
  '77777777-0001-4000-8000-000000000007',
  '11111111-1111-4111-8111-111111111111',
  '0089',
  'Marcelo Andrade Pereira',
  '77777777777',
  '1986-04-11',
  'M', 'branca', 'casado',
  'marcelo.andrade@auroraconstrutora.com.br',
  '+5531988880089',
  '33333333-0001-4000-8000-000000000002', -- ENG-CIVIL-PL
  '22222222-0001-4000-8000-000000000001',
  '44444444-0001-4000-8000-000000000002',
  '77777777-0001-4000-8000-000000000004',
  '66666666-0001-4000-8000-000000000002',
  '55555555-0001-4000-8000-000000000002',
  'clt_efetivo', '2020-08-03', 1050000, 'ativo'
)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- Atualizar diretor_id dos departamentos
-- ----------------------------------------------------
UPDATE departamentos SET diretor_id = '77777777-0001-4000-8000-000000000001'
  WHERE id = '22222222-0001-4000-8000-000000000003'; -- RH ← Roberto
UPDATE departamentos SET diretor_id = '77777777-0001-4000-8000-000000000004'
  WHERE id = '22222222-0001-4000-8000-000000000001'; -- ENG ← Luísa

-- ----------------------------------------------------
-- MOVIMENTAÇÕES: admissão de cada empregado
-- ----------------------------------------------------
INSERT INTO empregado_movimentacoes (
  empregado_id, tenant_id, tipo, data_efetiva, cargo_novo_id, departamento_novo_id, salario_novo_centavos
)
SELECT id, tenant_id, 'admissao', data_admissao, cargo_id, departamento_id, salario_centavos
FROM empregados
WHERE tenant_id = '11111111-1111-4111-8111-111111111111'
ON CONFLICT DO NOTHING;
