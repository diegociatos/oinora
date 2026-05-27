-- ====================================================
-- Oi Nora · Migration 009 · Enriquecer seed com dados detalhados
-- ====================================================
-- Adiciona endereço, contato emergência, banco, RG, CTPS,
-- dependentes e documentos para os personagens da Aurora —
-- assim as abas Dados pessoais, Endereço, Dependentes, Documentos
-- da ficha aparecem com conteúdo real.

-- ----------------------------------------------------
-- Roberto Aurora dos Santos (DIR-RH)
-- ----------------------------------------------------
UPDATE empregados SET
  rg = '15.234.567-8 SSP/MG',
  pis_pasep = '12012345678',
  ctps_numero = '0098765',
  ctps_serie = '0001',
  ctps_uf = 'MG',
  titulo_eleitor = '1234 5678 9012',
  reservista = 'isento',
  endereco = '{"logradouro":"Rua Sergipe","numero":"1450","complemento":"apto 902","bairro":"Funcionários","cidade":"Belo Horizonte","uf":"MG","cep":"30130172"}'::JSONB,
  contato_emergencia = '{"nome":"Helena Aurora dos Santos","parentesco":"Esposa","telefone":"+5531988889911"}'::JSONB,
  banco = '{"banco":"Itaú","agencia":"0341","conta":"12345-6","tipo":"corrente","chave_pix":"roberto.aurora@auroraconstrutora.com.br"}'::JSONB,
  ultimo_aso = '2025-11-12',
  proximo_aso_periodico = '2026-11-12'
WHERE matricula = '0001' AND tenant_id = '11111111-1111-4111-8111-111111111111';

-- ----------------------------------------------------
-- Carla Aurora Mendes (COORD-RH)
-- ----------------------------------------------------
UPDATE empregados SET
  rg = '18.987.654-3 SSP/MG',
  pis_pasep = '12098765432',
  ctps_numero = '0123456',
  ctps_serie = '0002',
  ctps_uf = 'MG',
  endereco = '{"logradouro":"Avenida Afonso Pena","numero":"3500","complemento":"apto 408","bairro":"Serra","cidade":"Belo Horizonte","uf":"MG","cep":"30240114"}'::JSONB,
  contato_emergencia = '{"nome":"Marcos Aurora","parentesco":"Irmão","telefone":"+5531988880055"}'::JSONB,
  banco = '{"banco":"Bradesco","agencia":"3215","conta":"56789-0","tipo":"corrente","chave_pix":"carla.aurora@auroraconstrutora.com.br"}'::JSONB,
  ultimo_aso = '2025-09-03',
  proximo_aso_periodico = '2026-09-03'
WHERE matricula = '0023' AND tenant_id = '11111111-1111-4111-8111-111111111111';

-- ----------------------------------------------------
-- Bruna Lima Ferreira (ANL-DP)
-- ----------------------------------------------------
UPDATE empregados SET
  rg = '14.567.891-2 SSP/MG',
  pis_pasep = '12011223344',
  ctps_numero = '0234567',
  ctps_serie = '0003',
  ctps_uf = 'MG',
  endereco = '{"logradouro":"Rua Padre Marinho","numero":"512","bairro":"Santa Efigênia","cidade":"Belo Horizonte","uf":"MG","cep":"30130062"}'::JSONB,
  contato_emergencia = '{"nome":"Felipe Lima","parentesco":"Marido","telefone":"+5531988880145"}'::JSONB,
  banco = '{"banco":"Caixa","agencia":"0162","conta":"00012345-6","tipo":"poupança","chave_pix":"33333333333"}'::JSONB,
  ultimo_aso = '2025-06-21',
  proximo_aso_periodico = '2026-06-21'
WHERE matricula = '0047' AND tenant_id = '11111111-1111-4111-8111-111111111111';

-- ----------------------------------------------------
-- Luísa Mendonça Carvalho (DIR-ENG)
-- ----------------------------------------------------
UPDATE empregados SET
  rg = '16.111.222-3 SSP/MG',
  pis_pasep = '12055667788',
  ctps_numero = '0345678',
  ctps_serie = '0001',
  ctps_uf = 'MG',
  endereco = '{"logradouro":"Avenida do Contorno","numero":"5800","complemento":"cobertura","bairro":"Lourdes","cidade":"Belo Horizonte","uf":"MG","cep":"30110934"}'::JSONB,
  contato_emergencia = '{"nome":"Eduardo Carvalho","parentesco":"Marido","telefone":"+5531988880099"}'::JSONB,
  banco = '{"banco":"Itaú","agencia":"0341","conta":"45678-9","tipo":"corrente","chave_pix":"luisa.mendonca@auroraconstrutora.com.br"}'::JSONB,
  ultimo_aso = '2025-10-15',
  proximo_aso_periodico = '2026-10-15'
