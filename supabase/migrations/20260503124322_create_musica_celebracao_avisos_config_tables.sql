-- musicas_repertorio, musicas_culto, culto_paleta_cores, avisos, avisos_culto,
-- liturgia_culto, liturgia_itens, configuracoes_instituicao + RLS + RPC

-- ── update_updated_at_column helper ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── musicas_repertorio ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.musicas_repertorio (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     uuid NOT NULL REFERENCES public.igrejas(id) ON DELETE CASCADE,
  ministerio_id uuid NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  titulo        text NOT NULL,
  artista       text,
  tom           text,
  link_youtube  text,
  cifra_url     text,
  observacoes   text,
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.musicas_repertorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY mr_lider_all ON public.musicas_repertorio
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = musicas_repertorio.ministerio_id
        AND ministerio_usuarios.papel = 'lider'
        AND ministerio_usuarios.ativo = true
    )
  );

CREATE POLICY mr_membro_select ON public.musicas_repertorio
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = musicas_repertorio.ministerio_id
        AND ministerio_usuarios.ativo = true
    )
  );

-- ── musicas_culto ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.musicas_culto (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id       uuid NOT NULL REFERENCES public.eventos_escala(id) ON DELETE CASCADE,
  ministerio_id   uuid NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  musica_id       uuid REFERENCES public.musicas_repertorio(id),
  titulo_avulso   text,
  artista_avulso  text,
  link_youtube    text,
  ordem           integer NOT NULL DEFAULT 0,
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.musicas_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY mc_lider_all ON public.musicas_culto
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = musicas_culto.ministerio_id
        AND ministerio_usuarios.papel = 'lider'
        AND ministerio_usuarios.ativo = true
    )
  );

CREATE POLICY mc_membro_select ON public.musicas_culto
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = musicas_culto.ministerio_id
        AND ministerio_usuarios.ativo = true
    )
  );

-- ── culto_paleta_cores ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.culto_paleta_cores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id       uuid NOT NULL REFERENCES public.eventos_escala(id) ON DELETE CASCADE,
  ministerio_id   uuid NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  cor_primaria    text NOT NULL,
  cor_secundaria  text,
  cor_acento      text,
  observacao      text,
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

ALTER TABLE public.culto_paleta_cores ENABLE ROW LEVEL SECURITY;

CREATE POLICY cpc_lider_all ON public.culto_paleta_cores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = culto_paleta_cores.ministerio_id
        AND ministerio_usuarios.papel = 'lider'
        AND ministerio_usuarios.ativo = true
    )
  );

CREATE POLICY cpc_membro_select ON public.culto_paleta_cores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = culto_paleta_cores.ministerio_id
        AND ministerio_usuarios.ativo = true
    )
  );

CREATE POLICY cpc_voluntario_select ON public.culto_paleta_cores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.escalas e
      WHERE e.evento_escala_id = culto_paleta_cores.evento_id
        AND e.voluntario_id = auth.uid()
    )
  );

-- ── avisos ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.avisos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid REFERENCES public.igrejas(id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  conteudo    text NOT NULL DEFAULT '',
  ativo       boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY av_lider_all ON public.avisos
  FOR ALL TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role_global = ANY(ARRAY['admin','super_admin'])
    )) OR (EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.papel = 'lider'
        AND ministerio_usuarios.ativo = true
    ))
  );

CREATE POLICY av_membro_select ON public.avisos
  FOR SELECT TO authenticated
  USING (ativo = true);

-- ── avisos_culto ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.avisos_culto (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     uuid NOT NULL REFERENCES public.eventos_escala(id) ON DELETE CASCADE,
  aviso_id      uuid NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  ministerio_id uuid NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  ordem         integer NOT NULL DEFAULT 0,
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avisos_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY ac_lider_all ON public.avisos_culto
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = avisos_culto.ministerio_id
        AND ministerio_usuarios.papel = 'lider'
        AND ministerio_usuarios.ativo = true
    )
  );

CREATE POLICY ac_membro_select ON public.avisos_culto
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = avisos_culto.ministerio_id
        AND ministerio_usuarios.ativo = true
    )
  );

-- ── liturgia_culto ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.liturgia_culto (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id          uuid NOT NULL REFERENCES public.eventos_escala(id) ON DELETE CASCADE,
  ministerio_id      uuid NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  observacoes_gerais text,
  created_by         uuid REFERENCES public.profiles(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

ALTER TABLE public.liturgia_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY lc_lider_all ON public.liturgia_culto
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = liturgia_culto.ministerio_id
        AND ministerio_usuarios.papel = 'lider'
        AND ministerio_usuarios.ativo = true
    )
  );

CREATE POLICY lc_membro_select ON public.liturgia_culto
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministerio_usuarios
      WHERE ministerio_usuarios.user_id = auth.uid()
        AND ministerio_usuarios.ministerio_id = liturgia_culto.ministerio_id
        AND ministerio_usuarios.ativo = true
    )
  );

-- ── liturgia_itens ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.liturgia_itens (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liturgia_id      uuid NOT NULL REFERENCES public.liturgia_culto(id) ON DELETE CASCADE,
  ordem            integer NOT NULL DEFAULT 0,
  tipo             text NOT NULL DEFAULT 'outro',
  titulo           text NOT NULL,
  responsavel      text,
  duracao_minutos  integer,
  observacao       text,
  origem           text NOT NULL DEFAULT 'manual'
                     CHECK (origem IN ('musica','equipe','manual')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.liturgia_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY li_lider_all ON public.liturgia_itens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.liturgia_culto lc
      JOIN public.ministerio_usuarios mu ON mu.ministerio_id = lc.ministerio_id
      WHERE lc.id = liturgia_itens.liturgia_id
        AND mu.user_id = auth.uid()
        AND mu.papel = 'lider'
        AND mu.ativo = true
    )
  );

CREATE POLICY li_membro_select ON public.liturgia_itens
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.liturgia_culto lc
      JOIN public.ministerio_usuarios mu ON mu.ministerio_id = lc.ministerio_id
      WHERE lc.id = liturgia_itens.liturgia_id
        AND mu.user_id = auth.uid()
        AND mu.ativo = true
    )
  );

-- ── configuracoes_instituicao ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.configuracoes_instituicao (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid REFERENCES public.igrejas(id) ON DELETE CASCADE,
  logo_url    text,
  nome_igreja text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_instituicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY ci_auth_select ON public.configuracoes_instituicao
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ci_admin_all ON public.configuracoes_instituicao
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role_global = ANY(ARRAY['admin','super_admin'])
    )
  );

-- ── RPC: get_eligible_volunteers_for_ministry ───────────────────────────────
CREATE OR REPLACE FUNCTION public.get_eligible_volunteers_for_ministry(p_ministerio_id uuid)
RETURNS TABLE (id uuid, nome text, email text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.id, p.nome, p.email
  FROM public.profiles p
  JOIN public.igrejas i ON i.id = p.church_id
  WHERE p.church_id = (
    SELECT igreja_id FROM public.ministerios WHERE ministerios.id = p_ministerio_id
  )
    AND NOT EXISTS (
      SELECT 1 FROM public.ministerio_usuarios mu
      WHERE mu.user_id = p.id
        AND mu.ministerio_id = p_ministerio_id
        AND mu.ativo = true
    )
  ORDER BY p.nome;
$$;
