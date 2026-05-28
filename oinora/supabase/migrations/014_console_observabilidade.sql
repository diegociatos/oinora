-- ====================================================
-- Oi Nora · Migration 014 · Console + IA tracking + eSocial auditoria
-- ====================================================

CREATE TABLE ia_chamadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  usuario_id UUID REFERENCES usuarios(id),
  prompt_nome TEXT NOT NULL,
  modelo TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  custo_centavos INTEGER,
  duracao_ms INTEGER,
  recurso_tipo TEXT,
  recurso_id UUID,
  input_resumo TEXT,
  output_resumo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ia_tenant ON ia_chamadas(tenant_id, criado_em DESC);

CREATE TABLE esocial_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo_evento VARCHAR(10) NOT NULL,
  empregado_id UUID REFERENCES empregados(id),
  competencia DATE,
  xml_enviado TEXT,
  protocolo TEXT,
  recibo TEXT,
  status VARCHAR(20),
  retorno_xml TEXT,
  enviado_em TIMESTAMPTZ,
  processado_em TIMESTAMPTZ,
  erro_descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_esocial_status ON esocial_eventos(tenant_id, status);

-- RLS
ALTER TABLE ia_chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE esocial_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY ia_select ON ia_chamadas FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY ia_insert ON ia_chamadas FOR INSERT WITH CHECK (
  tenant_id = auth_tenant_id() OR is_super_admin()
);

CREATE POLICY esocial_select ON esocial_eventos FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY esocial_write ON esocial_eventos FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops')
);

-- Seed eSocial eventos exemplo (S-2200 Paula = admissão hoje, S-1200 maio fechado)
INSERT INTO esocial_eventos (
  tenant_id, codigo_evento, empregado_id, competencia, status, enviado_em, protocolo, recibo
) VALUES
  ('11111111-1111-4111-8111-111111111111', 'S-2200',
   '77777777-0001-4000-8000-000000000006', -- Paula
   '2026-05-01', 'processado',
   '2026-05-23 14:30:00-03', '202605230001230456', 'REC-2026-05-23-0001'),
  ('11111111-1111-4111-8111-111111111111', 'S-1200',
   NULL, '2026-05-01', 'enviado',
   '2026-05-25 18:30:00-03', '202605250001876543', NULL)
ON CONFLICT DO NOTHING;

-- ====================================================
-- ADICIONAR Cláudia Vasconcelos como super_admin
-- ====================================================
-- Cláudia ainda não existe em auth.users — quando ela fizer signup com
-- claudia.vasconcelos@oinora.com.br, este trigger não vai existir (não tem
-- empregado com esse email pra auto-link). Vamos manter assim e Diego cria
-- manual via admin API quando precisar.

-- Por enquanto: cria função helper pra promover qualquer user a super_admin
CREATE OR REPLACE FUNCTION promover_a_super_admin(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_uid IS NULL THEN
    RETURN 'usuario nao encontrado: ' || p_email;
  END IF;

  INSERT INTO usuarios (id, email, nome_completo)
  VALUES (v_uid, p_email, split_part(p_email, '@', 1))
  ON CONFLICT (id) DO NOTHING;

  -- Cria membership super_admin no primeiro tenant (não importa qual; super_admin é cross-tenant)
  INSERT INTO tenant_memberships (usuario_id, tenant_id, role)
  SELECT v_uid, id, 'super_admin' FROM tenants LIMIT 1
  ON CONFLICT (usuario_id, tenant_id, role) DO NOTHING;

  RETURN 'promovido: ' || p_email;
END;
$$;