WHERE matricula = '0008' AND tenant_id = '11111111-1111-4111-8111-111111111111';

-- ----------------------------------------------------
-- Fernando Lacerda Costa (ENG-CIVIL-SR · ★ Estrela)
-- ----------------------------------------------------
UPDATE empregados SET
  rg = '17.456.789-1 SSP/MG',
  pis_pasep = '12099887766',
  ctps_numero = '0456789',
  ctps_serie = '0002',
  ctps_uf = 'MG',
  titulo_eleitor = '4567 8901 2345',
  reservista = 'CDI · 1ª categoria · 2008',
  endereco = '{"logradouro":"Rua Aimorés","numero":"2150","complemento":"apto 1203","bairro":"Lourdes","cidade":"Belo Horizonte","uf":"MG","cep":"30140072"}'::JSONB,
  contato_emergencia = '{"nome":"Beatriz Lacerda Costa","parentesco":"Esposa","telefone":"+5531988880112"}'::JSONB,
  banco = '{"banco":"Nubank","agencia":"0001","conta":"98765432-1","tipo":"corrente","chave_pix":"fernando.lacerda@auroraconstrutora.com.br"}'::JSONB,
  ultimo_aso = '2025-12-08',
  proximo_aso_periodico = '2026-12-08'
WHERE matricula = '0112' AND tenant_id = '11111111-1111-4111-8111-111111111111';

-- ----------------------------------------------------
-- Paula Marques Souza (admitida hoje)
-- ----------------------------------------------------
UPDATE empregados SET
  rg = '19.876.543-2 SSP/MG',
  pis_pasep = '12077665544',
  ctps_numero = '0567890',
  ctps_serie = '0001',
  ctps_uf = 'SP',
  endereco = '{"logradouro":"Rua Aarão Reis","numero":"330","complemento":"apto 504","bairro":"Centro","cidade":"Belo Horizonte","uf":"MG","cep":"30130120"}'::JSONB,
  contato_emergencia = '{"nome":"Camila Souza","parentesco":"Irmã","telefone":"+5531988880264"}'::JSONB,
  banco = '{"banco":"Inter","agencia":"0001","conta":"11122233-4","tipo":"corrente","chave_pix":"+5531988880264"}'::JSONB,
  ultimo_aso = '2026-05-23',
  proximo_aso_periodico = '2027-05-23'
WHERE matricula = '0264' AND tenant_id = '11111111-1111-4111-8111-111111111111';

-- ----------------------------------------------------
-- Marcelo Andrade Pereira (NR-18 vencida)
-- ----------------------------------------------------
UPDATE empregados SET
  rg = '13.222.333-4 SSP/MG',
  pis_pasep = '12044332211',
  ctps_numero = '0678901',
  ctps_serie = '0003',
  ctps_uf = 'MG',
  endereco = '{"logradouro":"Rua Alagoas","numero":"890","bairro":"Funcionários","cidade":"Belo Horizonte","uf":"MG","cep":"30130168"}'::JSONB,
  contato_emergencia = '{"nome":"Joana Andrade","parentesco":"Mãe","telefone":"+5531988880199"}'::JSONB,
  banco = '{"banco":"Santander","agencia":"4567","conta":"33445566-7","tipo":"corrente","chave_pix":"77777777777"}'::JSONB,
  ultimo_aso = '2025-04-10',
  proximo_aso_periodico = '2026-04-10' -- também vencido para destaque
WHERE matricula = '0089' AND tenant_id = '11111111-1111-4111-8111-111111111111';

-- ----------------------------------------------------
-- DEPENDENTES
-- ----------------------------------------------------

-- Fernando (mat 0112): 2 filhos
INSERT INTO empregado_dependentes (
  empregado_id, tenant_id, nome_completo, cpf, data_nascimento,
  parentesco, ir_dependente, salario_familia, plano_saude
) VALUES
  (
    '77777777-0001-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'Heitor Lacerda Costa', '90011220033', '2018-04-12',
    'Filho', TRUE, TRUE, TRUE
  ),
  (
    '77777777-0001-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'Alice Lacerda Costa', '90011330044', '2021-09-30',
    'Filha', TRUE, TRUE, TRUE
  ),
  (
    '77777777-0001-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'Beatriz Lacerda Costa', '88001234567', '1991-03-22',
    'Cônjuge', FALSE, FALSE, TRUE
  )
