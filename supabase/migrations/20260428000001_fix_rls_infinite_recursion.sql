-- Fix infinite recursion in RLS policies
-- Root cause: policies on ministerio_usuarios and profiles create circular references.
-- Solution: make helper functions SECURITY DEFINER so they bypass RLS on sub-queries.

-- 1. Make has_role SECURITY DEFINER to avoid recursion on user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 2. Make get_profile_id SECURITY DEFINER so it bypasses profiles RLS
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- 3. Create helper to check ministerio membership without triggering RLS
CREATE OR REPLACE FUNCTION public.check_ministerio_member(_user_id uuid, _ministerio_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ministerio_usuarios
    WHERE user_id = _user_id AND ministerio_id = _ministerio_id AND ativo = true
  );
$$;

-- 4. Make can_ministry SECURITY DEFINER so it bypasses RLS on all sub-queries
CREATE OR REPLACE FUNCTION public.can_ministry(_user_id uuid, _action text, _ministerio_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR (
      _action = 'read' AND (
        EXISTS (
          SELECT 1 FROM public.ministerio_usuarios
          WHERE user_id = _user_id AND ministerio_id = _ministerio_id AND ativo = true
        )
        OR EXISTS (
          SELECT 1 FROM public.ministerios m
          JOIN public.profiles p ON p.id = m.lider_id
          WHERE m.id = _ministerio_id AND p.user_id = _user_id
        )
      )
    )
    OR (
      _action = 'write' AND (
        EXISTS (
          SELECT 1 FROM public.ministerio_usuarios
          WHERE user_id = _user_id AND ministerio_id = _ministerio_id AND papel = 'lider' AND ativo = true
        )
        OR EXISTS (
          SELECT 1 FROM public.ministerios m
          JOIN public.profiles p ON p.id = m.lider_id
          WHERE m.id = _ministerio_id AND p.user_id = _user_id
        )
      )
    );
$$;

-- 5. Fix the self-recursive policy on ministerio_usuarios
DROP POLICY IF EXISTS "Ministry members can view fellow members" ON public.ministerio_usuarios;
CREATE POLICY "Ministry members can view fellow members"
  ON public.ministerio_usuarios
  FOR SELECT
  USING (check_ministerio_member(auth.uid(), ministerio_id));
