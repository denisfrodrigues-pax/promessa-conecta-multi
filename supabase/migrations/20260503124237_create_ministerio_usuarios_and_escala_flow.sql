-- ministerio_usuarios, periodos_escala, eventos_escala, evento_ministerios
-- plus new columns on escalas and ministerio_funcoes

-- ── ministerio_funcoes: add ativo + updated_at ──────────────────────────────
ALTER TABLE public.ministerio_funcoes
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ── ministerio_usuarios ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ministerio_usuarios (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id      uuid NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  papel              text NOT NULL DEFAULT 'voluntario'
                       CHECK (papel IN ('lider', 'voluntario', 'membro')),
  ativo              boolean NOT NULL DEFAULT true,
  funcao_principal_id uuid REFERENCES public.ministerio_funcoes(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ministerio_id, user_id)
);

ALTER TABLE public.ministerio_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY mu_select_own ON public.ministerio_usuarios
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY mu_select_same_ministerio ON public.ministerio_usuarios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios self
      WHERE self.user_id = auth.uid()
        AND self.ministerio_id = ministerio_usuarios.ministerio_id
        AND self.ativo = true
    )
  );

CREATE POLICY mu_insert_lider ON public.ministerio_usuarios
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY mu_update_lider ON public.ministerio_usuarios
  FOR UPDATE TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.ministerio_usuarios lider
      WHERE lider.user_id = auth.uid()
        AND lider.ministerio_id = ministerio_usuarios.ministerio_id
        AND lider.papel = 'lider'
        AND lider.ativo = true
    )) OR (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role_global = ANY(ARRAY['admin','super_admin'])
    ))
  );

CREATE POLICY mu_delete_lider ON public.ministerio_usuarios
  FOR DELETE TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.ministerio_usuarios lider
      WHERE lider.user_id = auth.uid()
        AND lider.ministerio_id = ministerio_usuarios.ministerio_id
        AND lider.papel = 'lider'
        AND lider.ativo = true
    )) OR (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role_global = ANY(ARRAY['admin','super_admin'])
    ))
  );

-- ── ministerio_voluntarios_funcoes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ministerio_voluntarios_funcoes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_voluntario_id uuid NOT NULL REFERENCES public.ministerio_usuarios(id) ON DELETE CASCADE,
  funcao_id               uuid NOT NULL REFERENCES public.ministerio_funcoes(id) ON DELETE CASCADE,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ministerio_voluntario_id, funcao_id)
);

ALTER TABLE public.ministerio_voluntarios_funcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY mvf_select_own ON public.ministerio_voluntarios_funcoes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios mu
      WHERE mu.id = ministerio_voluntarios_funcoes.ministerio_voluntario_id
        AND mu.user_id = auth.uid()
    )
  );

CREATE POLICY mvf_lider_all ON public.ministerio_voluntarios_funcoes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios mu
      JOIN public.ministerio_usuarios lider
        ON lider.ministerio_id = mu.ministerio_id
        AND lider.user_id = auth.uid()
        AND lider.papel = 'lider'
        AND lider.ativo = true
      WHERE mu.id = ministerio_voluntarios_funcoes.ministerio_voluntario_id
    )
  );

-- ── Seed ministerio_usuarios from ministerio_membros ────────────────────────
INSERT INTO public.ministerio_usuarios (ministerio_id, user_id, papel, ativo)
SELECT DISTINCT
  mm.ministerio_id,
  mm.user_id,
  CASE WHEN mm.papel = 'lider' THEN 'lider' ELSE 'voluntario' END,
  COALESCE(mm.ativo, true)
FROM public.ministerio_membros mm
ON CONFLICT (ministerio_id, user_id) DO NOTHING;

-- ── periodos_escala ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.periodos_escala (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid NOT NULL REFERENCES public.igrejas(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  mes         integer NOT NULL,
  ano         integer NOT NULL,
  status      text NOT NULL DEFAULT 'aberto',
  criado_por  uuid REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.periodos_escala ENABLE ROW LEVEL SECURITY;

CREATE POLICY pe_admin_all ON public.periodos_escala
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role_global = ANY(ARRAY['admin','super_admin'])
    )
  );

CREATE POLICY pe_lider_select ON public.periodos_escala
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.papel = 'lider'
        AND ministerio_usuarios.ativo = true
    )
  );

-- ── eventos_escala ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eventos_escala (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id     uuid NOT NULL REFERENCES public.periodos_escala(id) ON DELETE CASCADE,
  church_id      uuid NOT NULL REFERENCES public.igrejas(id) ON DELETE CASCADE,
  titulo         text NOT NULL,
  tipo           text NOT NULL DEFAULT 'culto',
  data_evento    date NOT NULL,
  horario_inicio time,
  horario_fim    time,
  descricao      text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos_escala ENABLE ROW LEVEL SECURITY;

CREATE POLICY ee_admin_all ON public.eventos_escala
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role_global = ANY(ARRAY['admin','super_admin'])
    )
  );

CREATE POLICY ee_lider_select ON public.eventos_escala
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.papel = 'lider'
        AND ministerio_usuarios.ativo = true
    )
  );

CREATE POLICY ee_membro_select ON public.eventos_escala
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ativo = true
    )
  );

-- ── evento_ministerios ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evento_ministerios (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id            uuid NOT NULL REFERENCES public.eventos_escala(id) ON DELETE CASCADE,
  ministerio_id        uuid NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  status               text NOT NULL DEFAULT 'pendente',
  notificacao_enviada  boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

ALTER TABLE public.evento_ministerios ENABLE ROW LEVEL SECURITY;

CREATE POLICY em_admin_all ON public.evento_ministerios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role_global = ANY(ARRAY['admin','super_admin'])
    )
  );

CREATE POLICY em_member_select ON public.evento_ministerios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios mu
      WHERE mu.user_id = auth.uid()
        AND mu.ministerio_id = evento_ministerios.ministerio_id
        AND mu.ativo = true
    )
  );

CREATE POLICY em_lider_update ON public.evento_ministerios
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios mu
      WHERE mu.user_id = auth.uid()
        AND mu.ministerio_id = evento_ministerios.ministerio_id
        AND mu.papel = 'lider'
        AND mu.ativo = true
    )
  );

-- ── escalas: add new columns ────────────────────────────────────────────────
ALTER TABLE public.escalas
  ADD COLUMN IF NOT EXISTS evento_escala_id uuid REFERENCES public.eventos_escala(id),
  ADD COLUMN IF NOT EXISTS voluntario_id    uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS funcao           text,
  ADD COLUMN IF NOT EXISTS horario          time,
  ADD COLUMN IF NOT EXISTS responsavel_id  uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS confirmado_em   timestamptz,
  ADD COLUMN IF NOT EXISTS justificativa   text;

-- ── Trigger: auto-fill escalas.igreja_id from profiles ─────────────────────
CREATE OR REPLACE FUNCTION public.fn_escalas_auto_igreja_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.igreja_id IS NULL THEN
    SELECT p.igreja_id INTO NEW.igreja_id
    FROM public.profiles p
    WHERE p.id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escalas_auto_igreja_id ON public.escalas;
CREATE TRIGGER trg_escalas_auto_igreja_id
  BEFORE INSERT ON public.escalas
  FOR EACH ROW EXECUTE FUNCTION public.fn_escalas_auto_igreja_id();