ON CONFLICT DO NOTHING;

-- Roberto (mat 0001): esposa + 2 filhos
INSERT INTO empregado_dependentes (
  empregado_id, tenant_id, nome_completo, cpf, data_nascimento,
  parentesco, ir_dependente, salario_familia, plano_saude
) VALUES
  (
    '77777777-0001-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Helena Aurora dos Santos', '70010101010', '1974-07-08',
    'Cônjuge', TRUE, FALSE, TRUE
  ),
  (
    '77777777-0001-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Pedro Aurora dos Santos', '70020202020', '2005-02-14',
    'Filho', TRUE, FALSE, TRUE
  )
ON CONFLICT DO NOTHING;

-- Marcelo (mat 0089): 1 filho
INSERT INTO empregado_dependentes (
  empregado_id, tenant_id, nome_completo, cpf, data_nascimento,
  parentesco, ir_dependente, salario_familia, plano_saude
) VALUES
  (
    '77777777-0001-4000-8000-000000000007',
    '11111111-1111-4111-8111-111111111111',
    'Lucas Andrade Pereira', '95001112233', '2019-11-05',
    'Filho', TRUE, TRUE, TRUE
  )
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- DOCUMENTOS (storage_path fictício — upload entra no MVP futuro)
-- ----------------------------------------------------

-- Fernando: NR-18 válida, NR-35 válida, ASO em dia, RG, CTPS
INSERT INTO empregado_documentos (
  empregado_id, tenant_id, tipo, nome_arquivo, storage_path, validade, criado_em
) VALUES
  (
    '77777777-0001-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'aso', 'ASO_periodico_2025-12.pdf',
    'documentos-empregado/0112/aso_periodico_2025.pdf',
    '2026-12-08', '2025-12-08 09:14:00-03'
  ),
  (
    '77777777-0001-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'certificado_nr18', 'NR-18_Fernando_2025.pdf',
    'documentos-empregado/0112/nr18_2025.pdf',
    '2027-03-15', '2025-03-15 14:00:00-03'
  ),
  (
    '77777777-0001-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'certificado_nr35', 'NR-35_Fernando_2025.pdf',
    'documentos-empregado/0112/nr35_2025.pdf',
    '2027-03-15', '2025-03-15 14:30:00-03'
  ),
  (
    '77777777-0001-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'rg', 'RG_Fernando_Lacerda.jpg',
    'documentos-empregado/0112/rg.jpg',
    NULL, '2017-03-22 10:00:00-03'
  ),
  (
    '77777777-0001-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'ctps', 'CTPS_Fernando_Lacerda.pdf',
    'documentos-empregado/0112/ctps.pdf',
    NULL, '2017-03-22 10:00:00-03'
  )
ON CONFLICT DO NOTHING;

-- Marcelo: NR-18 VENCIDA (destaque do caso de uso)
INSERT INTO empregado_documentos (
  empregado_id, tenant_id, tipo, nome_arquivo, storage_path, validade, criado_em
) VALUES
  (
    '77777777-0001-4000-8000-000000000007',
    '11111111-1111-4111-8111-111111111111',
    'aso', 'ASO_admissional_2020.pdf',
    'documentos-empregado/0089/aso_admissional.pdf',
    NULL, '2020-08-03 09:00:00-03'
  ),
  (
    '77777777-0001-4000-8000-000000000007',
    '11111111-1111-4111-8111-111111111111',
    'certificado_nr18', 'NR-18_Marcelo_2024.pdf',
    'documentos-empregado/0089/nr18_2024.pdf',
    '2026-05-13', '2024-05-13 14:00:00-03' -- vencida há 14 dias!
  )
ON CONFLICT DO NOTHING;

-- Roberto: RG + CTPS
INSERT INTO empregado_documentos (
  empregado_id, tenant_id, tipo, nome_arquivo, storage_path, validade, criado_em
) VALUES
  (
    '77777777-0001-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'rg', 'RG_Roberto.jpg',
    'documentos-empregado/0001/rg.jpg',
    NULL, '2008-04-01 09:00:00-03'
  ),
  (
    '77777777-0001-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'aso', 'ASO_periodico_2025-11.pdf',
    'documentos-empregado/0001/aso_2025.pdf',
    '2026-11-12', '2025-11-12 10:30:00-03'
  )
ON CONFLICT DO NOTHING;
