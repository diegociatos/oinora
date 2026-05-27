-- ====================================================
-- Oi Nora · Migration 005 · Triggers (MVP 1)
-- ====================================================
-- Triggers globais: timestamps + audit_log automático.

-- ----------------------------------------------------
-- Função: set_atualizado_em
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION set_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas que têm coluna atualizado_em
CREATE TRIGGER trg_tenants_atualizado_em
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_empregados_atualizado_em
  BEFORE UPDATE ON empregados
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ----------------------------------------------------
-- Função: auditar
-- ----------------------------------------------------
-- Insere registro em audit_log a cada INSERT/UPDATE/DELETE.
-- Usa SECURITY DEFINER pra rodar com privilégios do owner da função.
-- A coluna usuario_id usa auth.uid() (NULL em jobs de servidor).

CREATE OR REPLACE FUNCTION auditar() RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_recurso_id UUID;
BEGIN
  -- Captura tenant_id e id do registro (tolerante a tabelas sem tenant_id)
  BEGIN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;

  BEGIN
    v_recurso_id := COALESCE(NEW.id, OLD.id);
  EXCEPTION WHEN OTHERS THEN
    v_recurso_id := NULL;
  END;

  INSERT INTO audit_log (
    tenant_id, usuario_id, acao, recurso_tipo, recurso_id,
    dados_antes, dados_depois
  ) VALUES (
    v_tenant_id,
    auth.uid(),
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    v_recurso_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabelas sensíveis (dados pessoais sob LGPD) — auditar tudo
CREATE TRIGGER trg_audit_empregados
  AFTER INSERT OR UPDATE OR DELETE ON empregados
  FOR EACH ROW EXECUTE FUNCTION auditar();

CREATE TRIGGER trg_audit_empregado_dependentes
  AFTER INSERT OR UPDATE OR DELETE ON empregado_dependentes
  FOR EACH ROW EXECUTE FUNCTION auditar();

CREATE TRIGGER trg_audit_empregado_documentos
  AFTER INSERT OR UPDATE OR DELETE ON empregado_documentos
  FOR EACH ROW EXECUTE FUNCTION auditar();

CREATE TRIGGER trg_audit_empregado_movimentacoes
  AFTER INSERT OR UPDATE OR DELETE ON empregado_movimentacoes
  FOR EACH ROW EXECUTE FUNCTION auditar();

CREATE TRIGGER trg_audit_tenants
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION auditar();

CREATE TRIGGER trg_audit_tenant_memberships
  AFTER INSERT OR UPDATE OR DELETE ON tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION auditar();

CREATE TRIGGER trg_audit_usuarios
  AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION auditar();
