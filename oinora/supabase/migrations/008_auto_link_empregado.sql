-- ====================================================
-- Oi Nora · Migration 008 · Auto-vincular signup → empregado
-- ====================================================
-- Quando um usuário se cadastra com email que bate com empregados.email_pessoal,
-- automaticamente:
--   1. Vincula empregados.usuario_id ao novo usuario
--   2. Cria tenant_memberships com role inferida pelo código do cargo
--
-- Isso elimina o passo manual de "convidar pra empresa" durante demos.
-- Em produção real (multi-tenant aberto), substituiremos por convite explícito.

-- Mapa cargo → role (heurística):
--   DIR-RH       → owner       (Roberto)
--   COORD-RH     → admin       (Carla, Paula)
--   ANL-DP       → hr_ops      (Bruna)
--   DIR-ENG      → gestor      (Luísa)
--   *outros*     → empregado   (Fernando, Marcelo, ...)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empregado_id  UUID;
  v_tenant_id     UUID;
  v_cargo_codigo  TEXT;
  v_role          role;
BEGIN
  -- 1. Criar/atualizar registro em public.usuarios
  INSERT INTO public.usuarios (id, email, nome_completo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Buscar empregado com email_pessoal correspondente
  SELECT e.id, e.tenant_id, c.codigo
    INTO v_empregado_id, v_tenant_id, v_cargo_codigo
  FROM public.empregados e
  LEFT JOIN public.cargos c ON c.id = e.cargo_id
  WHERE LOWER(e.email_pessoal) = LOWER(NEW.email)
    AND e.usuario_id IS NULL
    AND e.status = 'ativo'
  LIMIT 1;

  IF v_empregado_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3. Vincular o usuário ao empregado
  UPDATE public.empregados
     SET usuario_id = NEW.id,
         atualizado_em = NOW()
   WHERE id = v_empregado_id;

  -- 4. Inferir role
  v_role := CASE v_cargo_codigo
    WHEN 'DIR-RH'   THEN 'owner'::role
    WHEN 'COORD-RH' THEN 'admin'::role
    WHEN 'ANL-DP'   THEN 'hr_ops'::role
    WHEN 'DIR-ENG'  THEN 'gestor'::role
    ELSE                 'empregado'::role
  END;

  -- 5. Criar tenant_membership (ignora se já existe)
  INSERT INTO public.tenant_memberships (usuario_id, tenant_id, role)
  VALUES (NEW.id, v_tenant_id, v_role)
  ON CONFLICT (usuario_id, tenant_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
