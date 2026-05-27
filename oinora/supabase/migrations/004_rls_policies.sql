-- ====================================================
-- Oi Nora · Migration 004 · RLS policies (MVP 1)
-- ====================================================
-- Isolamento multi-tenant via Row Level Security.
-- Princípio: NENHUMA query ANON pode atravessar tenant_id.
-- service_role bypassa RLS por design (uso em Server Actions confiáveis).

-- ----------------------------------------------------
-- Funções auxiliares (chamadas por todas as policies)
-- ----------------------------------------------------

-- Tenant ativo do usuário logado (assume único tenant ativo por sessão).
-- Multi-tenant switching virá em iteração futura via custom claim.
CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_memberships
  WHERE usuario_id = auth.uid() AND ativo = TRUE
  ORDER BY criado_em ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Role do usuário no tenant ativo.
CREATE OR REPLACE FUNCTION auth_role() RETURNS role AS $$
  SELECT role FROM tenant_memberships
  WHERE usuario_id = auth.uid()
    AND tenant_id = auth_tenant_id()
    AND ativo = TRUE
  ORDER BY criado_em ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- True se usuário tem papel super_admin em qualquer membership.
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM tenant_memberships
    WHERE usuario_id = auth.uid()
      AND role = 'super_admin'
      AND ativo = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Roles administrativos do tenant (criar/editar/deletar empregados etc.)
CREATE OR REPLACE FUNCTION auth_is_admin_tenant() RETURNS BOOLEAN AS $$
  SELECT auth_role() IN ('owner', 'admin', 'hr_ops');
$$ LANGUAGE sql STABLE;

-- Tenant_id do empregado vinculado ao usuário logado (se houver).
-- Usado para policies onde o empregado vê seus próprios dados.
CREATE OR REPLACE FUNCTION auth_empregado_id() RETURNS UUID AS $$
  SELECT id FROM empregados
  WHERE usuario_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------------------
-- Habilitar RLS em todas as tabelas
-- ----------------------------------------------------
ALTER TABLE tenants                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_custo            ENABLE ROW LEVEL SECURITY;
ALTER TABLE locais_trabalho          ENABLE ROW LEVEL SECURITY;
ALTER TABLE jornadas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE empregados               ENABLE ROW LEVEL SECURITY;
ALTER TABLE empregado_dependentes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE empregado_documentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE empregado_movimentacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes             ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- TENANTS · usuários veem o tenant onde têm membership
-- ----------------------------------------------------
CREATE POLICY tenants_select ON tenants FOR SELECT USING (
  id = auth_tenant_id()
  OR is_super_admin()
);

CREATE POLICY tenants_update ON tenants FOR UPDATE USING (
  id = auth_tenant_id() AND auth_role() = 'owner'
  OR is_super_admin()
);

-- INSERT/DELETE de tenants restrito a super_admin (uso via service_role).

-- ----------------------------------------------------
-- USUARIOS
-- ----------------------------------------------------
CREATE POLICY usuarios_select_self ON usuarios FOR SELECT USING (
  id = auth.uid()
  OR is_super_admin()
  OR EXISTS(
    SELECT 1 FROM tenant_memberships m
    WHERE m.usuario_id = usuarios.id
      AND m.tenant_id = auth_tenant_id()
  )
);

CREATE POLICY usuarios_update_self ON usuarios FOR UPDATE USING (
  id = auth.uid()
);

CREATE POLICY usuarios_insert_self ON usuarios FOR INSERT WITH CHECK (
  id = auth.uid()
);

-- ----------------------------------------------------
-- TENANT_MEMBERSHIPS · usuário vê os próprios + owner/admin vê todos do tenant
-- ----------------------------------------------------
CREATE POLICY memberships_select ON tenant_memberships FOR SELECT USING (
  usuario_id = auth.uid()
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin'))
  OR is_super_admin()
);

CREATE POLICY memberships_insert ON tenant_memberships FOR INSERT WITH CHECK (
  (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin'))
  OR is_super_admin()
);

CREATE POLICY memberships_update ON tenant_memberships FOR UPDATE USING (
  (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin'))
  OR is_super_admin()
);

CREATE POLICY memberships_delete ON tenant_memberships FOR DELETE USING (
  (tenant_id = auth_tenant_id() AND auth_role() = 'owner')
  OR is_super_admin()
);

-- ----------------------------------------------------
-- DEPARTAMENTOS, CARGOS, CENTROS_CUSTO, LOCAIS, JORNADAS
-- · padrão: leitura por qualquer membro do tenant + escrita por admin
-- ----------------------------------------------------
CREATE POLICY departamentos_select ON departamentos FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY departamentos_write ON departamentos FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

CREATE POLICY cargos_select ON cargos FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY cargos_write ON cargos FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

CREATE POLICY centros_custo_select ON centros_custo FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY centros_custo_write ON centros_custo FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

CREATE POLICY locais_trabalho_select ON locais_trabalho FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY locais_trabalho_write ON locais_trabalho FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

CREATE POLICY jornadas_select ON jornadas FOR SELECT USING (
  tenant_id = auth_tenant_id() OR is_super_admin()
);
CREATE POLICY jornadas_write ON jornadas FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

-- ----------------------------------------------------
-- EMPREGADOS
-- · admin do tenant: CRUD
-- · empregado (role): vê apenas a si mesmo
-- · gestor: vê seu time direto (heurística simples: gestor_id = própria pessoa)
-- ----------------------------------------------------
CREATE POLICY empregados_select ON empregados FOR SELECT USING (
  is_super_admin()
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops'))
  OR (tenant_id = auth_tenant_id() AND auth_role() = 'gestor'
        AND gestor_id = auth_empregado_id())
  OR usuario_id = auth.uid()
);

CREATE POLICY empregados_insert ON empregados FOR INSERT WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

CREATE POLICY empregados_update ON empregados FOR UPDATE USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

CREATE POLICY empregados_delete ON empregados FOR DELETE USING (
  tenant_id = auth_tenant_id() AND auth_role() = 'owner'
);

-- ----------------------------------------------------
-- DEPENDENTES, DOCUMENTOS, MOVIMENTAÇÕES
-- · seguem mesma regra dos empregados
-- ----------------------------------------------------
CREATE POLICY dependentes_select ON empregado_dependentes FOR SELECT USING (
  is_super_admin()
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops'))
  OR empregado_id = auth_empregado_id()
);
CREATE POLICY dependentes_write ON empregado_dependentes FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

CREATE POLICY documentos_select ON empregado_documentos FOR SELECT USING (
  is_super_admin()
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops'))
  OR empregado_id = auth_empregado_id()
);
CREATE POLICY documentos_write ON empregado_documentos FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

CREATE POLICY movimentacoes_select ON empregado_movimentacoes FOR SELECT USING (
  is_super_admin()
  OR (tenant_id = auth_tenant_id() AND auth_role() IN ('owner', 'admin', 'hr_ops'))
  OR empregado_id = auth_empregado_id()
);
CREATE POLICY movimentacoes_write ON empregado_movimentacoes FOR ALL USING (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
) WITH CHECK (
  tenant_id = auth_tenant_id() AND auth_is_admin_tenant()
);

-- ----------------------------------------------------
-- AUDIT_LOG · owner vê tudo do tenant · outros veem só as próprias ações
-- ----------------------------------------------------
CREATE POLICY audit_select ON audit_log FOR SELECT USING (
  is_super_admin()
  OR (tenant_id = auth_tenant_id() AND auth_role() = 'owner')
  OR usuario_id = auth.uid()
);

-- INSERT no audit_log feito apenas pela função auditar (SECURITY DEFINER),
-- então não precisa policy de INSERT.

-- ----------------------------------------------------
-- NOTIFICAÇÕES · usuário vê apenas as próprias
-- ----------------------------------------------------
CREATE POLICY notificacoes_select ON notificacoes FOR SELECT USING (
  usuario_id = auth.uid()
);
CREATE POLICY notificacoes_update ON notificacoes FOR UPDATE USING (
  usuario_id = auth.uid()
);
