-- === MIGRATION: 20251206155128_cee51c08-529e-4921-a148-ed3fd54162a1.sql ===
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'lider', 'voluntario', 'membro', 'visitante');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('ativo', 'inativo', 'pendente');

-- Create enum for group visibility
CREATE TYPE public.group_visibility AS ENUM ('publica', 'privada');

-- Create enum for participant status
CREATE TYPE public.participant_status AS ENUM ('ativo', 'saida', 'pendente');

-- Create enum for scale status
CREATE TYPE public.scale_status AS ENUM ('confirmado', 'pendente', 'ausente');

-- Create enum for communication type
CREATE TYPE public.communication_type AS ENUM ('push', 'whatsapp', 'email');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  foto_url TEXT DEFAULT '/perfil_placeholder.png',
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status public.user_status DEFAULT 'ativo',
  preferencias_notificacao JSONB DEFAULT '{"push": true, "email": true, "whatsapp": false}'::jsonb,
  endereco TEXT,
  data_nascimento DATE,
  sexo TEXT,
  estado_civil TEXT,
  observacoes_privadas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'membro',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Ministérios table
CREATE TABLE public.ministerios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  contato TEXT,
  lider_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grupos (Pequenos Grupos / Células)
CREATE TABLE public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  lider_id UUID REFERENCES public.profiles(id),
  dia_semana TEXT,
  horario TEXT,
  local TEXT,
  capacidade INTEGER DEFAULT 20,
  visibilidade public.group_visibility DEFAULT 'publica',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grupos Participantes
CREATE TABLE public.grupos_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID REFERENCES public.grupos(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status public.participant_status DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(grupo_id, usuario_id)
);

-- Escalas
CREATE TABLE public.escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id UUID REFERENCES public.ministerios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  turno TEXT,
  funcao TEXT NOT NULL,
  voluntario_id UUID REFERENCES public.profiles(id),
  status public.scale_status DEFAULT 'pendente',
  created_by UUID REFERENCES public.profiles(id),
  justificativa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Turmas Infantil
CREATE TABLE public.turmas_infantil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  faixa_etaria TEXT,
  responsavel_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crianças
CREATE TABLE public.criancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  responsavel_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data_nascimento DATE,
  alergias TEXT,
  autorizacao_foto BOOLEAN DEFAULT false,
  turma_id UUID REFERENCES public.turmas_infantil(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Eventos
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  local TEXT,
  vagas INTEGER,
  imagem_url TEXT DEFAULT '/cover_evento_placeholder.png',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inscrições em Eventos
CREATE TABLE public.eventos_inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'confirmado',
  UNIQUE(evento_id, usuario_id)
);

-- Avisos
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  criado_por UUID REFERENCES public.profiles(id),
  data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  publico BOOLEAN DEFAULT true,
  segmentos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Presenças
CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia_id UUID NOT NULL,
  referencia_tipo TEXT NOT NULL,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data DATE DEFAULT CURRENT_DATE,
  presente BOOLEAN DEFAULT true,
  marcado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pedidos de Oração
CREATE TABLE public.pedidos_oracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.profiles(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  anonimo BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Logs de Comunicação
CREATE TABLE public.logs_comunicacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.communication_type NOT NULL,
  destinatarios JSONB DEFAULT '[]'::jsonb,
  conteudo TEXT NOT NULL,
  status TEXT DEFAULT 'enviado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configurações da Instituição
CREATE TABLE public.configuracoes_instituicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_igreja TEXT DEFAULT 'Igreja da Promessa',
  cores JSONB DEFAULT '{"primary": "#1e3a5f", "secondary": "#c9a227", "accent": "#2d5a87"}'::jsonb,
  logo_url TEXT DEFAULT '/logo_placeholder.png',
  logo_monochrome_url TEXT DEFAULT '/logo_monochrome_placeholder.png',
  banner_home_url TEXT DEFAULT '/banner_home_placeholder.png',
  banner_sou_novo_url TEXT DEFAULT '/banner_sou_novo_placeholder.png',
  favicon_url TEXT DEFAULT '/favicon_placeholder.png',
  chave_whatsapp TEXT,
  urls_transmissao JSONB DEFAULT '{"youtube": "", "instagram": ""}'::jsonb,
  pix_info JSONB DEFAULT '{"chave": "", "nome": "", "banco": ""}'::jsonb,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Logs de Auditoria
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministerios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_infantil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_oracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_comunicacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_instituicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's profile id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Trigger function for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'full_name', 'Novo Membro'),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'membro');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ministerios_updated_at BEFORE UPDATE ON public.ministerios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grupos_updated_at BEFORE UPDATE ON public.grupos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_escalas_updated_at BEFORE UPDATE ON public.escalas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_turmas_infantil_updated_at BEFORE UPDATE ON public.turmas_infantil FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_criancas_updated_at BEFORE UPDATE ON public.criancas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_avisos_updated_at BEFORE UPDATE ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pedidos_oracao_updated_at BEFORE UPDATE ON public.pedidos_oracao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_configuracoes_instituicao_updated_at BEFORE UPDATE ON public.configuracoes_instituicao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (read-only for users, admin manages)
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ministerios
CREATE POLICY "Anyone authenticated can view ministerios" ON public.ministerios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ministerios" ON public.ministerios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for grupos
CREATE POLICY "Anyone authenticated can view public grupos" ON public.grupos FOR SELECT TO authenticated USING (visibilidade = 'publica' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "Admins and leaders can manage grupos" ON public.grupos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- RLS Policies for grupos_participantes
CREATE POLICY "Users can view their participations" ON public.grupos_participantes FOR SELECT TO authenticated USING (usuario_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "Users can request to join grupos" ON public.grupos_participantes FOR INSERT TO authenticated WITH CHECK (usuario_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Admins and leaders can manage participantes" ON public.grupos_participantes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- RLS Policies for escalas
CREATE POLICY "Voluntarios can view their escalas" ON public.escalas FOR SELECT TO authenticated USING (voluntario_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "Voluntarios can update their escalas status" ON public.escalas FOR UPDATE TO authenticated USING (voluntario_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Admins and leaders can manage escalas" ON public.escalas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- RLS Policies for turmas_infantil
CREATE POLICY "Anyone authenticated can view turmas" ON public.turmas_infantil FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage turmas" ON public.turmas_infantil FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for criancas
CREATE POLICY "Responsaveis can view their criancas" ON public.criancas FOR SELECT TO authenticated USING (responsavel_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Responsaveis can manage their criancas" ON public.criancas FOR ALL TO authenticated USING (responsavel_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for eventos
CREATE POLICY "Anyone authenticated can view eventos" ON public.eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage eventos" ON public.eventos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for eventos_inscricoes
CREATE POLICY "Users can view their inscricoes" ON public.eventos_inscricoes FOR SELECT TO authenticated USING (usuario_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can inscribe themselves" ON public.eventos_inscricoes FOR INSERT TO authenticated WITH CHECK (usuario_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Users can cancel their inscricoes" ON public.eventos_inscricoes FOR DELETE TO authenticated USING (usuario_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Admins can manage inscricoes" ON public.eventos_inscricoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for avisos
CREATE POLICY "Anyone authenticated can view public avisos" ON public.avisos FOR SELECT TO authenticated USING (publico = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage avisos" ON public.avisos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for presencas
CREATE POLICY "Users can view their presencas" ON public.presencas FOR SELECT TO authenticated USING (usuario_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));
CREATE POLICY "Leaders and admins can manage presencas" ON public.presencas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'));

-- RLS Policies for pedidos_oracao
CREATE POLICY "Users can view their own and anonymous pedidos" ON public.pedidos_oracao FOR SELECT TO authenticated USING (usuario_id = public.get_profile_id(auth.uid()) OR anonimo = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create pedidos" ON public.pedidos_oracao FOR INSERT TO authenticated WITH CHECK (usuario_id = public.get_profile_id(auth.uid()) OR anonimo = true);
CREATE POLICY "Users can update their pedidos" ON public.pedidos_oracao FOR UPDATE TO authenticated USING (usuario_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Admins can manage pedidos" ON public.pedidos_oracao FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for logs_comunicacao
CREATE POLICY "Admins can view logs" ON public.logs_comunicacao FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert logs" ON public.logs_comunicacao FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for configuracoes_instituicao
CREATE POLICY "Anyone authenticated can view configuracoes" ON public.configuracoes_instituicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage configuracoes" ON public.configuracoes_instituicao FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default configuration
INSERT INTO public.configuracoes_instituicao (nome_igreja) VALUES ('Igreja da Promessa');

-- === MIGRATION: 20251208194604_3c34ff09-58ff-491d-8790-b52e768f74cd.sql ===
-- Create new enum for general escala status
CREATE TYPE public.escala_status_geral AS ENUM ('planejada', 'ativa', 'concluida');

-- Add new columns to escalas table
ALTER TABLE public.escalas
ADD COLUMN IF NOT EXISTS horario text,
ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS status_geral escala_status_geral DEFAULT 'planejada';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_escalas_ministerio_data ON public.escalas(ministerio_id, data);
CREATE INDEX IF NOT EXISTS idx_escalas_responsavel ON public.escalas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_escalas_voluntario ON public.escalas(voluntario_id);
CREATE INDEX IF NOT EXISTS idx_escalas_status_geral ON public.escalas(status_geral);

-- === MIGRATION: 20251208204847_1942b773-0fdc-4776-a3ce-6fdf9aa1737b.sql ===
-- Add ativo column to ministerios table
ALTER TABLE public.ministerios 
ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- === MIGRATION: 20251208212828_022a90c8-2360-44dd-9e3e-338a13778be2.sql ===
-- Create ministerio_voluntarios table
CREATE TABLE public.ministerio_voluntarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ministerio_id, user_id)
);

-- Enable RLS
ALTER TABLE public.ministerio_voluntarios ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins can manage ministerio_voluntarios"
ON public.ministerio_voluntarios
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Leaders: can manage volunteers of their ministries
CREATE POLICY "Leaders can manage their ministry volunteers"
ON public.ministerio_voluntarios
FOR ALL
USING (
  has_role(auth.uid(), 'lider') AND
  ministerio_id IN (
    SELECT id FROM public.ministerios WHERE lider_id = get_profile_id(auth.uid())
  )
);

-- Volunteers: can view their own records
CREATE POLICY "Users can view their own volunteer records"
ON public.ministerio_voluntarios
FOR SELECT
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_ministerio_voluntarios_updated_at
BEFORE UPDATE ON public.ministerio_voluntarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- === MIGRATION: 20251208221623_8e6ae589-5cee-4cca-be6c-6d77c44cb766.sql ===
-- Create table ministerio_funcoes
CREATE TABLE public.ministerio_funcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministerio_id UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ministerio_id, nome)
);

-- Enable RLS
ALTER TABLE public.ministerio_funcoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin: full access
CREATE POLICY "Admins can manage ministerio_funcoes"
ON public.ministerio_funcoes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Leader: can read/manage functions of their own ministry
CREATE POLICY "Leaders can manage their ministry functions"
ON public.ministerio_funcoes
FOR ALL
USING (
  has_role(auth.uid(), 'lider'::app_role) 
  AND ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = get_profile_id(auth.uid())
  )
);

-- Authenticated users can read active functions
CREATE POLICY "Authenticated users can view active functions"
ON public.ministerio_funcoes
FOR SELECT
USING (ativo = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lider'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ministerio_funcoes_updated_at
BEFORE UPDATE ON public.ministerio_funcoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- === MIGRATION: 20251208234047_803ce66e-9e69-41ab-bf51-a43f47384037.sql ===
-- Add funcao_principal_id column to ministerio_voluntarios
ALTER TABLE public.ministerio_voluntarios
ADD COLUMN funcao_principal_id UUID REFERENCES public.ministerio_funcoes(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_ministerio_voluntarios_funcao ON public.ministerio_voluntarios(funcao_principal_id);

-- Update RLS policy to allow volunteers to read their own records
CREATE POLICY "Volunteers can view their own volunteer records"
ON public.ministerio_voluntarios
FOR SELECT
USING (user_id = auth.uid());

-- === MIGRATION: 20251209001343_36929931-055b-4040-8993-b153fcb9038b.sql ===
-- Add confirmado_em timestamp field to escalas table for tracking confirmation time
ALTER TABLE public.escalas 
ADD COLUMN confirmado_em TIMESTAMPTZ NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.escalas.confirmado_em IS 'Timestamp when the volunteer confirmed or refused the schedule';

-- === MIGRATION: 20251209010435_727c41c6-ca77-4233-ad5e-61af2d5d522a.sql ===
-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('nova_escala', 'lembrete', 'status_alterado');

-- Create notifications table
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voluntario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  escala_id UUID REFERENCES public.escalas(id) ON DELETE CASCADE,
  tipo notification_type NOT NULL,
  mensagem TEXT NOT NULL,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin full access
CREATE POLICY "Admins can manage all notifications"
ON public.notificacoes
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Leaders can view notifications of their ministry volunteers
CREATE POLICY "Leaders can view ministry volunteers notifications"
ON public.notificacoes
FOR SELECT
USING (
  has_role(auth.uid(), 'lider') AND
  voluntario_id IN (
    SELECT mv.user_id FROM ministerio_voluntarios mv
    JOIN ministerios m ON mv.ministerio_id = m.id
    WHERE m.lider_id = get_profile_id(auth.uid())
  )
);

-- Members can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notificacoes
FOR SELECT
USING (voluntario_id = get_profile_id(auth.uid()));

-- Members can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notificacoes
FOR UPDATE
USING (voluntario_id = get_profile_id(auth.uid()));

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notificacoes
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_notificacoes_updated_at
BEFORE UPDATE ON public.notificacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_notificacoes_voluntario_id ON public.notificacoes(voluntario_id);
CREATE INDEX idx_notificacoes_escala_id ON public.notificacoes(escala_id);
CREATE INDEX idx_notificacoes_lido ON public.notificacoes(lido);
CREATE INDEX idx_notificacoes_tipo ON public.notificacoes(tipo);

-- === MIGRATION: 20251209144432_9cc958a8-e585-4540-af3a-cf16bc866d59.sql ===
-- Add titulo and ministerio_id columns to notificacoes table
ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS ministerio_id UUID REFERENCES public.ministerios(id) ON DELETE SET NULL;

-- Create index for ministerio_id
CREATE INDEX IF NOT EXISTS idx_notificacoes_ministerio_id ON public.notificacoes(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_voluntario_id ON public.notificacoes(voluntario_id);

-- Update the tipo enum to include new types
-- First, check if the new values exist, if not add them
DO $$
BEGIN
  -- Add 'sistema' type if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sistema' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'sistema';
  END IF;
  -- Add 'ministerio' type if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ministerio' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'ministerio';
  END IF;
  -- Add 'aviso_admin' type if not exists  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aviso_admin' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'aviso_admin';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create function to auto-create notification when escala is inserted
CREATE OR REPLACE FUNCTION public.notify_on_escala_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ministerio_nome TEXT;
  data_formatada TEXT;
BEGIN
  -- Get ministerio name
  SELECT nome INTO ministerio_nome 
  FROM ministerios 
  WHERE id = NEW.ministerio_id;

  -- Format date
  data_formatada := to_char(NEW.data, 'DD/MM/YYYY');

  -- Create notification for the volunteer
  IF NEW.voluntario_id IS NOT NULL THEN
    INSERT INTO notificacoes (
      voluntario_id, 
      escala_id, 
      ministerio_id,
      tipo, 
      titulo,
      mensagem
    )
    VALUES (
      NEW.voluntario_id,
      NEW.id,
      NEW.ministerio_id,
      'nova_escala',
      'Você foi escalado',
      'Você foi escalado para ' || COALESCE(ministerio_nome, 'um ministério') || ' em ' || data_formatada || ' como ' || NEW.funcao || '.'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for escala insert
DROP TRIGGER IF EXISTS trigger_notify_on_escala_insert ON escalas;
CREATE TRIGGER trigger_notify_on_escala_insert
  AFTER INSERT ON escalas
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_escala_insert();

-- Create function to notify admin/leader when volunteer responds to escala
CREATE OR REPLACE FUNCTION public.notify_on_escala_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  voluntario_nome TEXT;
  ministerio_nome TEXT;
  lider_id UUID;
  admin_record RECORD;
  data_formatada TEXT;
  status_msg TEXT;
  notification_msg TEXT;
BEGIN
  -- Only trigger if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get volunteer name
  SELECT nome INTO voluntario_nome 
  FROM profiles 
  WHERE id = NEW.voluntario_id;

  -- Get ministerio name and leader
  SELECT m.nome, m.lider_id INTO ministerio_nome, lider_id
  FROM ministerios m
  WHERE m.id = NEW.ministerio_id;

  -- Format date
  data_formatada := to_char(NEW.data, 'DD/MM/YYYY');
  
  -- Build status message
  IF NEW.status = 'confirmado' THEN
    status_msg := 'confirmou';
    notification_msg := COALESCE(voluntario_nome, 'Um voluntário') || ' ' || status_msg || ' presença na escala de ' || data_formatada || ' como ' || NEW.funcao || '.';
  ELSIF NEW.status = 'ausente' THEN
    status_msg := 'recusou';
    notification_msg := COALESCE(voluntario_nome, 'Um voluntário') || ' ' || status_msg || ' a escala de ' || data_formatada || ' como ' || NEW.funcao || '.';
    IF NEW.justificativa IS NOT NULL AND NEW.justificativa != '' THEN
      notification_msg := notification_msg || ' Justificativa: ' || NEW.justificativa;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Notify leader if exists
  IF lider_id IS NOT NULL THEN
    INSERT INTO notificacoes (
      voluntario_id, 
      escala_id, 
      ministerio_id,
      tipo, 
      titulo,
      mensagem
    )
    VALUES (
      lider_id,
      NEW.id,
      NEW.ministerio_id,
      'status_alterado',
      'Resposta de escala',
      notification_msg
    );
  END IF;

  -- Notify all admins
  FOR admin_record IN 
    SELECT p.id as profile_id
    FROM user_roles ur
    JOIN profiles p ON p.user_id = ur.user_id
    WHERE ur.role = 'admin'
      AND p.id != COALESCE(lider_id, '00000000-0000-0000-0000-000000000000')
  LOOP
    INSERT INTO notificacoes (
      voluntario_id, 
      escala_id, 
      ministerio_id,
      tipo, 
      titulo,
      mensagem
    )
    VALUES (
      admin_record.profile_id,
      NEW.id,
      NEW.ministerio_id,
      'status_alterado',
      'Resposta de escala',
      notification_msg
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for escala status update
DROP TRIGGER IF EXISTS trigger_notify_on_escala_status_change ON escalas;
CREATE TRIGGER trigger_notify_on_escala_status_change
  AFTER UPDATE ON escalas
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_escala_status_change();

-- Add realtime for notificacoes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;

-- === MIGRATION: 20251209150411_3c5b6273-540a-4bcf-b808-6a7bbb5cbaa9.sql ===
-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily reminder job at 00:10 UTC
SELECT cron.schedule(
  'daily-reminders',
  '10 0 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://vktfcgtnpbnacjnepfhf.supabase.co/functions/v1/daily-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdGZjZ3RucGJuYWNqbmVwZmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzQ1ODAsImV4cCI6MjA4MDYxMDU4MH0.1KLNcBSdwIOGtBE5E6zsFqGCZ1yHYXWwQU2mlWO2PpE'
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- === MIGRATION: 20251209161421_c55472c7-1314-4b78-a806-4583e5b57d5c.sql ===
-- Create visitantes table
CREATE TABLE public.visitantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  data_visita DATE DEFAULT CURRENT_DATE,
  culto TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'membro_em_potencial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_visitantes_telefone ON public.visitantes (telefone);
CREATE INDEX idx_visitantes_data_visita ON public.visitantes (data_visita DESC);

-- Enable RLS
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;

-- Public can insert (for the /sou-novo form)
CREATE POLICY "Anyone can register as visitor"
ON public.visitantes
FOR INSERT
WITH CHECK (true);

-- Only admins can view/update/delete
CREATE POLICY "Admins can manage visitantes"
ON public.visitantes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to notify admins on new visitor
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_visitor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT p.id as profile_id
    FROM user_roles ur
    JOIN profiles p ON p.user_id = ur.user_id
    WHERE ur.role = 'admin'
  LOOP
    INSERT INTO notificacoes (
      voluntario_id,
      tipo,
      titulo,
      mensagem
    )
    VALUES (
      admin_record.profile_id,
      'sistema',
      'Novo visitante registrado',
      NEW.nome || ' visitou a igreja hoje.'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger for new visitor notification
CREATE TRIGGER on_new_visitor_notify_admins
AFTER INSERT ON public.visitantes
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_visitor();

-- === MIGRATION: 20251209181356_8750d5b4-5858-45ab-a8e3-1ef473d30211.sql ===
-- Add melhor_horario column to visitantes table
ALTER TABLE public.visitantes ADD COLUMN IF NOT EXISTS melhor_horario text;

-- === MIGRATION: 20251209204106_e0dd4d0c-25b5-40bb-97b3-d5c347728541.sql ===
-- Tabela membros
CREATE TABLE public.membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  data_nascimento date,
  endereco text,
  estado_civil text,
  data_batismo date,
  foto_perfil text,
  data_registro timestamptz DEFAULT now(),
  observacoes text,
  status text DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Trigger para updated_at
CREATE TRIGGER update_membros_updated_at
BEFORE UPDATE ON public.membros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas admin
CREATE POLICY "Admins can manage membros"
ON public.membros
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Bucket para fotos de membros
INSERT INTO storage.buckets (id, name, public)
VALUES ('membros_fotos', 'membros_fotos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Authenticated users can upload member photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'membros_fotos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view member photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'membros_fotos');

CREATE POLICY "Admins can update member photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'membros_fotos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete member photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'membros_fotos' AND has_role(auth.uid(), 'admin'::app_role));

-- === MIGRATION: 20251209205855_e1773b4d-5c6e-49f7-9247-6aa04d505734.sql ===
-- Tabela bases
CREATE TABLE public.bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  lider_id uuid REFERENCES public.membros(id) ON DELETE SET NULL,
  data_criacao timestamptz DEFAULT now(),
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela bases_membros
CREATE TABLE public.bases_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_id uuid NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
  membro_id uuid NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
  data_entrada timestamptz DEFAULT now(),
  data_saida timestamptz,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'desligado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (base_id, membro_id, status)
);

-- Índice para garantir que membro só está em uma base ativa
CREATE UNIQUE INDEX idx_membro_base_ativa 
ON public.bases_membros (membro_id) 
WHERE status = 'ativo';

-- Triggers para updated_at
CREATE TRIGGER update_bases_updated_at
  BEFORE UPDATE ON public.bases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bases_membros_updated_at
  BEFORE UPDATE ON public.bases_membros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bases_membros ENABLE ROW LEVEL SECURITY;

-- RLS policies for bases
CREATE POLICY "Admins can manage bases"
  ON public.bases FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active bases"
  ON public.bases FOR SELECT
  USING (status = 'ativo' OR has_role(auth.uid(), 'admin'));

-- RLS policies for bases_membros
CREATE POLICY "Admins can manage bases_membros"
  ON public.bases_membros FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- === MIGRATION: 20251209212028_b37284e8-6cd2-43bd-b3b4-22eb9ffd7dd4.sql ===
-- Add visitante_id column to bases_membros
ALTER TABLE public.bases_membros 
ADD COLUMN visitante_id uuid REFERENCES public.visitantes(id) ON DELETE SET NULL;

-- Add observacao column for visitor notes
ALTER TABLE public.bases_membros 
ADD COLUMN observacao text;

-- Create unique index for visitors (one active base per visitor)
CREATE UNIQUE INDEX idx_visitante_base_ativa 
ON public.bases_membros (visitante_id) 
WHERE status = 'ativo' AND visitante_id IS NOT NULL;

-- === MIGRATION: 20251209212205_fdd2ea4e-02ae-4800-b7df-d992f7416e1e.sql ===
-- Make membro_id nullable to allow visitor-only records
ALTER TABLE public.bases_membros 
ALTER COLUMN membro_id DROP NOT NULL;

-- === MIGRATION: 20251210135555_6a72ca68-e541-4466-a5ef-5122d38a14dd.sql ===
-- Create acompanhamentos table
CREATE TABLE public.acompanhamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitante_id UUID NOT NULL REFERENCES public.visitantes(id) ON DELETE CASCADE,
  base_id UUID NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('novo', 'contato_iniciado', 'em_acompanhamento', 'concluido')),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_acompanhamentos_visitante ON public.acompanhamentos(visitante_id);
CREATE INDEX idx_acompanhamentos_base ON public.acompanhamentos(base_id);
CREATE INDEX idx_acompanhamentos_status ON public.acompanhamentos(status);

-- Enable RLS
ALTER TABLE public.acompanhamentos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage acompanhamentos"
ON public.acompanhamentos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leaders can view acompanhamentos"
ON public.acompanhamentos
FOR SELECT
USING (has_role(auth.uid(), 'lider'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_acompanhamentos_updated_at
BEFORE UPDATE ON public.acompanhamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- === MIGRATION: 20251210143446_66ef45dc-af34-4557-8e8e-c7341a23253e.sql ===
-- Add new fields to bases table to replace grupos functionality
ALTER TABLE public.bases 
ADD COLUMN IF NOT EXISTS dia_semana text,
ADD COLUMN IF NOT EXISTS horario text,
ADD COLUMN IF NOT EXISTS local text,
ADD COLUMN IF NOT EXISTS capacidade integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS visibilidade text DEFAULT 'publico';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bases_visibilidade ON public.bases(visibilidade);
CREATE INDEX IF NOT EXISTS idx_bases_dia_semana ON public.bases(dia_semana);

-- === MIGRATION: 20251210165800_85dc576d-77ef-47a6-aa93-ede3a010413f.sql ===
-- Create responsaveis table for guardians
CREATE TABLE public.responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for children and guardians
CREATE TABLE public.criancas_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  tipo_relacao TEXT DEFAULT 'responsável',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crianca_id, responsavel_id)
);

-- Create salas table for rooms
CREATE TABLE public.salas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  capacidade INTEGER DEFAULT 20,
  observacao TEXT,
  status TEXT DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checkins_kids table
CREATE TABLE public.checkins_kids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id),
  sala_id UUID NOT NULL REFERENCES public.salas(id),
  checkin_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checkout_at TIMESTAMP WITH TIME ZONE,
  checkout_responsavel_id UUID REFERENCES public.responsaveis(id),
  status TEXT NOT NULL DEFAULT 'presente',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criancas_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins_kids ENABLE ROW LEVEL SECURITY;

-- RLS policies for responsaveis
CREATE POLICY "Admins can manage responsaveis" ON public.responsaveis
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view responsaveis" ON public.responsaveis
  FOR SELECT USING (true);

-- RLS policies for criancas_responsaveis
CREATE POLICY "Admins can manage criancas_responsaveis" ON public.criancas_responsaveis
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view criancas_responsaveis" ON public.criancas_responsaveis
  FOR SELECT USING (true);

-- RLS policies for salas
CREATE POLICY "Admins can manage salas" ON public.salas
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view salas" ON public.salas
  FOR SELECT USING (true);

-- RLS policies for checkins_kids
CREATE POLICY "Admins can manage checkins_kids" ON public.checkins_kids
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view checkins_kids" ON public.checkins_kids
  FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_responsaveis_updated_at
  BEFORE UPDATE ON public.responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salas_updated_at
  BEFORE UPDATE ON public.salas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checkins_kids_updated_at
  BEFORE UPDATE ON public.checkins_kids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- === MIGRATION: 20251210175642_f1b46b64-517b-437a-b317-df8130371c15.sql ===
-- Contas financeiras (caixa, conta bancária, pix)
CREATE TABLE IF NOT EXISTS contas_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL, -- 'caixa' | 'banco' | 'pix'
  descricao text,
  saldo numeric(14,2) DEFAULT 0.00,
  moeda text DEFAULT 'BRL',
  status text DEFAULT 'ativa', -- 'ativa' | 'inativa'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categorias financeiras (receita/despesa)
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  natureza text NOT NULL, -- 'receita' | 'despesa'
  descricao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transações financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid REFERENCES contas_financeiras(id) ON DELETE SET NULL,
  categoria_id uuid REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
  tipo text NOT NULL, -- 'receita'|'despesa'
  valor numeric(14,2) NOT NULL,
  descricao text,
  data_operacao date NOT NULL,
  referencia text,
  membro_id uuid REFERENCES membros(id) ON DELETE SET NULL,
  visitante_id uuid REFERENCES visitantes(id) ON DELETE SET NULL,
  evento_id uuid REFERENCES eventos(id) ON DELETE SET NULL,
  criado_por uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'confirmado', -- 'confirmado'|'pendente'|'cancelado'
  nota text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auditoria financeira
CREATE TABLE IF NOT EXISTS auditoria_financeira (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL, -- 'create' 'update' 'delete'
  payload jsonb,
  usuario_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_financeira ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contas_financeiras
CREATE POLICY "Admins can manage contas_financeiras" ON contas_financeiras
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view contas_financeiras" ON contas_financeiras
  FOR SELECT USING (true);

-- RLS Policies for categorias_financeiras
CREATE POLICY "Admins can manage categorias_financeiras" ON categorias_financeiras
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view categorias_financeiras" ON categorias_financeiras
  FOR SELECT USING (true);

-- RLS Policies for transacoes_financeiras
CREATE POLICY "Admins can manage transacoes_financeiras" ON transacoes_financeiras
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view transacoes_financeiras" ON transacoes_financeiras
  FOR SELECT USING (true);

-- RLS Policies for auditoria_financeira
CREATE POLICY "Admins can view auditoria_financeira" ON auditoria_financeira
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert auditoria" ON auditoria_financeira
  FOR INSERT WITH CHECK (true);

-- Function to recalculate account balance
CREATE OR REPLACE FUNCTION recalcula_saldo_conta(p_conta_id uuid) 
RETURNS numeric 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_saldo numeric := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE WHEN tipo = 'receita' THEN valor ELSE -valor END
  ), 0) INTO novo_saldo
  FROM transacoes_financeiras
  WHERE conta_id = p_conta_id AND status = 'confirmado';
  
  UPDATE contas_financeiras 
  SET saldo = novo_saldo, updated_at = now() 
  WHERE id = p_conta_id;
  
  RETURN novo_saldo;
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_contas_financeiras_updated_at
  BEFORE UPDATE ON contas_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_financeiras_updated_at
  BEFORE UPDATE ON categorias_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacoes_financeiras_updated_at
  BEFORE UPDATE ON transacoes_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categorias_financeiras (nome, natureza, descricao) VALUES
  ('Dízimo', 'receita', 'Dízimos dos membros'),
  ('Oferta', 'receita', 'Ofertas gerais'),
  ('Doação', 'receita', 'Doações específicas'),
  ('Campanha', 'receita', 'Arrecadação de campanhas'),
  ('Evento', 'receita', 'Receitas de eventos'),
  ('Aluguel', 'despesa', 'Despesas com aluguel'),
  ('Energia', 'despesa', 'Conta de luz'),
  ('Água', 'despesa', 'Conta de água'),
  ('Internet', 'despesa', 'Serviços de internet'),
  ('Material', 'despesa', 'Materiais diversos'),
  ('Manutenção', 'despesa', 'Manutenção predial'),
  ('Salários', 'despesa', 'Folha de pagamento'),
  ('Missões', 'despesa', 'Apoio missionário'),
  ('Ação Social', 'despesa', 'Projetos sociais'),
  ('Outros', 'receita', 'Outras receitas'),
  ('Outros', 'despesa', 'Outras despesas');

-- === MIGRATION: 20251211142641_c92ca6f7-789f-4ddc-84bb-9762cf9dfa68.sql ===
-- Fix: Change bases.lider_id to reference profiles.id instead of membros.id
-- This aligns with ministerios.lider_id which already references profiles.id

-- Drop existing foreign key constraint
ALTER TABLE public.bases DROP CONSTRAINT IF EXISTS bases_lider_id_fkey;

-- Add new foreign key constraint referencing profiles.id
ALTER TABLE public.bases 
ADD CONSTRAINT bases_lider_id_fkey 
FOREIGN KEY (lider_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bases_lider_id ON public.bases(lider_id);

-- === MIGRATION: 20251211152103_afe07017-d9d5-4141-ba7f-ed7750c20bc6.sql ===
-- Add missing columns to configuracoes_instituicao table
ALTER TABLE public.configuracoes_instituicao 
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS capacidade_base_padrao integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS bases_publicas boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS visitantes_auto boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS membros_editam_perfil boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notificacoes_lideres boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notificacoes_email boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notificacoes_push boolean DEFAULT false;

-- Insert default record if not exists
INSERT INTO public.configuracoes_instituicao (id, nome_igreja)
SELECT gen_random_uuid(), 'Igreja da Promessa'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_instituicao LIMIT 1);

-- === MIGRATION: 20251211152637_bd5cade9-8f65-4c76-8442-b64769a0ccd4.sql ===
-- Create logos bucket for church logo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  1048576, -- 1MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to logos
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Allow authenticated admins to upload logos
CREATE POLICY "Admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow authenticated admins to update logos
CREATE POLICY "Admins can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow authenticated admins to delete logos
CREATE POLICY "Admins can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- === MIGRATION: 20251211200420_05320f38-efaf-4e27-8356-3c73fe397fa9.sql ===
-- Restrict checkins_kids to parents and admins only
DROP POLICY IF EXISTS "Authenticated can view checkins_kids" ON checkins_kids;

CREATE POLICY "Parents and staff can view checkins_kids" ON checkins_kids
  FOR SELECT USING (
    responsavel_id IN (
      SELECT cr.responsavel_id FROM criancas_responsaveis cr 
      JOIN criancas c ON c.id = cr.crianca_id 
      WHERE c.responsavel_id = get_profile_id(auth.uid())
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- === MIGRATION: 20251211203853_70458401-3025-4748-baf0-f902229e0c43.sql ===
-- =============================================
-- FIX: Políticas RLS da tabela profiles
-- =============================================

-- 1. Remover políticas existentes que expõem dados
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Política SELF-SERVICE: Usuário pode VER seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Política SELF-SERVICE: Usuário pode ATUALIZAR seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Política SELF-SERVICE: Usuário pode DELETAR seu próprio perfil
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Política ADMIN: Admins podem VER todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Política ADMIN: Admins podem GERENCIAR todos os perfis
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- === MIGRATION: 20251211204946_c755a347-da71-4ab4-999d-1eb23c4f2df9.sql ===
-- =============================================
-- STEP 1: Adicionar 'financeiro' ao enum app_role
-- =============================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';

-- === MIGRATION: 20251211205000_03eeee0b-9d6f-428a-8ecd-28756b3cdfa4.sql ===
-- =============================================
-- STEP 2: Corrigir RLS da tabela transacoes_financeiras
-- =============================================

-- 1. Remover política permissiva que expõe dados financeiros
DROP POLICY IF EXISTS "Authenticated can view transacoes_financeiras" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Admins can manage transacoes_financeiras" ON public.transacoes_financeiras;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- 3. Política: Admins e Financeiros podem VER todas as transações
CREATE POLICY "Admins and financeiro can view transacoes"
ON public.transacoes_financeiras
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- 4. Política: Admins e Financeiros podem INSERIR transações
CREATE POLICY "Admins and financeiro can insert transacoes"
ON public.transacoes_financeiras
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- 5. Política: Admins e Financeiros podem ATUALIZAR transações
CREATE POLICY "Admins and financeiro can update transacoes"
ON public.transacoes_financeiras
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- 6. Política: Admins e Financeiros podem DELETAR transações
CREATE POLICY "Admins and financeiro can delete transacoes"
ON public.transacoes_financeiras
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- === MIGRATION: 20251211205633_342e678f-72bf-4244-aa46-ad38a14f2e50.sql ===
-- =============================================
-- FIX: RLS para todas as tabelas financeiras
-- Acesso restrito a admin e financeiro
-- =============================================

-- =============================================
-- 1. CATEGORIAS_FINANCEIRAS
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage categorias_financeiras" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "Authenticated can view categorias_financeiras" ON public.categorias_financeiras;

-- Garantir RLS habilitado
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

-- Criar políticas restritivas
CREATE POLICY "Admins and financeiro can view categorias"
ON public.categorias_financeiras
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can insert categorias"
ON public.categorias_financeiras
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can update categorias"
ON public.categorias_financeiras
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can delete categorias"
ON public.categorias_financeiras
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- =============================================
-- 2. CONTAS_FINANCEIRAS
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage contas_financeiras" ON public.contas_financeiras;
DROP POLICY IF EXISTS "Authenticated can view contas_financeiras" ON public.contas_financeiras;

-- Garantir RLS habilitado
ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;

-- Criar políticas restritivas
CREATE POLICY "Admins and financeiro can view contas"
ON public.contas_financeiras
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can insert contas"
ON public.contas_financeiras
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can update contas"
ON public.contas_financeiras
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can delete contas"
ON public.contas_financeiras
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- =============================================
-- 3. AUDITORIA_FINANCEIRA
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can view auditoria_financeira" ON public.auditoria_financeira;
DROP POLICY IF EXISTS "System can insert auditoria" ON public.auditoria_financeira;

-- Garantir RLS habilitado
ALTER TABLE public.auditoria_financeira ENABLE ROW LEVEL SECURITY;

-- Criar políticas restritivas
CREATE POLICY "Admins and financeiro can view auditoria"
ON public.auditoria_financeira
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- Manter política de INSERT para o sistema (triggers/functions)
CREATE POLICY "System can insert auditoria"
ON public.auditoria_financeira
FOR INSERT
WITH CHECK (true);

-- === MIGRATION: 20251211210811_75a0afb6-c68f-49e1-9084-4b060e47d0f8.sql ===
-- Create push_subscriptions table for storing user push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions for sending notifications
CREATE POLICY "Admins can view all subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- === MIGRATION: 20251212015458_489352f7-6542-42bc-9509-a457f09d2c97.sql ===
-- Create historico_comunicacoes table for audit trail
CREATE TABLE public.historico_comunicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escala_id UUID REFERENCES public.escalas(id) ON DELETE SET NULL,
  voluntario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  mensagem_preview VARCHAR(255),
  detalhes_erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico_comunicacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage historico_comunicacoes"
ON public.historico_comunicacoes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leaders can view historico_comunicacoes"
ON public.historico_comunicacoes
FOR SELECT
USING (has_role(auth.uid(), 'lider'::app_role));

CREATE POLICY "System can insert historico_comunicacoes"
ON public.historico_comunicacoes
FOR INSERT
WITH CHECK (true);

-- Add lembrete_automatico_dias_antes column to escalas
ALTER TABLE public.escalas 
ADD COLUMN lembrete_automatico_dias_antes INTEGER DEFAULT NULL;

-- Create index for efficient querying of scheduled reminders
CREATE INDEX idx_escalas_lembrete_dias ON public.escalas(lembrete_automatico_dias_antes, data) 
WHERE lembrete_automatico_dias_antes IS NOT NULL;

-- === MIGRATION: 20251212022817_6d6c68cc-44fb-4d88-88eb-6f293ef212a8.sql ===
-- Drop existing SELECT policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create consolidated SELECT policy: user sees their own OR admin sees all
CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- === MIGRATION: 20251212022954_62c85080-fd12-4df4-a341-25df6cfb5142.sql ===
-- Drop existing public SELECT policy on configuracoes_instituicao
DROP POLICY IF EXISTS "Anyone authenticated can view configuracoes" ON public.configuracoes_instituicao;

-- Create restricted SELECT policy: only admins can view
CREATE POLICY "Only admins can view configuracoes"
ON public.configuracoes_instituicao
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- === MIGRATION: 20251215022641_bef93244-bc77-4975-81d3-f0509b3cb0eb.sql ===
-- Adicionar política para permitir usuários autenticados verem campos públicos da configuração
DROP POLICY IF EXISTS "Only admins can view configuracoes" ON public.configuracoes_instituicao;

-- Criar nova política que permite todos autenticados lerem (apenas dados não-sensíveis serão expostos via select no código)
CREATE POLICY "Authenticated users can view public config" 
ON public.configuracoes_instituicao 
FOR SELECT 
TO authenticated
USING (true);

-- === MIGRATION: 20251215161405_02631ff2-dd6e-4148-be12-622dd0d5e9f7.sql ===
-- Fix: Add authorization check to recalcula_saldo_conta function
-- This prevents unauthorized users from recalculating account balances

CREATE OR REPLACE FUNCTION public.recalcula_saldo_conta(p_conta_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  novo_saldo numeric := 0;
BEGIN
  -- Authorization check: Only admin or financeiro roles can execute this function
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin or financeiro roles can recalculate account balances';
  END IF;

  SELECT COALESCE(SUM(
    CASE WHEN tipo = 'receita' THEN valor ELSE -valor END
  ), 0) INTO novo_saldo
  FROM transacoes_financeiras
  WHERE conta_id = p_conta_id AND status = 'confirmado';
  
  UPDATE contas_financeiras 
  SET saldo = novo_saldo, updated_at = now() 
  WHERE id = p_conta_id;
  
  RETURN novo_saldo;
END;
$function$;

-- === MIGRATION: 20251216214559_4830a937-37f4-4658-b92f-4091db60b4d5.sql ===
-- Add RLS policies to allow members to register their own contributions

-- Policy: Users can insert their own contributions
CREATE POLICY "Users can insert their own contributions"
ON public.transacoes_financeiras
FOR INSERT
TO authenticated
WITH CHECK (criado_por = get_profile_id(auth.uid()));

-- Policy: Users can view their own contributions
CREATE POLICY "Users can view their own contributions"
ON public.transacoes_financeiras
FOR SELECT
TO authenticated
USING (criado_por = get_profile_id(auth.uid()));

-- Insert default contribution categories if they don't exist
INSERT INTO public.categorias_financeiras (nome, natureza, descricao)
SELECT 'Dízimo', 'receita', 'Contribuição de dízimo dos membros'
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Dízimo');

INSERT INTO public.categorias_financeiras (nome, natureza, descricao)
SELECT 'Oferta', 'receita', 'Ofertas voluntárias'
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Oferta');

INSERT INTO public.categorias_financeiras (nome, natureza, descricao)
SELECT 'Missões', 'receita', 'Contribuições para missões'
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Missões');

INSERT INTO public.categorias_financeiras (nome, natureza, descricao)
SELECT 'Outro', 'receita', 'Outras contribuições'
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Outro');

-- === MIGRATION: 20260108015446_2b68e154-4e77-44eb-88f4-d9c9c1ab416a.sql ===
-- Add SELECT policy for authenticated users to view active members
CREATE POLICY "Authenticated can view active membros"
ON public.membros
FOR SELECT
USING (status = 'ativo' OR has_role(auth.uid(), 'admin'::app_role));

-- === MIGRATION: 20260108021241_50fb3cb9-4041-4333-a9fd-a4255e97ba10.sql ===
-- Fix RLS policies with WITH CHECK (true) by restricting to authenticated users only
-- These are system/audit tables that should only allow authenticated users to insert

-- 1. Fix audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix auditoria_financeira INSERT policy
DROP POLICY IF EXISTS "System can insert auditoria" ON public.auditoria_financeira;
CREATE POLICY "Authenticated users can insert auditoria"
ON public.auditoria_financeira
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Fix historico_comunicacoes INSERT policy
DROP POLICY IF EXISTS "System can insert historico_comunicacoes" ON public.historico_comunicacoes;
CREATE POLICY "Authenticated users can insert historico_comunicacoes"
ON public.historico_comunicacoes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Fix logs_comunicacao INSERT policy
DROP POLICY IF EXISTS "System can insert logs" ON public.logs_comunicacao;
CREATE POLICY "Authenticated users can insert logs"
ON public.logs_comunicacao
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Fix notificacoes INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notificacoes;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- NOTE: visitantes table INSERT policy "Anyone can register as visitor" is intentional
-- for public visitor registration and should remain as is

-- === MIGRATION: 20260109221933_fb3dcf72-007d-41dc-b6ea-280ae76cef94.sql ===
-- Add profile_id column to bases_membros to link authenticated users to bases
ALTER TABLE public.bases_membros 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for profile_id lookups
CREATE INDEX IF NOT EXISTS idx_bases_membros_profile_id ON public.bases_membros(profile_id);

-- Allow users to view their own base membership
CREATE POLICY "Users can view their own base membership"
ON public.bases_membros
FOR SELECT
USING (profile_id = get_profile_id(auth.uid()));

-- Create table for personal notes linked to base presence
CREATE TABLE public.notas_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_id uuid NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  conteudo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, base_id, data)
);

-- Enable RLS
ALTER TABLE public.notas_base ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notes (private)
CREATE POLICY "Users can manage their own notes"
ON public.notas_base
FOR ALL
USING (profile_id = get_profile_id(auth.uid()));

-- Allow users to register their own presence for bases
CREATE POLICY "Users can register their own base presence"
ON public.presencas
FOR INSERT
WITH CHECK (
  usuario_id = get_profile_id(auth.uid()) 
  AND referencia_tipo = 'base'
);

-- Trigger for updated_at on notas_base
CREATE TRIGGER update_notas_base_updated_at
BEFORE UPDATE ON public.notas_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- === MIGRATION: 20260109232610_7acfed11-d48a-4222-91a3-1449ecd02025.sql ===
-- Add new profile fields for extended personal information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS naturalidade text,
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS logradouro text,
ADD COLUMN IF NOT EXISTS numero text,
ADD COLUMN IF NOT EXISTS complemento text,
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS uf text,
ADD COLUMN IF NOT EXISTS grau_instrucao text,
ADD COLUMN IF NOT EXISTS formacao text,
ADD COLUMN IF NOT EXISTS profissao text,
ADD COLUMN IF NOT EXISTS pcd text,
ADD COLUMN IF NOT EXISTS batizado_aguas boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_batismo date;

-- Add unique constraint for CPF (optional, can be null but must be unique when set)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique ON public.profiles (cpf) WHERE cpf IS NOT NULL;

-- === MIGRATION: 20260109233524_ff9c66b1-451f-4a6c-b5fd-82b238d99c00.sql ===
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- === MIGRATION: 20260111023237_41f8044a-04fc-4aa7-b3f4-733d662aa1a7.sql ===
-- Adicionar campo user_id opcional na tabela membros para vincular com profiles
ALTER TABLE public.membros 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_membros_user_id ON public.membros(user_id);

-- Adicionar constraint de unicidade para evitar duplicatas (um usuário = um membro)
ALTER TABLE public.membros 
ADD CONSTRAINT membros_user_id_unique UNIQUE (user_id);

-- Comentário para documentação
COMMENT ON COLUMN public.membros.user_id IS 'Vínculo opcional com profile de usuário autenticado. NULL para membros sem conta no sistema.';

-- === MIGRATION: 20260116202658_3a7e8856-2d80-40ed-b25d-01ae4daa9a10.sql ===
-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('eventos', 'eventos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload/update/delete event images
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'eventos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update event images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'eventos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'eventos' AND has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view event images (public bucket)
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'eventos');

-- === MIGRATION: 20260116203751_d7cce3db-6359-4078-b230-dd873ba5b7ab.sql ===
-- Add missing fields for contact information
ALTER TABLE public.configuracoes_instituicao
ADD COLUMN IF NOT EXISTS google_maps_url text,
ADD COLUMN IF NOT EXISTS horario_ebd text,
ADD COLUMN IF NOT EXISTS horario_culto text;

-- === MIGRATION: 20260117040935_23771636-1ff3-493b-aa7a-7d18f38d9265.sql ===
-- Policy para user_roles: permitir SELECT para admin/financeiro/lider
CREATE POLICY "Leaders can view user_roles for scheduling"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'financeiro'::app_role) OR
  public.has_role(auth.uid(), 'lider'::app_role)
);

-- Policy para profiles: permitir SELECT para admin/financeiro/lider
CREATE POLICY "Leaders can view profiles for scheduling"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'financeiro'::app_role) OR
  public.has_role(auth.uid(), 'lider'::app_role)
);

-- === MIGRATION: 20260117115323_21b11e6c-cca6-470a-9d0b-fe08eb851032.sql ===
-- Remove a política atual que dá acesso total a líderes
DROP POLICY IF EXISTS "Admins and leaders can manage escalas" ON public.escalas;

-- Policy: Admin tem acesso total
CREATE POLICY "Admins can manage all escalas"
ON public.escalas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Líder pode SELECT escalas dos ministérios onde ele é líder
CREATE POLICY "Leaders can view escalas of their ministerios"
ON public.escalas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
);

-- Policy: Líder pode INSERT escalas nos ministérios onde ele é líder
CREATE POLICY "Leaders can insert escalas in their ministerios"
ON public.escalas
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
);

-- Policy: Líder pode UPDATE escalas dos ministérios onde ele é líder
CREATE POLICY "Leaders can update escalas of their ministerios"
ON public.escalas
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
);

-- Policy: Líder pode DELETE escalas dos ministérios onde ele é líder
CREATE POLICY "Leaders can delete escalas of their ministerios"
ON public.escalas
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
);

-- Garantir que a política de SELECT para voluntários existe (ver suas próprias escalas)
-- Primeiro remover se existir para recriar
DROP POLICY IF EXISTS "Voluntarios can view their escalas" ON public.escalas;

-- Policy: Voluntário pode ver suas próprias escalas
CREATE POLICY "Voluntarios can view their escalas"
ON public.escalas
FOR SELECT
TO authenticated
USING (voluntario_id = public.get_profile_id(auth.uid()));

-- Manter a política de UPDATE para voluntários (confirmar/recusar)
-- Apenas pode atualizar status da própria escala
DROP POLICY IF EXISTS "Voluntarios can update their escalas status" ON public.escalas;

CREATE POLICY "Voluntarios can update their own status"
ON public.escalas
FOR UPDATE
TO authenticated
USING (voluntario_id = public.get_profile_id(auth.uid()))
WITH CHECK (voluntario_id = public.get_profile_id(auth.uid()));

-- === MIGRATION: 20260117124300_2812063d-e904-48f6-a4bc-32d16ab5787d.sql ===
-- =============================================
-- MIGRATION: Correção completa do módulo de Bases
-- =============================================

-- 1) Adicionar campos de endereço e foto na tabela bases
ALTER TABLE public.bases
  ADD COLUMN IF NOT EXISTS foto_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rua text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS numero text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bairro text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cidade text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS uf text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_lider text DEFAULT NULL;

-- 2) Ajustar RLS de bases para permitir leitura pública de bases ativas e públicas
DROP POLICY IF EXISTS "Authenticated can view active bases" ON public.bases;

CREATE POLICY "Anyone can view public active bases"
ON public.bases
FOR SELECT
USING (
  (status = 'ativo' AND visibilidade = 'publico')
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'lider'::app_role)
);

-- 3) Ajustar RLS de bases_membros para líderes verem membros das suas bases
DROP POLICY IF EXISTS "Leaders can manage their base members" ON public.bases_membros;

CREATE POLICY "Leaders can manage their base members"
ON public.bases_membros
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'lider'::app_role)
    AND base_id IN (
      SELECT id FROM public.bases WHERE lider_id = public.get_profile_id(auth.uid())
    )
  )
);

-- 4) Adicionar trigger para vincular líder automaticamente como membro quando definido
CREATE OR REPLACE FUNCTION public.auto_vincular_lider_base()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se um líder foi definido ou alterado
  IF NEW.lider_id IS NOT NULL AND (OLD.lider_id IS NULL OR OLD.lider_id != NEW.lider_id) THEN
    -- Verificar se o líder já está vinculado
    IF NOT EXISTS (
      SELECT 1 FROM bases_membros 
      WHERE base_id = NEW.id 
        AND profile_id = NEW.lider_id 
        AND status = 'ativo'
    ) THEN
      -- Inserir o líder como membro ativo
      INSERT INTO bases_membros (base_id, profile_id, status, observacao)
      VALUES (NEW.id, NEW.lider_id, 'ativo', 'Líder da base (vinculado automaticamente)');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_vincular_lider_base ON public.bases;

CREATE TRIGGER trigger_auto_vincular_lider_base
AFTER INSERT OR UPDATE OF lider_id ON public.bases
FOR EACH ROW
EXECUTE FUNCTION public.auto_vincular_lider_base();

-- 5) Ajustar RLS para membros verem sua própria base
DROP POLICY IF EXISTS "Users can view their own base membership" ON public.bases_membros;

CREATE POLICY "Users can view their own base membership"
ON public.bases_membros
FOR SELECT
TO authenticated
USING (
  profile_id = public.get_profile_id(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'lider'::app_role)
    AND base_id IN (
      SELECT id FROM public.bases WHERE lider_id = public.get_profile_id(auth.uid())
    )
  )
);

-- === MIGRATION: 20260117134703_c842e752-a06c-45bb-8f4e-7b28cb09ed3a.sql ===
-- =====================================================
-- 1. ESCALA_CHECKINS - Check-in de voluntários no dia
-- =====================================================
CREATE TABLE IF NOT EXISTS public.escala_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escala_id uuid NOT NULL REFERENCES public.escalas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escala_id, user_id)
);

-- Enable RLS
ALTER TABLE public.escala_checkins ENABLE ROW LEVEL SECURITY;

-- INSERT: apenas o voluntário da escala pode fazer check-in
CREATE POLICY "Volunteer can checkin own escala"
ON public.escala_checkins
FOR INSERT
WITH CHECK (
  user_id = (SELECT get_profile_id(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_id
      AND escalas.voluntario_id = get_profile_id(auth.uid())
  )
);

-- SELECT: admin vê tudo, líder vê de seus ministérios, voluntário vê os seus
CREATE POLICY "Admin can view all checkins"
ON public.escala_checkins
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leader can view ministry checkins"
ON public.escala_checkins
FOR SELECT
USING (
  has_role(auth.uid(), 'lider'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.escalas e
    JOIN public.ministerios m ON e.ministerio_id = m.id
    WHERE e.id = escala_id
      AND m.lider_id = get_profile_id(auth.uid())
  )
);

CREATE POLICY "Volunteer can view own checkins"
ON public.escala_checkins
FOR SELECT
USING (user_id = get_profile_id(auth.uid()));

-- =====================================================
-- 2. Ajustar RLS PRESENCAS para líder ver de sua base
-- =====================================================
-- Drop and recreate policy for leader to view base presences
DROP POLICY IF EXISTS "Leaders and admins can manage presencas" ON public.presencas;

CREATE POLICY "Admins can manage all presencas"
ON public.presencas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leaders can manage their base presencas"
ON public.presencas
FOR ALL
USING (
  has_role(auth.uid(), 'lider'::app_role)
  AND referencia_tipo = 'base'
  AND referencia_id IN (
    SELECT id FROM public.bases WHERE lider_id = get_profile_id(auth.uid())
  )
);

-- =====================================================
-- 3. Bucket para fotos das bases (se não existir)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('bases-fotos', 'bases-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage
CREATE POLICY "Anyone can view base photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'bases-fotos');

CREATE POLICY "Admin and leader can upload base photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bases-fotos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'lider'::app_role)
  )
);

CREATE POLICY "Admin and leader can update base photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bases-fotos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'lider'::app_role)
  )
);

CREATE POLICY "Admin and leader can delete base photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bases-fotos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'lider'::app_role)
  )
);

-- =====================================================
-- 4. Cascade delete para bases_membros quando base deletada
-- =====================================================
ALTER TABLE public.bases_membros
DROP CONSTRAINT IF EXISTS bases_membros_base_id_fkey;

ALTER TABLE public.bases_membros
ADD CONSTRAINT bases_membros_base_id_fkey
FOREIGN KEY (base_id) REFERENCES public.bases(id) ON DELETE CASCADE;

-- === MIGRATION: 20260117140220_5140fda5-0df5-4a2a-9736-db7e03082ee9.sql ===
-- A) CORRIGIR escala_checkins.user_id para usar auth.uid() como default
ALTER TABLE public.escala_checkins 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Recriar as políticas RLS de escala_checkins para garantir consistência
DROP POLICY IF EXISTS "Voluntários inserem próprio check-in" ON public.escala_checkins;
DROP POLICY IF EXISTS "Admin vê todos check-ins" ON public.escala_checkins;
DROP POLICY IF EXISTS "Líder vê check-ins dos ministérios que lidera" ON public.escala_checkins;
DROP POLICY IF EXISTS "Voluntário vê próprios check-ins" ON public.escala_checkins;

-- INSERT: voluntário pode inserir apenas para escalas onde ele é o voluntário
CREATE POLICY "Voluntários inserem próprio check-in"
ON public.escala_checkins FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.escalas e
    JOIN public.profiles p ON p.id = e.voluntario_id
    WHERE e.id = escala_id AND p.user_id = auth.uid()
  )
);

-- SELECT: Admin vê tudo
CREATE POLICY "Admin vê todos check-ins"
ON public.escala_checkins FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- SELECT: Líder vê check-ins de ministérios que lidera
CREATE POLICY "Líder vê check-ins dos ministérios que lidera"
ON public.escala_checkins FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escalas e
    JOIN public.ministerios m ON m.id = e.ministerio_id
    JOIN public.profiles p ON p.id = m.lider_id
    WHERE e.id = escala_id AND p.user_id = auth.uid()
  )
);

-- SELECT: Voluntário vê próprios check-ins
CREATE POLICY "Voluntário vê próprios check-ins"
ON public.escala_checkins FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- B) Garantir que líder pode ver presenças da própria base (com cast correto)
DROP POLICY IF EXISTS "Líder vê presenças da própria base" ON public.presencas;
CREATE POLICY "Líder vê presenças da própria base"
ON public.presencas FOR SELECT TO authenticated
USING (
  referencia_tipo = 'base' AND
  EXISTS (
    SELECT 1 FROM public.bases b
    JOIN public.profiles p ON p.id = b.lider_id
    WHERE b.id = referencia_id::uuid AND p.user_id = auth.uid()
  )
);

-- C) Garantir que admin pode DELETE em bases
DROP POLICY IF EXISTS "Admin pode deletar bases" ON public.bases;
CREATE POLICY "Admin pode deletar bases"
ON public.bases FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- D) Criar política para admin e líder fazerem upload no bucket bases-fotos
DROP POLICY IF EXISTS "Todos podem ver fotos de bases" ON storage.objects;
DROP POLICY IF EXISTS "Admin e líder podem fazer upload de fotos de bases" ON storage.objects;
DROP POLICY IF EXISTS "Admin e líder podem atualizar fotos de bases" ON storage.objects;
DROP POLICY IF EXISTS "Admin e líder podem deletar fotos de bases" ON storage.objects;

CREATE POLICY "Todos podem ver fotos de bases"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'bases-fotos');

CREATE POLICY "Admin e líder podem fazer upload de fotos de bases"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bases-fotos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'))
);

CREATE POLICY "Admin e líder podem atualizar fotos de bases"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'bases-fotos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'))
);

CREATE POLICY "Admin e líder podem deletar fotos de bases"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'bases-fotos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'))
);

-- === MIGRATION: 20260117170836_db0c79e2-099c-4731-bf0e-ba7ac34f5304.sql ===
-- Criar tabela de junção N:N para voluntário-funções
CREATE TABLE public.ministerio_voluntarios_funcoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministerio_voluntario_id uuid NOT NULL REFERENCES public.ministerio_voluntarios(id) ON DELETE CASCADE,
  funcao_id uuid NOT NULL REFERENCES public.ministerio_funcoes(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ministerio_voluntario_id, funcao_id)
);

-- Enable RLS
ALTER TABLE public.ministerio_voluntarios_funcoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage ministerio_voluntarios_funcoes"
  ON public.ministerio_voluntarios_funcoes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leaders can manage their ministry volunteer functions"
  ON public.ministerio_voluntarios_funcoes FOR ALL
  USING (
    has_role(auth.uid(), 'lider'::app_role) 
    AND ministerio_voluntario_id IN (
      SELECT mv.id FROM public.ministerio_voluntarios mv
      JOIN public.ministerios m ON mv.ministerio_id = m.id
      WHERE m.lider_id = get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Volunteers can view their own functions"
  ON public.ministerio_voluntarios_funcoes FOR SELECT
  USING (
    ministerio_voluntario_id IN (
      SELECT id FROM public.ministerio_voluntarios 
      WHERE user_id = auth.uid()
    )
  );

-- Migrar dados existentes: converter funcao_principal_id para a nova tabela
INSERT INTO public.ministerio_voluntarios_funcoes (ministerio_voluntario_id, funcao_id)
SELECT id, funcao_principal_id
FROM public.ministerio_voluntarios
WHERE funcao_principal_id IS NOT NULL;

-- === MIGRATION: 20260128192247_77dee9cf-d15c-4e27-9290-43591ca88a17.sql ===
-- =============================================================
-- FIX ERROR-LEVEL SECURITY ISSUES
-- =============================================================

-- 1. FIX MEMBROS TABLE PUBLIC EXPOSURE
-- Remove overly permissive policy and restrict to admin only
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view active membros" ON public.membros;

-- Only admins can view membros data
CREATE POLICY "Admins can view all membros"
ON public.membros
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Members can view their own linked record
CREATE POLICY "Users can view their own membro record"
ON public.membros
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND membros.user_id = p.id
  )
);

-- 2. FIX PROFILES TABLE EXPOSURE
-- Remove overly permissive leader policy and create scoped policies
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Leaders can view profiles for scheduling" ON public.profiles;

-- Leaders can only view basic profile info for their ministry volunteers
-- (not CPF, observacoes_privadas, or full address)
CREATE POLICY "Leaders can view their ministry volunteers basic info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User viewing their own profile
  auth.uid() = user_id
  OR
  -- Admins can view all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Leaders can view profiles of volunteers in their ministry only
  (
    has_role(auth.uid(), 'lider'::app_role)
    AND EXISTS (
      SELECT 1 
      FROM ministerio_voluntarios mv
      JOIN ministerios m ON m.id = mv.ministerio_id
      WHERE m.lider_id = get_profile_id(auth.uid())
        AND profiles.user_id = mv.user_id
    )
  )
  OR
  -- Financeiro can view profiles linked to financial transactions they manage
  (
    has_role(auth.uid(), 'financeiro'::app_role)
    AND EXISTS (
      SELECT 1 
      FROM transacoes_financeiras tf
      WHERE tf.criado_por = profiles.id
    )
  )
);

-- === MIGRATION: 20260128194536_b3f0aab5-cdc6-4292-997d-be404520e2c5.sql ===
-- Create a SECURITY DEFINER function that allows leaders to fetch eligible volunteers
-- This bypasses RLS but has its own authorization checks

CREATE OR REPLACE FUNCTION public.get_eligible_volunteers_for_ministry(p_ministerio_id uuid, p_search_term text DEFAULT '')
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader_of_ministry boolean;
BEGIN
  -- Get caller's profile id
  v_caller_profile_id := get_profile_id(auth.uid());
  
  -- Check if caller is admin
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);
  
  -- Check if caller is the leader of this ministry
  SELECT EXISTS (
    SELECT 1 FROM ministerios m
    WHERE m.id = p_ministerio_id AND m.lider_id = v_caller_profile_id
  ) INTO v_is_leader_of_ministry;
  
  -- Authorization: must be admin or leader of this ministry
  IF NOT (v_is_admin OR v_is_leader_of_ministry) THEN
    RAISE EXCEPTION 'Unauthorized: You must be an admin or the leader of this ministry';
  END IF;
  
  -- Return eligible profiles:
  -- 1. Have schedulable roles (admin, lider, voluntario, financeiro)
  -- 2. Are NOT already linked to this ministry
  -- 3. Match search term (if provided)
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.nome,
    p.email,
    p.user_id
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role IN ('admin', 'lider', 'voluntario', 'financeiro')
    AND NOT EXISTS (
      SELECT 1 FROM ministerio_voluntarios mv
      WHERE mv.ministerio_id = p_ministerio_id
        AND mv.user_id = p.user_id
    )
    AND (
      p_search_term = '' 
      OR p.nome ILIKE '%' || p_search_term || '%'
      OR p.email ILIKE '%' || p_search_term || '%'
    )
  ORDER BY p.nome
  LIMIT 50;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_eligible_volunteers_for_ministry(uuid, text) TO authenticated;

-- === MIGRATION: 20260128195303_7618ea14-01e3-49e2-b6e9-3dc22b25dbec.sql ===
-- Drop and recreate the RPC function to properly handle empty search term
CREATE OR REPLACE FUNCTION public.get_eligible_volunteers_for_ministry(p_ministerio_id uuid, p_search_term text DEFAULT ''::text)
 RETURNS TABLE(id uuid, nome text, email text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader_of_ministry boolean;
  v_clean_search text;
BEGIN
  -- Get caller's profile id
  v_caller_profile_id := get_profile_id(auth.uid());
  
  -- Check if caller is admin
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);
  
  -- Check if caller is the leader of this ministry
  SELECT EXISTS (
    SELECT 1 FROM ministerios m
    WHERE m.id = p_ministerio_id AND m.lider_id = v_caller_profile_id
  ) INTO v_is_leader_of_ministry;
  
  -- Authorization: must be admin or leader of this ministry
  IF NOT (v_is_admin OR v_is_leader_of_ministry) THEN
    RAISE EXCEPTION 'Unauthorized: You must be an admin or the leader of this ministry';
  END IF;
  
  -- Clean search term (handle null/empty)
  v_clean_search := COALESCE(TRIM(p_search_term), '');
  
  -- Return eligible profiles:
  -- 1. Have schedulable roles (admin, lider, voluntario, financeiro)
  -- 2. Are NOT already linked to this ministry
  -- 3. Match search term (if provided) - case insensitive
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.nome,
    p.email,
    p.user_id
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role IN ('admin', 'lider', 'voluntario', 'financeiro')
    AND NOT EXISTS (
      SELECT 1 FROM ministerio_voluntarios mv
      WHERE mv.ministerio_id = p_ministerio_id
        AND mv.user_id = p.user_id
    )
    AND (
      v_clean_search = '' 
      OR p.nome ILIKE '%' || v_clean_search || '%'
      OR p.email ILIKE '%' || v_clean_search || '%'
    )
  ORDER BY p.nome
  LIMIT 50;
END;
$function$;

-- === MIGRATION: 20260128201354_af36b70b-d346-4e9c-91e4-79db9ebc2e4b.sql ===
-- Add ON DELETE CASCADE to escala_checkins.escala_id foreign key
-- First drop the existing constraint, then re-add with CASCADE

ALTER TABLE public.escala_checkins
DROP CONSTRAINT IF EXISTS escala_checkins_escala_id_fkey;

ALTER TABLE public.escala_checkins
ADD CONSTRAINT escala_checkins_escala_id_fkey
FOREIGN KEY (escala_id) REFERENCES public.escalas(id) ON DELETE CASCADE;

-- === MIGRATION: 20260203212920_9d5660b8-c5d0-4fdc-a07a-18a58b90e00b.sql ===
-- Add new fields to bases table
ALTER TABLE public.bases 
ADD COLUMN IF NOT EXISTS anfitrioes TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.bases.anfitrioes IS 'Nome(s) do(s) anfitrião(ões) da base';
COMMENT ON COLUMN public.bases.observacoes IS 'Observações gerais sobre a base';

-- === MIGRATION: 20260211140405_05bbbd17-c46e-4c1a-8dc0-6bafafbcfe37.sql ===

-- 1. Sync existing data: set profile_id from membros.user_id where missing
UPDATE bases_membros bm
SET profile_id = m.user_id
FROM membros m
WHERE bm.membro_id = m.id
  AND m.user_id IS NOT NULL
  AND bm.profile_id IS NULL;

-- 2. Add RLS policy on bases so members can see bases they belong to
CREATE POLICY "Members can view their linked bases"
ON public.bases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bases_membros
    WHERE bases_membros.base_id = bases.id
      AND bases_membros.status = 'ativo'
      AND bases_membros.profile_id = get_profile_id(auth.uid())
  )
);


-- === MIGRATION: 20260211165758_8e841891-e51f-42b0-8afd-c0cfa3d4c4f8.sql ===

CREATE OR REPLACE FUNCTION public.get_my_bases()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id uuid;
  result json;
BEGIN
  v_profile_id := get_profile_id(auth.uid());
  IF v_profile_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  SELECT json_agg(
    json_build_object(
      'id', bm.id,
      'base_id', bm.base_id,
      'profile_id', bm.profile_id,
      'data_entrada', bm.data_entrada,
      'status', bm.status,
      'bases', json_build_object(
        'id', b.id,
        'nome', b.nome,
        'descricao', b.descricao,
        'local', b.local,
        'dia_semana', b.dia_semana,
        'horario', b.horario,
        'capacidade', b.capacidade,
        'lider_id', b.lider_id,
        'foto_url', b.foto_url,
        'anfitrioes', b.anfitrioes,
        'lider', CASE WHEN b.lider_id IS NOT NULL THEN
          json_build_object('nome', (SELECT p.nome FROM profiles p WHERE p.id = b.lider_id))
        ELSE NULL END
      )
    )
  )
  INTO result
  FROM bases_membros bm
  JOIN bases b ON b.id = bm.base_id
  WHERE bm.profile_id = v_profile_id
    AND bm.status = 'ativo';

  RETURN COALESCE(result, '[]'::json);
END;
$$;


-- === MIGRATION: 20260211171016_97d683bf-aee9-49b3-9622-e5e13a18c040.sql ===

-- Remove duplicate bases_membros entries (keep the oldest)
DELETE FROM bases_membros WHERE id = '8ad17840-5742-49eb-b29e-0024199268e2';
DELETE FROM bases_membros WHERE id = '800202cd-4adc-4577-9396-05ed48980732';

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX idx_bases_membros_unique_profile ON bases_membros (base_id, profile_id) WHERE profile_id IS NOT NULL AND status = 'ativo';


-- === MIGRATION: 20260211191447_6ac2a5f8-8301-4163-b1c9-97e6b7a08162.sql ===

-- Drop ALL existing policies on bases to eliminate recursion
DROP POLICY IF EXISTS "Admin pode deletar bases" ON public.bases;
DROP POLICY IF EXISTS "Admins can manage bases" ON public.bases;
DROP POLICY IF EXISTS "Anyone can view public active bases" ON public.bases;
DROP POLICY IF EXISTS "Members can view their linked bases" ON public.bases;

-- Recreate clean policies (NO subquery referencing bases itself)

-- 1. Admin full access
CREATE POLICY "Admin full access on bases"
ON public.bases FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Leader can view bases they lead (direct column check, no subquery)
CREATE POLICY "Leader can view own bases"
ON public.bases FOR SELECT
USING (
  has_role(auth.uid(), 'lider'::app_role)
  AND lider_id = get_profile_id(auth.uid())
);

-- 3. Member can view bases they belong to (subquery on bases_membros only)
CREATE POLICY "Member can view linked bases"
ON public.bases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bases_membros bm
    WHERE bm.base_id = bases.id
      AND bm.profile_id IS NOT NULL
      AND bm.profile_id = get_profile_id(auth.uid())
      AND bm.status = 'ativo'
  )
);

-- 4. Public can view active public bases (no subquery needed)
CREATE POLICY "Public can view active public bases"
ON public.bases FOR SELECT
USING (status = 'ativo' AND visibilidade = 'publico');

-- Also fix bases_membros leader policy that references bases (causes recursion chain)
DROP POLICY IF EXISTS "Leaders can manage their base members" ON public.bases_membros;

CREATE POLICY "Leaders can manage their base members"
ON public.bases_membros FOR ALL
USING (
  has_role(auth.uid(), 'lider'::app_role)
  AND base_id IN (
    SELECT bm2.base_id FROM bases_membros bm2
    WHERE bm2.profile_id = get_profile_id(auth.uid())
    AND bm2.status = 'ativo'
  )
);


-- === MIGRATION: 20260211193557_18972c99-713f-4d37-88b0-363e9d1ec9bf.sql ===

-- 1) Drop ALL existing policies on public.bases
DROP POLICY IF EXISTS "Admin full access on bases" ON public.bases;
DROP POLICY IF EXISTS "Admin pode deletar bases" ON public.bases;
DROP POLICY IF EXISTS "Admins can manage bases" ON public.bases;
DROP POLICY IF EXISTS "Anyone can view public active bases" ON public.bases;
DROP POLICY IF EXISTS "Members can view their linked bases" ON public.bases;
DROP POLICY IF EXISTS "Leader can view own bases" ON public.bases;
DROP POLICY IF EXISTS "Member can view linked bases" ON public.bases;
DROP POLICY IF EXISTS "Public can view active public bases" ON public.bases;

-- 2) Recreate non-recursive policies

CREATE POLICY "bases_admin_all"
ON public.bases FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "bases_leader_select_own"
ON public.bases FOR SELECT
USING (lider_id = get_profile_id(auth.uid()));

CREATE POLICY "bases_member_select_linked"
ON public.bases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bases_membros bm
    WHERE bm.base_id = bases.id
      AND bm.profile_id = get_profile_id(auth.uid())
      AND bm.status = 'ativo'
  )
);

CREATE POLICY "bases_public_active"
ON public.bases FOR SELECT
USING (status = 'ativo' AND visibilidade = 'publico');

-- 3) Ensure RLS stays enabled
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;


-- === MIGRATION: 20260212125224_7ea52a95-c9af-4ecb-98dd-8a5756967420.sql ===

-- Fix the circular dependency: bases_membros policy references bases table

-- Drop the problematic policy on bases_membros
DROP POLICY IF EXISTS "Users can view their own base membership" ON public.bases_membros;

-- Recreate without referencing bases table
-- Leaders check via bases_membros itself (their own profile_id link), not via bases.lider_id
CREATE POLICY "Users can view their own base membership"
ON public.bases_membros FOR SELECT
USING (
  profile_id = get_profile_id(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'lider'::app_role)
    AND base_id IN (
      SELECT bm2.base_id
      FROM public.bases_membros bm2
      WHERE bm2.profile_id = get_profile_id(auth.uid())
        AND bm2.status = 'ativo'
    )
  )
);


-- === MIGRATION: 20260212142655_6f2183eb-b1d3-4858-b889-bf9c4177ee0c.sql ===

-- =============================================
-- RPC 1: get_bases_report (Admin only)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_bases_report()
RETURNS TABLE (
  base_id uuid,
  nome text,
  status text,
  visibilidade text,
  capacidade integer,
  lider_id uuid,
  lider_nome text,
  total_membros bigint,
  total_visitantes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    b.id AS base_id,
    b.nome,
    COALESCE(b.status, 'ativo') AS status,
    COALESCE(b.visibilidade, 'publico') AS visibilidade,
    COALESCE(b.capacidade, 20) AS capacidade,
    b.lider_id,
    p.nome AS lider_nome,
    COALESCE(m_count.total, 0) AS total_membros,
    COALESCE(v_count.total, 0) AS total_visitantes
  FROM bases b
  LEFT JOIN profiles p ON p.id = b.lider_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total
    FROM bases_membros bm
    WHERE bm.base_id = b.id AND bm.status = 'ativo' AND (bm.membro_id IS NOT NULL OR bm.profile_id IS NOT NULL)
  ) m_count ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total
    FROM bases_membros bm
    WHERE bm.base_id = b.id AND bm.visitante_id IS NOT NULL AND bm.status != 'desligado'
  ) v_count ON true
  ORDER BY b.nome;
END;
$$;

-- =============================================
-- RPC 2: get_base_members_for_leader(p_base_id, p_search)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_base_members_for_leader(
  p_base_id uuid,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  bases_membros_id uuid,
  profile_id uuid,
  membro_id uuid,
  nome text,
  telefone text,
  foto_url text,
  origem text,
  data_entrada timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id uuid;
  v_is_admin boolean;
  v_is_leader boolean;
  v_clean_search text;
BEGIN
  v_profile_id := get_profile_id(auth.uid());
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);

  -- Check if caller is leader of this base
  SELECT EXISTS (
    SELECT 1 FROM bases b WHERE b.id = p_base_id AND b.lider_id = v_profile_id
  ) INTO v_is_leader;

  IF NOT (v_is_admin OR v_is_leader) THEN
    RETURN; -- Return empty set
  END IF;

  v_clean_search := COALESCE(TRIM(p_search), '');

  RETURN QUERY
  SELECT
    bm.id AS bases_membros_id,
    bm.profile_id,
    bm.membro_id,
    COALESCE(pr.nome, me.nome, 'Sem nome') AS nome,
    COALESCE(pr.telefone, me.telefone) AS telefone,
    COALESCE(pr.foto_url, me.foto_perfil) AS foto_url,
    CASE
      WHEN bm.profile_id IS NOT NULL AND bm.membro_id IS NOT NULL THEN 'ambos'
      WHEN bm.profile_id IS NOT NULL THEN 'profile'
      WHEN bm.membro_id IS NOT NULL THEN 'membro'
      ELSE 'desconhecido'
    END AS origem,
    bm.data_entrada
  FROM bases_membros bm
  LEFT JOIN profiles pr ON pr.id = bm.profile_id
  LEFT JOIN membros me ON me.id = bm.membro_id
  WHERE bm.base_id = p_base_id
    AND bm.status = 'ativo'
    AND (bm.profile_id IS NOT NULL OR bm.membro_id IS NOT NULL)
    AND (
      v_clean_search = ''
      OR COALESCE(pr.nome, me.nome, '') ILIKE '%' || v_clean_search || '%'
    )
  ORDER BY COALESCE(pr.nome, me.nome);
END;
$$;


-- === MIGRATION: 20260212143533_08803cb7-2692-4147-ab7a-d93c2bb170a9.sql ===

DROP FUNCTION IF EXISTS public.get_bases_report();

CREATE OR REPLACE FUNCTION public.get_bases_report()
 RETURNS TABLE(
   base_id uuid, nome text, status text, visibilidade text, capacidade integer,
   lider_id uuid, lider_nome text, total_membros bigint, total_visitantes bigint,
   total_membros_ativos bigint, total_visitantes_geral bigint,
   membros_em_bases_distintos bigint, visitantes_em_bases_distintos bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_membros_ativos bigint;
  v_total_visitantes bigint;
  v_membros_em_bases bigint;
  v_visitantes_em_bases bigint;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COUNT(*) INTO v_total_membros_ativos FROM membros WHERE status = 'ativo';
  SELECT COUNT(*) INTO v_total_visitantes FROM visitantes;

  SELECT COUNT(DISTINCT COALESCE(bm.profile_id, bm.membro_id))
    INTO v_membros_em_bases
    FROM bases_membros bm
    WHERE bm.status = 'ativo'
      AND (bm.profile_id IS NOT NULL OR bm.membro_id IS NOT NULL);

  SELECT COUNT(DISTINCT bm.visitante_id)
    INTO v_visitantes_em_bases
    FROM bases_membros bm
    WHERE bm.visitante_id IS NOT NULL
      AND bm.status != 'desligado';

  RETURN QUERY
  SELECT
    b.id AS base_id, b.nome,
    COALESCE(b.status, 'ativo') AS status,
    COALESCE(b.visibilidade, 'publico') AS visibilidade,
    COALESCE(b.capacidade, 20) AS capacidade,
    b.lider_id,
    p.nome AS lider_nome,
    COALESCE(m_count.total, 0) AS total_membros,
    COALESCE(v_count.total, 0) AS total_visitantes,
    v_total_membros_ativos,
    v_total_visitantes,
    v_membros_em_bases,
    v_visitantes_em_bases
  FROM bases b
  LEFT JOIN profiles p ON p.id = b.lider_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total FROM bases_membros bm
    WHERE bm.base_id = b.id AND bm.status = 'ativo'
      AND (bm.membro_id IS NOT NULL OR bm.profile_id IS NOT NULL)
  ) m_count ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total FROM bases_membros bm
    WHERE bm.base_id = b.id AND bm.visitante_id IS NOT NULL AND bm.status != 'desligado'
  ) v_count ON true
  ORDER BY b.nome;
END;
$function$;


-- === MIGRATION: 20260212213629_db7fb9e5-c39d-4d62-8fc1-dc92e6cd15fd.sql ===

-- A) RPC: get_eligible_people_for_base
CREATE OR REPLACE FUNCTION public.get_eligible_people_for_base(p_base_id uuid, p_search text DEFAULT NULL)
RETURNS TABLE(id uuid, nome text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader boolean;
  v_clean_search text;
BEGIN
  v_caller_profile_id := get_profile_id(auth.uid());
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);

  SELECT EXISTS (
    SELECT 1 FROM bases b WHERE b.id = p_base_id AND b.lider_id = v_caller_profile_id
  ) INTO v_is_leader;

  IF NOT (v_is_admin OR v_is_leader) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_clean_search := COALESCE(TRIM(p_search), '');

  RETURN QUERY
  SELECT p.id, p.nome, p.email
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM bases_membros bm
    WHERE bm.base_id = p_base_id
      AND bm.profile_id = p.id
      AND bm.status = 'ativo'
  )
  AND (
    v_clean_search = ''
    OR p.nome ILIKE '%' || v_clean_search || '%'
    OR p.email ILIKE '%' || v_clean_search || '%'
  )
  ORDER BY p.nome
  LIMIT 50;
END;
$function$;

-- B) RPC: leader_add_member_to_base
CREATE OR REPLACE FUNCTION public.leader_add_member_to_base(p_base_id uuid, p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader boolean;
BEGIN
  v_caller_profile_id := get_profile_id(auth.uid());
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);

  SELECT EXISTS (
    SELECT 1 FROM bases b WHERE b.id = p_base_id AND b.lider_id = v_caller_profile_id
  ) INTO v_is_leader;

  IF NOT (v_is_admin OR v_is_leader) THEN
    RAISE EXCEPTION 'Unauthorized: you are not admin or leader of this base';
  END IF;

  -- Insert only if not already active (respect unique constraint)
  INSERT INTO bases_membros (base_id, profile_id, status, data_entrada)
  VALUES (p_base_id, p_profile_id, 'ativo', now())
  ON CONFLICT DO NOTHING;
END;
$function$;

-- C) RPC: leader_remove_member_from_base
CREATE OR REPLACE FUNCTION public.leader_remove_member_from_base(p_bases_membros_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader boolean;
  v_base_id uuid;
BEGIN
  v_caller_profile_id := get_profile_id(auth.uid());
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);

  -- Get the base_id for this membership record
  SELECT bm.base_id INTO v_base_id
  FROM bases_membros bm
  WHERE bm.id = p_bases_membros_id;

  IF v_base_id IS NULL THEN
    RAISE EXCEPTION 'Record not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM bases b WHERE b.id = v_base_id AND b.lider_id = v_caller_profile_id
  ) INTO v_is_leader;

  IF NOT (v_is_admin OR v_is_leader) THEN
    RAISE EXCEPTION 'Unauthorized: you are not admin or leader of this base';
  END IF;

  -- Soft-delete: mark as desligado
  UPDATE bases_membros
  SET status = 'desligado', data_saida = now(), updated_at = now()
  WHERE id = p_bases_membros_id;
END;
$function$;


-- === MIGRATION: 20260213182242_5c785896-d3da-4fa7-9ad8-101fe7a931d2.sql ===

-- 1) Add sala_id (fixed room assignment) to criancas table
ALTER TABLE public.criancas
ADD COLUMN sala_id uuid REFERENCES public.salas(id) ON DELETE SET NULL;

CREATE INDEX idx_criancas_sala_id ON public.criancas(sala_id);

-- 2) Backfill sala_id from last check-in for each child
UPDATE public.criancas c
SET sala_id = sub.sala_id
FROM (
  SELECT DISTINCT ON (crianca_id) crianca_id, sala_id
  FROM public.checkins_kids
  ORDER BY crianca_id, checkin_at DESC
) sub
WHERE c.id = sub.crianca_id AND c.sala_id IS NULL;


-- === MIGRATION: 20260213192140_9cb12a4e-bed5-4799-8ea0-bb8fb7ef2724.sql ===

-- 1) Allow any authenticated user to SELECT criancas (needed for check-in panel)
CREATE POLICY "Authenticated can view criancas for checkin"
ON public.criancas
FOR SELECT
USING (true);

-- 2) Allow authenticated users to INSERT checkins_kids (for check-in)
CREATE POLICY "Authenticated can insert checkins_kids"
ON public.checkins_kids
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 3) Allow authenticated users to SELECT checkins_kids (for viewing today's checkins)
CREATE POLICY "Authenticated can view checkins_kids"
ON public.checkins_kids
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4) Allow authenticated users to UPDATE checkins_kids (for checkout)
CREATE POLICY "Authenticated can update checkins_kids"
ON public.checkins_kids
FOR UPDATE
USING (auth.uid() IS NOT NULL);


-- === MIGRATION: 20260213195435_58ee993b-2e2b-4c11-b098-af85a6c42a0a.sql ===

-- 1) Create helper function: checks if user is admin OR active Kids ministry volunteer
CREATE OR REPLACE FUNCTION public.is_kids_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM ministerio_voluntarios mv
      JOIN ministerios m ON m.id = mv.ministerio_id
      WHERE mv.user_id = _user_id
        AND mv.ativo = true
        AND m.ativo = true
        AND m.nome ILIKE '%kids%'
    )
$$;

-- 2) Drop the 3 overly permissive policies created previously
DROP POLICY IF EXISTS "Authenticated can view criancas for checkin" ON public.criancas;
DROP POLICY IF EXISTS "Authenticated can insert checkins_kids" ON public.checkins_kids;
DROP POLICY IF EXISTS "Authenticated can view checkins_kids" ON public.checkins_kids;
DROP POLICY IF EXISTS "Authenticated can update checkins_kids" ON public.checkins_kids;

-- Also drop the old generic salas SELECT that uses true
DROP POLICY IF EXISTS "Authenticated can view salas" ON public.salas;

-- 3) Create restrictive policies

-- criancas: SELECT for admin OR kids team
CREATE POLICY "Kids team can view criancas"
ON public.criancas
FOR SELECT
USING (is_kids_team(auth.uid()));

-- criancas: UPDATE for admin OR kids team (to assign sala_id, edit fields)
CREATE POLICY "Kids team can update criancas"
ON public.criancas
FOR UPDATE
USING (is_kids_team(auth.uid()));

-- criancas: INSERT for admin OR kids team (cadastro rápido)
CREATE POLICY "Kids team can insert criancas"
ON public.criancas
FOR INSERT
WITH CHECK (is_kids_team(auth.uid()));

-- checkins_kids: SELECT for admin OR kids team
CREATE POLICY "Kids team can view checkins_kids"
ON public.checkins_kids
FOR SELECT
USING (is_kids_team(auth.uid()));

-- checkins_kids: INSERT for admin OR kids team
CREATE POLICY "Kids team can insert checkins_kids"
ON public.checkins_kids
FOR INSERT
WITH CHECK (is_kids_team(auth.uid()));

-- checkins_kids: UPDATE for admin OR kids team (checkout)
CREATE POLICY "Kids team can update checkins_kids"
ON public.checkins_kids
FOR UPDATE
USING (is_kids_team(auth.uid()));

-- salas: SELECT for admin OR kids team
CREATE POLICY "Kids team can view salas"
ON public.salas
FOR SELECT
USING (is_kids_team(auth.uid()));


-- === MIGRATION: 20260213223325_58ff3e94-bba6-442b-9a55-fe485468c8f2.sql ===

-- 1) Add RLS policies for responsaveis: kids team can SELECT/INSERT/UPDATE
CREATE POLICY "Kids team can view responsaveis"
ON public.responsaveis
FOR SELECT
USING (is_kids_team(auth.uid()));

CREATE POLICY "Kids team can insert responsaveis"
ON public.responsaveis
FOR INSERT
WITH CHECK (is_kids_team(auth.uid()));

CREATE POLICY "Kids team can update responsaveis"
ON public.responsaveis
FOR UPDATE
USING (is_kids_team(auth.uid()));

-- 2) Add RLS policies for criancas_responsaveis: kids team can manage
CREATE POLICY "Kids team can insert criancas_responsaveis"
ON public.criancas_responsaveis
FOR INSERT
WITH CHECK (is_kids_team(auth.uid()));

CREATE POLICY "Kids team can delete criancas_responsaveis"
ON public.criancas_responsaveis
FOR DELETE
USING (is_kids_team(auth.uid()));

-- 3) Create get_my_ministries() RPC - returns active ministries for the logged-in user
CREATE OR REPLACE FUNCTION public.get_my_ministries()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', m.id,
      'nome', m.nome,
      'descricao', m.descricao
    )
  ), '[]'::json)
  INTO result
  FROM ministerio_voluntarios mv
  JOIN ministerios m ON m.id = mv.ministerio_id
  WHERE mv.user_id = auth.uid()
    AND mv.ativo = true
    AND m.ativo = true;

  RETURN result;
END;
$$;


-- === MIGRATION: 20260213224229_44eb9b2d-ef2d-476f-8292-cd9ea5fb6cb9.sql ===

-- 1) Add slug column to ministerios
ALTER TABLE public.ministerios ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- 2) Populate known slugs based on name patterns
UPDATE public.ministerios SET slug = 'kids' WHERE slug IS NULL AND nome ILIKE '%kids%';
UPDATE public.ministerios SET slug = 'ensino' WHERE slug IS NULL AND (nome ILIKE '%ensino%' OR nome ILIKE '%ebd%' OR nome ILIKE '%escola%');
UPDATE public.ministerios SET slug = 'recepcao' WHERE slug IS NULL AND (nome ILIKE '%recep%' OR nome ILIKE '%acolhimento%');
UPDATE public.ministerios SET slug = 'louvor' WHERE slug IS NULL AND (nome ILIKE '%louvor%' OR nome ILIKE '%worship%' OR nome ILIKE '%música%' OR nome ILIKE '%musica%');

-- 3) Update get_my_ministries() to return slug
CREATE OR REPLACE FUNCTION public.get_my_ministries()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', m.id,
      'nome', m.nome,
      'slug', m.slug,
      'descricao', m.descricao
    )
  ), '[]'::json)
  INTO result
  FROM ministerio_voluntarios mv
  JOIN ministerios m ON m.id = mv.ministerio_id
  WHERE mv.user_id = auth.uid()
    AND mv.ativo = true
    AND m.ativo = true;

  RETURN result;
END;
$function$;

-- 4) Update is_kids_team to use slug instead of ILIKE
CREATE OR REPLACE FUNCTION public.is_kids_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM ministerio_voluntarios mv
      JOIN ministerios m ON m.id = mv.ministerio_id
      WHERE mv.user_id = _user_id
        AND mv.ativo = true
        AND m.ativo = true
        AND m.slug = 'kids'
    )
$function$;


-- === MIGRATION: 20260213225110_6b967023-5546-4eac-b266-79e9be8c8961.sql ===

DROP FUNCTION IF EXISTS public.get_my_ministries();

CREATE OR REPLACE FUNCTION public.get_my_ministries()
 RETURNS TABLE (ministerio_id uuid, nome text, slug text, descricao text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT m.id AS ministerio_id, m.nome, m.slug, m.descricao
  FROM ministerio_voluntarios mv
  JOIN ministerios m ON m.id = mv.ministerio_id
  WHERE mv.user_id = auth.uid()
    AND mv.ativo = true
    AND m.ativo = true;
$$;


-- === MIGRATION: 20260218182410_76aa010b-4edb-4883-85e7-67cf3c5a4729.sql ===
ALTER TABLE escalas DROP COLUMN IF EXISTS turno;
ALTER TABLE escalas DROP COLUMN IF EXISTS status;
ALTER TABLE escalas DROP COLUMN IF EXISTS status_geral;

-- === MIGRATION: 20260218204206_ce1f604f-0812-49ff-a5e8-19bbbd9d4ca7.sql ===

ALTER TABLE escalas ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'ausente'));


-- === MIGRATION: 20260219225509_f9fbce66-4010-4261-a4e5-7905e39a946d.sql ===

-- 1. Create enum papel_ministerial
CREATE TYPE public.papel_ministerial AS ENUM ('lider', 'voluntario');

-- 2. Rename table ministerio_voluntarios → ministerio_usuarios
ALTER TABLE public.ministerio_voluntarios RENAME TO ministerio_usuarios;

-- 3. Add 'papel' column with default 'voluntario'
ALTER TABLE public.ministerio_usuarios 
  ADD COLUMN papel papel_ministerial NOT NULL DEFAULT 'voluntario';

-- 4. Populate 'papel' = 'lider' for existing leaders
UPDATE public.ministerio_usuarios mu
SET papel = 'lider'
FROM public.ministerios m
JOIN public.profiles p ON p.id = m.lider_id
WHERE mu.ministerio_id = m.id
  AND mu.user_id = p.user_id
  AND m.lider_id IS NOT NULL;

-- 5. Insert missing leaders
INSERT INTO public.ministerio_usuarios (ministerio_id, user_id, papel, ativo)
SELECT m.id, p.user_id, 'lider', true
FROM public.ministerios m
JOIN public.profiles p ON p.id = m.lider_id
WHERE m.lider_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.ministerio_usuarios mu
    WHERE mu.ministerio_id = m.id AND mu.user_id = p.user_id
  );

-- 6. Create authorization function
CREATE OR REPLACE FUNCTION public.can_ministry(
  _user_id uuid,
  _action text,
  _ministerio_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR (
      _action = 'read' AND EXISTS (
        SELECT 1 FROM ministerio_usuarios
        WHERE user_id = _user_id
          AND ministerio_id = _ministerio_id
          AND ativo = true
      )
    )
    OR (
      _action = 'write' AND EXISTS (
        SELECT 1 FROM ministerio_usuarios
        WHERE user_id = _user_id
          AND ministerio_id = _ministerio_id
          AND papel = 'lider'
          AND ativo = true
      )
    );
$$;

-- 7. Drop and recreate get_my_ministries with new return type
DROP FUNCTION IF EXISTS public.get_my_ministries();

CREATE FUNCTION public.get_my_ministries()
RETURNS TABLE(ministerio_id uuid, nome text, slug text, descricao text, papel text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id as ministerio_id,
    m.nome,
    m.slug,
    m.descricao,
    mu.papel::text
  FROM ministerio_usuarios mu
  JOIN ministerios m ON m.id = mu.ministerio_id
  WHERE mu.user_id = auth.uid()
    AND mu.ativo = true
    AND m.ativo = true
  ORDER BY m.nome;
$$;

-- 8. Update is_kids_team to use new table name
CREATE OR REPLACE FUNCTION public.is_kids_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM ministerio_usuarios mu
      JOIN ministerios m ON m.id = mu.ministerio_id
      WHERE mu.user_id = _user_id
        AND mu.ativo = true
        AND m.ativo = true
        AND m.slug = 'kids'
    )
$$;

-- 9. Index for performance
CREATE INDEX IF NOT EXISTS idx_ministerio_usuarios_papel 
ON public.ministerio_usuarios (user_id, ministerio_id, papel, ativo);


-- === MIGRATION: 20260219230647_97ee164f-16a7-46bf-8b7b-82e0efa8d691.sql ===

-- 1. Atualizar can_ministry para modelo híbrido (ministerio_usuarios + ministerios.lider_id)
CREATE OR REPLACE FUNCTION public.can_ministry(_user_id uuid, _action text, _ministerio_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR (
      _action = 'read' AND (
        -- Novo modelo: ministerio_usuarios
        EXISTS (
          SELECT 1 FROM ministerio_usuarios
          WHERE user_id = _user_id
            AND ministerio_id = _ministerio_id
            AND ativo = true
        )
        -- Legado: ministerios.lider_id
        OR EXISTS (
          SELECT 1 FROM ministerios m
          JOIN profiles p ON p.id = m.lider_id
          WHERE m.id = _ministerio_id
            AND p.user_id = _user_id
        )
      )
    )
    OR (
      _action = 'write' AND (
        -- Novo modelo: papel = lider
        EXISTS (
          SELECT 1 FROM ministerio_usuarios
          WHERE user_id = _user_id
            AND ministerio_id = _ministerio_id
            AND papel = 'lider'
            AND ativo = true
        )
        -- Legado: ministerios.lider_id
        OR EXISTS (
          SELECT 1 FROM ministerios m
          JOIN profiles p ON p.id = m.lider_id
          WHERE m.id = _ministerio_id
            AND p.user_id = _user_id
        )
      )
    );
$$;

-- 2. Substituir policies de escalas para usar can_ministry

-- DROP das policies antigas de líder
DROP POLICY IF EXISTS "Leaders can view escalas of their ministerios" ON public.escalas;
DROP POLICY IF EXISTS "Leaders can insert escalas in their ministerios" ON public.escalas;
DROP POLICY IF EXISTS "Leaders can update escalas of their ministerios" ON public.escalas;
DROP POLICY IF EXISTS "Leaders can delete escalas of their ministerios" ON public.escalas;

-- SELECT: can_ministry com 'read'
CREATE POLICY "Ministry members can view escalas"
ON public.escalas
FOR SELECT
USING (can_ministry(auth.uid(), 'read', ministerio_id));

-- INSERT: can_ministry com 'write'
CREATE POLICY "Ministry leaders can insert escalas"
ON public.escalas
FOR INSERT
WITH CHECK (can_ministry(auth.uid(), 'write', ministerio_id));

-- UPDATE: can_ministry com 'write'
CREATE POLICY "Ministry leaders can update escalas"
ON public.escalas
FOR UPDATE
USING (can_ministry(auth.uid(), 'write', ministerio_id))
WITH CHECK (can_ministry(auth.uid(), 'write', ministerio_id));

-- DELETE: can_ministry com 'write'
CREATE POLICY "Ministry leaders can delete escalas"
ON public.escalas
FOR DELETE
USING (can_ministry(auth.uid(), 'write', ministerio_id));


-- === MIGRATION: 20260219232541_bafbb519-1989-4877-8305-c89c37334a67.sql ===

-- Fase 2: Migrar policies de ministerio_usuarios para can_ministry

-- DROP da policy legada de líder
DROP POLICY IF EXISTS "Leaders can manage their ministry volunteers" ON public.ministerio_usuarios;

-- Nova policy usando can_ministry com 'write'
CREATE POLICY "Ministry leaders can manage volunteers"
ON public.ministerio_usuarios
FOR ALL
USING (can_ministry(auth.uid(), 'write', ministerio_id))
WITH CHECK (can_ministry(auth.uid(), 'write', ministerio_id));


-- === MIGRATION: 20260219232853_3fc0aac5-f8a8-4c4a-a671-13ab7851a3c2.sql ===

-- Fase 3: Migrar policies de ministerio_voluntarios_funcoes e escala_checkins

-- === ministerio_voluntarios_funcoes ===

-- DROP policy legada de líder
DROP POLICY IF EXISTS "Leaders can manage their ministry volunteer functions" ON public.ministerio_voluntarios_funcoes;

-- Nova policy usando can_ministry via subquery no ministerio_id
CREATE POLICY "Ministry leaders can manage volunteer functions"
ON public.ministerio_voluntarios_funcoes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    WHERE mu.id = ministerio_voluntarios_funcoes.ministerio_voluntario_id
      AND can_ministry(auth.uid(), 'write', mu.ministerio_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    WHERE mu.id = ministerio_voluntarios_funcoes.ministerio_voluntario_id
      AND can_ministry(auth.uid(), 'write', mu.ministerio_id)
  )
);

-- === escala_checkins ===

-- DROP policies legadas de líder
DROP POLICY IF EXISTS "Leader can view ministry checkins" ON public.escala_checkins;
DROP POLICY IF EXISTS "Líder vê check-ins dos ministérios que lidera" ON public.escala_checkins;

-- Nova policy de SELECT para líderes usando can_ministry
CREATE POLICY "Ministry leaders can view checkins"
ON public.escala_checkins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM escalas e
    WHERE e.id = escala_checkins.escala_id
      AND can_ministry(auth.uid(), 'read', e.ministerio_id)
  )
);


-- === MIGRATION: 20260219233210_0023abb6-4732-4600-814e-d8e4eed8870d.sql ===

-- Fase 4: Atualizar RPC get_eligible_volunteers_for_ministry para modelo híbrido

CREATE OR REPLACE FUNCTION public.get_eligible_volunteers_for_ministry(p_ministerio_id uuid, p_search_term text DEFAULT ''::text)
 RETURNS TABLE(id uuid, nome text, email text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_clean_search text;
BEGIN
  -- Autorização via can_ministry (híbrido: ministerio_usuarios + ministerios.lider_id)
  IF NOT can_ministry(auth.uid(), 'write', p_ministerio_id) THEN
    RAISE EXCEPTION 'Unauthorized: You must be an admin or leader of this ministry';
  END IF;

  v_clean_search := COALESCE(TRIM(p_search_term), '');

  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.nome,
    p.email,
    p.user_id
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role IN ('admin', 'lider', 'voluntario', 'financeiro')
    AND NOT EXISTS (
      SELECT 1 FROM ministerio_usuarios mu
      WHERE mu.ministerio_id = p_ministerio_id
        AND mu.user_id = p.user_id
    )
    AND (
      v_clean_search = ''
      OR p.nome ILIKE '%' || v_clean_search || '%'
      OR p.email ILIKE '%' || v_clean_search || '%'
    )
  ORDER BY p.nome
  LIMIT 50;
END;
$function$;


-- === MIGRATION: 20260219233450_bf0a429b-1dc7-4190-b837-8798486ca5ec.sql ===

-- Fase 5: Atualizar trigger notify_on_escala_status_change para identificar líderes via ministerio_usuarios (híbrido)

CREATE OR REPLACE FUNCTION public.notify_on_escala_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  voluntario_nome TEXT;
  ministerio_nome TEXT;
  lider_record RECORD;
  admin_record RECORD;
  data_formatada TEXT;
  status_msg TEXT;
  notification_msg TEXT;
  v_notified_ids UUID[] := '{}';
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT nome INTO voluntario_nome FROM profiles WHERE id = NEW.voluntario_id;
  SELECT nome INTO ministerio_nome FROM ministerios WHERE id = NEW.ministerio_id;

  data_formatada := to_char(NEW.data, 'DD/MM/YYYY');

  IF NEW.status = 'confirmado' THEN
    status_msg := 'confirmou';
    notification_msg := COALESCE(voluntario_nome, 'Um voluntário') || ' ' || status_msg || ' presença na escala de ' || data_formatada || ' como ' || NEW.funcao || '.';
  ELSIF NEW.status = 'ausente' THEN
    status_msg := 'recusou';
    notification_msg := COALESCE(voluntario_nome, 'Um voluntário') || ' ' || status_msg || ' a escala de ' || data_formatada || ' como ' || NEW.funcao || '.';
    IF NEW.justificativa IS NOT NULL AND NEW.justificativa != '' THEN
      notification_msg := notification_msg || ' Justificativa: ' || NEW.justificativa;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Notificar líderes via ministerio_usuarios (novo modelo)
  FOR lider_record IN
    SELECT p.id as profile_id
    FROM ministerio_usuarios mu
    JOIN profiles p ON p.user_id = mu.user_id
    WHERE mu.ministerio_id = NEW.ministerio_id
      AND mu.papel = 'lider'
      AND mu.ativo = true
  LOOP
    INSERT INTO notificacoes (voluntario_id, escala_id, ministerio_id, tipo, titulo, mensagem)
    VALUES (lider_record.profile_id, NEW.id, NEW.ministerio_id, 'status_alterado', 'Resposta de escala', notification_msg);
    v_notified_ids := array_append(v_notified_ids, lider_record.profile_id);
  END LOOP;

  -- Notificar líder legado (ministerios.lider_id) se ainda não notificado
  DECLARE
    v_legacy_lider_id UUID;
  BEGIN
    SELECT m.lider_id INTO v_legacy_lider_id FROM ministerios m WHERE m.id = NEW.ministerio_id;
    IF v_legacy_lider_id IS NOT NULL AND NOT (v_legacy_lider_id = ANY(v_notified_ids)) THEN
      INSERT INTO notificacoes (voluntario_id, escala_id, ministerio_id, tipo, titulo, mensagem)
      VALUES (v_legacy_lider_id, NEW.id, NEW.ministerio_id, 'status_alterado', 'Resposta de escala', notification_msg);
      v_notified_ids := array_append(v_notified_ids, v_legacy_lider_id);
    END IF;
  END;

  -- Notificar admins (exceto quem já foi notificado)
  FOR admin_record IN
    SELECT p.id as profile_id
    FROM user_roles ur
    JOIN profiles p ON p.user_id = ur.user_id
    WHERE ur.role = 'admin'
      AND NOT (p.id = ANY(v_notified_ids))
  LOOP
    INSERT INTO notificacoes (voluntario_id, escala_id, ministerio_id, tipo, titulo, mensagem)
    VALUES (admin_record.profile_id, NEW.id, NEW.ministerio_id, 'status_alterado', 'Resposta de escala', notification_msg);
  END LOOP;

  RETURN NEW;
END;
$function$;


-- === MIGRATION: 20260219233901_ab9a0371-f362-4755-9e8a-1e406f1150a0.sql ===

-- Tabela de módulos disponíveis por ministério
CREATE TABLE public.ministerio_modulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministerio_id UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  modulo_slug TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ministerio_id, modulo_slug)
);

-- RLS
ALTER TABLE public.ministerio_modulos ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver módulos ativos (necessário para renderização de menu)
CREATE POLICY "Authenticated can view active modules"
ON public.ministerio_modulos
FOR SELECT
USING (ativo = true);

-- Admins gerenciam módulos
CREATE POLICY "Admins can manage modules"
ON public.ministerio_modulos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger de updated_at
CREATE TRIGGER update_ministerio_modulos_updated_at
BEFORE UPDATE ON public.ministerio_modulos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: módulo check-in para o ministério Kids (se existir)
INSERT INTO public.ministerio_modulos (ministerio_id, modulo_slug, nome, descricao, icone, ordem)
SELECT id, 'check-in', 'Check-in', 'Check-in de crianças', 'Baby', 0
FROM public.ministerios
WHERE slug = 'kids'
ON CONFLICT DO NOTHING;


-- === MIGRATION: 20260225015453_587c6fca-9ad3-45d9-b4b9-2500d45981b0.sql ===
CREATE POLICY "Ministry members can view fellow members"
ON public.ministerio_usuarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ministerio_usuarios my
    WHERE my.user_id = auth.uid()
      AND my.ministerio_id = ministerio_usuarios.ministerio_id
      AND my.ativo = true
  )
);

-- === MIGRATION: 20260225135043_9669e707-fc9c-4d73-ba2d-cd951b77a719.sql ===
ALTER TABLE public.ministerio_usuarios ADD CONSTRAINT ministerio_usuarios_ministerio_id_user_id_key UNIQUE (ministerio_id, user_id);

-- === MIGRATION: 20260228174000_create_igrejas.sql ===
-- Cria a tabela igrejas (foi criada manualmente no projeto original, sem migration)
CREATE TABLE IF NOT EXISTS igrejas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text        NOT NULL,
  ativa       boolean     DEFAULT true,
  cidade      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE igrejas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "igrejas_public_read"
  ON igrejas FOR SELECT
  USING (true);

CREATE POLICY "igrejas_admin_all"
  ON igrejas FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  );


-- === MIGRATION: 20260228174029_9ea15cdb-1d7d-4088-a2c1-5de7ae2f93ee.sql ===

-- Make responsavel_id nullable for QR/auto public check-ins
ALTER TABLE checkins_kids ALTER COLUMN responsavel_id DROP NOT NULL;

-- RPC: public check-in by QR token
CREATE OR REPLACE FUNCTION public.public_checkin_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_crianca record;
  v_existing record;
  v_inicio_dia timestamptz;
BEGIN
  SELECT id, nome, sala_id, igreja_id INTO v_crianca
  FROM criancas WHERE qr_token = p_token;

  IF v_crianca IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Cartão inválido ou não encontrado');
  END IF;

  v_inicio_dia := date_trunc('day', now());

  SELECT id INTO v_existing
  FROM checkins_kids
  WHERE crianca_id = v_crianca.id
    AND status = 'presente'
    AND checkin_at >= v_inicio_dia;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Esta criança já está presente hoje', 'nome', v_crianca.nome);
  END IF;

  INSERT INTO checkins_kids (crianca_id, sala_id, status, checkin_at)
  VALUES (v_crianca.id, v_crianca.sala_id, 'presente', now());

  RETURN json_build_object('success', true, 'message', 'Presença registrada', 'nome', v_crianca.nome);
END;
$$;

-- RPC: public manual check-in
CREATE OR REPLACE FUNCTION public.public_checkin_manual(p_crianca_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_crianca record;
  v_existing record;
  v_inicio_dia timestamptz;
BEGIN
  SELECT id, nome, sala_id, igreja_id INTO v_crianca
  FROM criancas WHERE id = p_crianca_id;

  IF v_crianca IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Criança não encontrada');
  END IF;

  v_inicio_dia := date_trunc('day', now());

  SELECT id INTO v_existing
  FROM checkins_kids
  WHERE crianca_id = v_crianca.id
    AND status = 'presente'
    AND checkin_at >= v_inicio_dia;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Esta criança já está presente hoje', 'nome', v_crianca.nome);
  END IF;

  INSERT INTO checkins_kids (crianca_id, sala_id, status, checkin_at)
  VALUES (v_crianca.id, v_crianca.sala_id, 'presente', now());

  RETURN json_build_object('success', true, 'message', 'Presença registrada', 'nome', v_crianca.nome);
END;
$$;

-- RPC: public search criancas by igreja
CREATE OR REPLACE FUNCTION public.public_search_criancas(p_igreja_id uuid, p_search text)
RETURNS TABLE(id uuid, nome text, data_nascimento date, sala_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome, c.data_nascimento, c.sala_id
  FROM criancas c
  WHERE c.igreja_id = p_igreja_id
    AND c.nome ILIKE '%' || COALESCE(TRIM(p_search), '') || '%'
  ORDER BY c.nome
  LIMIT 20;
END;
$$;

-- RPC: public get today's presentes
CREATE OR REPLACE FUNCTION public.public_presentes_hoje(p_igreja_id uuid)
RETURNS TABLE(id uuid, checkin_at timestamptz, crianca_nome text, sala_nome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ck.id, ck.checkin_at, c.nome AS crianca_nome, s.nome AS sala_nome
  FROM checkins_kids ck
  JOIN criancas c ON c.id = ck.crianca_id
  LEFT JOIN salas s ON s.id = ck.sala_id
  WHERE c.igreja_id = p_igreja_id
    AND ck.status = 'presente'
    AND ck.checkin_at >= date_trunc('day', now())
  ORDER BY ck.checkin_at DESC;
END;
$$;

-- RPC: get default igreja
CREATE OR REPLACE FUNCTION public.public_get_default_igreja()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM igrejas WHERE ativa = true ORDER BY created_at LIMIT 1;
$$;

-- Grant anon access to public RPCs
GRANT EXECUTE ON FUNCTION public.public_checkin_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_checkin_manual(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_search_criancas(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_presentes_hoje(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_default_igreja() TO anon, authenticated;


-- === MIGRATION: 20260228174051_701c51b8-92d5-4335-a950-9f04129a3042.sql ===

-- Add missing FK from checkins_kids.sala_id to salas.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'checkins_kids_sala_id_fkey'
  ) THEN
    ALTER TABLE checkins_kids
    ADD CONSTRAINT checkins_kids_sala_id_fkey
    FOREIGN KEY (sala_id) REFERENCES salas(id);
  END IF;
END $$;


-- === MIGRATION: 20260228182618_b089620b-a97a-4f7e-b647-bec87eacc30e.sql ===

CREATE OR REPLACE FUNCTION public.get_my_ministries()
 RETURNS TABLE(ministerio_id uuid, nome text, slug text, descricao text, papel text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin: return ALL active ministries
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN QUERY
    SELECT
      m.id as ministerio_id,
      m.nome,
      m.slug,
      m.descricao,
      'admin'::text as papel
    FROM ministerios m
    WHERE m.ativo = true
    ORDER BY m.nome;
    RETURN;
  END IF;

  -- Non-admin: return only linked ministries
  RETURN QUERY
  SELECT
    m.id as ministerio_id,
    m.nome,
    m.slug,
    m.descricao,
    mu.papel::text
  FROM ministerio_usuarios mu
  JOIN ministerios m ON m.id = mu.ministerio_id
  WHERE mu.user_id = auth.uid()
    AND mu.ativo = true
    AND m.ativo = true
  ORDER BY m.nome;
END;
$function$;


-- === MIGRATION: 20260301140924_08e3da14-1491-4685-bf37-5752f61c1f4d.sql ===

-- Fix ministerio_modulos: change SELECT policies from RESTRICTIVE to PERMISSIVE
-- so admin can access without ministerio_usuarios entry

-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Admins can manage modules" ON ministerio_modulos;
DROP POLICY IF EXISTS "Authenticated can view active modules" ON ministerio_modulos;
DROP POLICY IF EXISTS "Ministerio members can view ministerio_modulos" ON ministerio_modulos;
DROP POLICY IF EXISTS "Usuarios veem apenas modulos do seu ministerio" ON ministerio_modulos;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins full access modules"
  ON ministerio_modulos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated view active modules"
  ON ministerio_modulos FOR SELECT
  TO authenticated
  USING (ativo = true);

CREATE POLICY "Members view own ministry modules"
  ON ministerio_modulos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = ministerio_modulos.ministerio_id
        AND ativo = true
    )
  );


-- === MIGRATION: 20260301140939_e609acf3-58a9-46cb-a75e-4a857026d329.sql ===

-- Also clean up remaining redundant RESTRICTIVE write policies on ministerio_modulos
-- that overlap with the new permissive admin policy

DROP POLICY IF EXISTS "Ministerio leaders delete ministerio_modulos" ON ministerio_modulos;
DROP POLICY IF EXISTS "Ministerio leaders insert ministerio_modulos" ON ministerio_modulos;
DROP POLICY IF EXISTS "Ministerio leaders update ministerio_modulos" ON ministerio_modulos;
DROP POLICY IF EXISTS "Usuarios atualizam modulos apenas do seu ministerio" ON ministerio_modulos;
DROP POLICY IF EXISTS "Usuarios deletam modulos apenas do seu ministerio" ON ministerio_modulos;
DROP POLICY IF EXISTS "Usuarios inserem modulos apenas no seu ministerio" ON ministerio_modulos;

-- Recreate as PERMISSIVE for leaders
CREATE POLICY "Leaders manage own ministry modules"
  ON ministerio_modulos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = ministerio_modulos.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = ministerio_modulos.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  );


-- === MIGRATION: 20260425000001_add_is_core_to_ministerios.sql ===
-- Etapa 1: Adiciona is_core na tabela ministerios
-- Ministérios core não podem ser excluídos, apenas inativados.

-- 1. Adiciona coluna
ALTER TABLE ministerios
  ADD COLUMN IF NOT EXISTS is_core boolean NOT NULL DEFAULT false;

-- 2. Trigger que bloqueia DELETE em ministérios core
CREATE OR REPLACE FUNCTION prevent_core_ministerio_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_core = true THEN
    RAISE EXCEPTION 'Ministérios core não podem ser excluídos.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_core_ministerios ON ministerios;
CREATE TRIGGER trg_protect_core_ministerios
  BEFORE DELETE ON ministerios
  FOR EACH ROW EXECUTE FUNCTION prevent_core_ministerio_delete();


-- === MIGRATION: 20260425000002_create_ministerio_documentos.sql ===
-- Etapa 2: Tabela de documentos por ministério + RLS + bucket

-- ─── TABELA ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ministerio_documentos (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome         text        NOT NULL,
  descricao    text,
  arquivo_url  text        NOT NULL,
  arquivo_nome text        NOT NULL,
  arquivo_tipo text        NOT NULL,
  criado_por   uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE ministerio_documentos ENABLE ROW LEVEL SECURITY;

-- Admin e super_admin: acesso total
CREATE POLICY "admin_all_ministerio_documentos"
  ON ministerio_documentos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('admin', 'super_admin')
    )
  );

-- Membros do ministério: somente leitura
CREATE POLICY "member_select_ministerio_documentos"
  ON ministerio_documentos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id       = auth.uid()
        AND ministerio_id = ministerio_documentos.ministerio_id
        AND ativo         = true
    )
  );

-- Líderes do ministério: inserir
CREATE POLICY "leader_insert_ministerio_documentos"
  ON ministerio_documentos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id       = auth.uid()
        AND ministerio_id = ministerio_documentos.ministerio_id
        AND papel         = 'lider'
        AND ativo         = true
    )
  );

-- Líderes do ministério: deletar
CREATE POLICY "leader_delete_ministerio_documentos"
  ON ministerio_documentos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id       = auth.uid()
        AND ministerio_id = ministerio_documentos.ministerio_id
        AND papel         = 'lider'
        AND ativo         = true
    )
  );

-- ─── STORAGE BUCKET (criar manualmente no dashboard) ─────────────────────────
-- Nome do bucket: ministerio-docs
-- Tipo: Public (para simplificar acesso via URL direta)
-- A segurança é garantida pelas RLS da tabela ministerio_documentos
--
-- Políticas recomendadas no bucket (via SQL Editor do Supabase):
--
-- CREATE POLICY "autenticados_leem_ministerio_docs"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (bucket_id = 'ministerio-docs');
--
-- CREATE POLICY "lideres_e_admins_upload_ministerio_docs"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'ministerio-docs');
--
-- CREATE POLICY "lideres_e_admins_delete_ministerio_docs"
--   ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'ministerio-docs');


-- === MIGRATION: 20260425000003_create_escalas_flow.sql ===
-- Etapa 3: Novo fluxo de escalas — periodos → eventos → convocação → escala por líder

-- ─── TABELA periodos_escala ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS periodos_escala (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome        text        NOT NULL,
  mes         integer     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano         integer     NOT NULL CHECK (ano BETWEEN 2020 AND 2100),
  status      text        NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  criado_por  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA eventos_escala ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos_escala (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id      uuid        NOT NULL REFERENCES periodos_escala(id) ON DELETE CASCADE,
  church_id       uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  titulo          text        NOT NULL,
  tipo            text        NOT NULL DEFAULT 'culto',
  data_evento     date        NOT NULL,
  horario_inicio  time,
  horario_fim     time,
  descricao       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA evento_ministerios ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evento_ministerios (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id            uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  ministerio_id        uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  status               text        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'escala_criada', 'concluido')),
  notificacao_enviada  boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

-- ─── ALTER escalas ────────────────────────────────────────────────────────────
ALTER TABLE escalas
  ADD COLUMN IF NOT EXISTS evento_escala_id uuid REFERENCES eventos_escala(id) ON DELETE SET NULL;

-- ─── updated_at triggers ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_periodos_escala_updated_at'
  ) THEN
    CREATE TRIGGER trg_periodos_escala_updated_at
      BEFORE UPDATE ON periodos_escala
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_eventos_escala_updated_at'
  ) THEN
    CREATE TRIGGER trg_eventos_escala_updated_at
      BEFORE UPDATE ON eventos_escala
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── RLS periodos_escala ──────────────────────────────────────────────────────
ALTER TABLE periodos_escala ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_periodos_escala"
  ON periodos_escala FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  );

CREATE POLICY "lider_select_periodos_escala"
  ON periodos_escala FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND papel = 'lider'
        AND ativo = true
    )
  );

-- ─── RLS eventos_escala ───────────────────────────────────────────────────────
ALTER TABLE eventos_escala ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_eventos_escala"
  ON eventos_escala FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  );

CREATE POLICY "lider_select_eventos_escala"
  ON eventos_escala FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND papel = 'lider'
        AND ativo = true
    )
  );

CREATE POLICY "membro_select_eventos_escala"
  ON eventos_escala FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ativo = true
    )
  );

-- ─── RLS evento_ministerios ───────────────────────────────────────────────────
ALTER TABLE evento_ministerios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_evento_ministerios"
  ON evento_ministerios FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  );

CREATE POLICY "lider_select_evento_ministerios"
  ON evento_ministerios FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = evento_ministerios.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  );

CREATE POLICY "lider_update_evento_ministerios"
  ON evento_ministerios FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = evento_ministerios.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = evento_ministerios.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  );

CREATE POLICY "membro_select_evento_ministerios"
  ON evento_ministerios FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = evento_ministerios.ministerio_id
        AND ativo = true
    )
  );


-- === MIGRATION: 20260426000001_create_musica_tables.sql ===
-- Etapa Música: repertório, músicas do culto, paleta de cores

-- ─── TABELA musicas_repertorio ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS musicas_repertorio (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  ministerio_id uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  titulo        text        NOT NULL,
  artista       text,
  tom           text,
  link_youtube  text,
  cifra_url     text,
  observacoes   text,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA musicas_culto ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS musicas_culto (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id       uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  ministerio_id   uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  musica_id       uuid        REFERENCES musicas_repertorio(id) ON DELETE SET NULL,
  titulo_avulso   text,
  artista_avulso  text,
  link_youtube    text,
  ordem           integer     NOT NULL DEFAULT 0,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA culto_paleta_cores ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS culto_paleta_cores (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id      uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  ministerio_id  uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  cor_primaria   text        NOT NULL,
  cor_secundaria text,
  cor_acento     text,
  observacao     text,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

-- ─── TRIGGER updated_at ───────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_musicas_repertorio_updated_at') THEN
    CREATE TRIGGER trg_musicas_repertorio_updated_at
      BEFORE UPDATE ON musicas_repertorio
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_culto_paleta_cores_updated_at') THEN
    CREATE TRIGGER trg_culto_paleta_cores_updated_at
      BEFORE UPDATE ON culto_paleta_cores
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── TRIGGER auto-insert em musicas_repertorio ────────────────────────────────
-- Ao inserir em musicas_culto, se musica_id for null e titulo_avulso não for null,
-- cria automaticamente no repertório e preenche musica_id.
CREATE OR REPLACE FUNCTION auto_add_musica_repertorio()
RETURNS TRIGGER AS $$
DECLARE
  v_nova_id  uuid;
  v_church_id uuid;
BEGIN
  IF NEW.musica_id IS NULL AND NEW.titulo_avulso IS NOT NULL THEN
    SELECT church_id INTO v_church_id FROM eventos_escala WHERE id = NEW.evento_id;

    INSERT INTO musicas_repertorio (church_id, ministerio_id, titulo, artista, link_youtube, created_by)
    VALUES (v_church_id, NEW.ministerio_id, NEW.titulo_avulso, NEW.artista_avulso, NEW.link_youtube, NEW.created_by)
    RETURNING id INTO v_nova_id;

    NEW.musica_id = v_nova_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_add_musica_repertorio') THEN
    CREATE TRIGGER trg_auto_add_musica_repertorio
      BEFORE INSERT ON musicas_culto
      FOR EACH ROW EXECUTE FUNCTION auto_add_musica_repertorio();
  END IF;
END $$;

-- ─── RLS musicas_repertorio ───────────────────────────────────────────────────
ALTER TABLE musicas_repertorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_musicas_repertorio"
  ON musicas_repertorio FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_musicas_repertorio"
  ON musicas_repertorio FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_repertorio.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_repertorio.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_musicas_repertorio"
  ON musicas_repertorio FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_repertorio.ministerio_id AND ativo = true
  ));

-- ─── RLS musicas_culto ────────────────────────────────────────────────────────
ALTER TABLE musicas_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_musicas_culto"
  ON musicas_culto FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_musicas_culto"
  ON musicas_culto FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_musicas_culto"
  ON musicas_culto FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_culto.ministerio_id AND ativo = true
  ));

-- ─── RLS culto_paleta_cores ───────────────────────────────────────────────────
ALTER TABLE culto_paleta_cores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_culto_paleta_cores"
  ON culto_paleta_cores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_culto_paleta_cores"
  ON culto_paleta_cores FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = culto_paleta_cores.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = culto_paleta_cores.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_culto_paleta_cores"
  ON culto_paleta_cores FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = culto_paleta_cores.ministerio_id AND ativo = true
  ));


-- === MIGRATION: 20260426000002_create_celebracao_tables.sql ===
-- Etapa Celebração: liturgia do culto, itens e avisos

-- ─── TABELA liturgia_culto ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liturgia_culto (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id       uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  ministerio_id   uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  observacoes_gerais text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

-- ─── TABELA liturgia_itens ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liturgia_itens (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  liturgia_id       uuid        NOT NULL REFERENCES liturgia_culto(id) ON DELETE CASCADE,
  ordem             integer     NOT NULL DEFAULT 0,
  tipo              text        NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('abertura','louvor','oracao','palavra','aviso','oferta','encerramento','outro')),
  titulo            text        NOT NULL,
  responsavel       text,
  duracao_minutos   integer,
  observacao        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA avisos_culto ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avisos_culto (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  aviso_id      uuid        NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
  ministerio_id uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  ordem         integer     NOT NULL DEFAULT 0,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, aviso_id, ministerio_id)
);

-- ─── TRIGGER updated_at ───────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_liturgia_culto_updated_at') THEN
    CREATE TRIGGER trg_liturgia_culto_updated_at
      BEFORE UPDATE ON liturgia_culto
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── RLS liturgia_culto ───────────────────────────────────────────────────────
ALTER TABLE liturgia_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_liturgia_culto"
  ON liturgia_culto FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_liturgia_culto"
  ON liturgia_culto FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = liturgia_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = liturgia_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_liturgia_culto"
  ON liturgia_culto FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = liturgia_culto.ministerio_id AND ativo = true
  ));

-- ─── RLS liturgia_itens ───────────────────────────────────────────────────────
ALTER TABLE liturgia_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_liturgia_itens"
  ON liturgia_itens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_liturgia_itens"
  ON liturgia_itens FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM liturgia_culto lc
    JOIN ministerio_usuarios mu ON mu.ministerio_id = lc.ministerio_id
    WHERE lc.id = liturgia_itens.liturgia_id
      AND mu.user_id = auth.uid()
      AND mu.papel = 'lider'
      AND mu.ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM liturgia_culto lc
    JOIN ministerio_usuarios mu ON mu.ministerio_id = lc.ministerio_id
    WHERE lc.id = liturgia_itens.liturgia_id
      AND mu.user_id = auth.uid()
      AND mu.papel = 'lider'
      AND mu.ativo = true
  ));

CREATE POLICY "membro_select_liturgia_itens"
  ON liturgia_itens FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM liturgia_culto lc
    JOIN ministerio_usuarios mu ON mu.ministerio_id = lc.ministerio_id
    WHERE lc.id = liturgia_itens.liturgia_id
      AND mu.user_id = auth.uid()
      AND mu.ativo = true
  ));

-- ─── RLS avisos_culto ─────────────────────────────────────────────────────────
ALTER TABLE avisos_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_avisos_culto"
  ON avisos_culto FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_avisos_culto"
  ON avisos_culto FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = avisos_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = avisos_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_avisos_culto"
  ON avisos_culto FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = avisos_culto.ministerio_id AND ativo = true
  ));


-- === MIGRATION: 20260427000001_create_mca_tables.sql ===
-- Etapa MCA: salas, crianças, responsáveis, check-ins, planos de aula, comunicações

-- ─── TABELA mca_salas ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_salas (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  ministerio_id    uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome             text        NOT NULL,
  faixa_etaria_min integer,
  faixa_etaria_max integer,
  capacidade       integer,
  professor_id     uuid,
  ativo            boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_criancas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_criancas (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome             text        NOT NULL,
  data_nascimento  date,
  foto_url         text,
  sala_id          uuid        REFERENCES mca_salas(id) ON DELETE SET NULL,
  observacoes      text,
  ativo            boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_responsaveis ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_responsaveis (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id  uuid        NOT NULL REFERENCES mca_criancas(id) ON DELETE CASCADE,
  perfil_id   uuid,
  nome        text        NOT NULL,
  telefone    text        NOT NULL,
  parentesco  text        NOT NULL DEFAULT 'responsável',
  is_primary  boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_checkins ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_checkins (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id      uuid        NOT NULL REFERENCES mca_criancas(id) ON DELETE CASCADE,
  evento_id       uuid        REFERENCES eventos_escala(id) ON DELETE SET NULL,
  sala_id         uuid        NOT NULL REFERENCES mca_salas(id) ON DELETE CASCADE,
  church_id       uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  checkin_at      timestamptz NOT NULL DEFAULT now(),
  checkout_at     timestamptz,
  registrado_por  uuid,
  observacao      text
);

-- ─── TABELA mca_planos_aula ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_planos_aula (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id      uuid        NOT NULL REFERENCES mca_salas(id) ON DELETE CASCADE,
  professor_id uuid,
  titulo       text        NOT NULL,
  data_aula    date        NOT NULL,
  objetivos    text,
  conteudo     text,
  anotacoes    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_plano_arquivos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_plano_arquivos (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id       uuid        NOT NULL REFERENCES mca_planos_aula(id) ON DELETE CASCADE,
  nome           text        NOT NULL,
  arquivo_url    text        NOT NULL,
  arquivo_tipo   text        NOT NULL,
  tamanho_bytes  integer,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_comunicacoes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_comunicacoes (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id           uuid        NOT NULL REFERENCES mca_criancas(id) ON DELETE CASCADE,
  responsavel_telefone text        NOT NULL,
  mensagem_original    text        NOT NULL,
  mensagem_melhorada   text,
  enviado              boolean     NOT NULL DEFAULT false,
  enviado_at           timestamptz,
  criado_por           uuid,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── TRIGGERS updated_at ──────────────────────────────────────────────────────
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['mca_salas','mca_criancas','mca_planos_aula']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('mca-planos', 'mca-planos', false)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('mca-fotos', 'mca-fotos', true)
  ON CONFLICT (id) DO NOTHING;

-- Policies para mca-planos (autenticado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_planos_auth_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_planos_auth_select" ON storage.objects
      FOR SELECT TO authenticated USING (bucket_id = 'mca-planos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_planos_auth_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_planos_auth_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mca-planos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_planos_auth_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_planos_auth_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'mca-planos');
  END IF;
  -- mca-fotos (público)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_fotos_public_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_fotos_public_select" ON storage.objects
      FOR SELECT USING (bucket_id = 'mca-fotos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_fotos_auth_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_fotos_auth_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mca-fotos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_fotos_auth_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_fotos_auth_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'mca-fotos');
  END IF;
END $$;

-- ─── RLS mca_salas ────────────────────────────────────────────────────────────
ALTER TABLE mca_salas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_salas" ON mca_salas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "lider_all_mca_salas" ON mca_salas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = mca_salas.ministerio_id AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = mca_salas.ministerio_id AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_mca_salas" ON mca_salas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = mca_salas.ministerio_id AND ativo = true
  ));

-- ─── RLS mca_criancas ─────────────────────────────────────────────────────────
ALTER TABLE mca_criancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_criancas" ON mca_criancas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_criancas" ON mca_criancas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id
    WHERE mu.user_id = auth.uid() AND mu.ativo = true AND s.church_id = mca_criancas.church_id
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id
    WHERE mu.user_id = auth.uid() AND mu.ativo = true AND s.church_id = mca_criancas.church_id
    LIMIT 1
  ));

-- ─── RLS mca_responsaveis ─────────────────────────────────────────────────────
ALTER TABLE mca_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_responsaveis" ON mca_responsaveis FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_responsaveis" ON mca_responsaveis FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_criancas c
    JOIN ministerio_usuarios mu ON mu.ativo = true
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id AND s.church_id = c.church_id
    WHERE c.id = mca_responsaveis.crianca_id AND mu.user_id = auth.uid()
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_criancas c
    JOIN ministerio_usuarios mu ON mu.ativo = true
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id AND s.church_id = c.church_id
    WHERE c.id = mca_responsaveis.crianca_id AND mu.user_id = auth.uid()
    LIMIT 1
  ));

-- ─── RLS mca_checkins ─────────────────────────────────────────────────────────
ALTER TABLE mca_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_checkins" ON mca_checkins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_checkins" ON mca_checkins FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_salas s
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE s.id = mca_checkins.sala_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_salas s
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE s.id = mca_checkins.sala_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS mca_planos_aula ──────────────────────────────────────────────────────
ALTER TABLE mca_planos_aula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_planos_aula" ON mca_planos_aula FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_planos_aula" ON mca_planos_aula FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_salas s
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE s.id = mca_planos_aula.sala_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_salas s
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE s.id = mca_planos_aula.sala_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS mca_plano_arquivos ───────────────────────────────────────────────────
ALTER TABLE mca_plano_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_plano_arquivos" ON mca_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_plano_arquivos" ON mca_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_planos_aula p
    JOIN mca_salas s ON s.id = p.sala_id
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE p.id = mca_plano_arquivos.plano_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_planos_aula p
    JOIN mca_salas s ON s.id = p.sala_id
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE p.id = mca_plano_arquivos.plano_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS mca_comunicacoes ─────────────────────────────────────────────────────
ALTER TABLE mca_comunicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_comunicacoes" ON mca_comunicacoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_comunicacoes" ON mca_comunicacoes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_criancas c
    JOIN ministerio_usuarios mu ON mu.ativo = true
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id AND s.church_id = c.church_id
    WHERE c.id = mca_comunicacoes.crianca_id AND mu.user_id = auth.uid()
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_criancas c
    JOIN ministerio_usuarios mu ON mu.ativo = true
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id AND s.church_id = c.church_id
    WHERE c.id = mca_comunicacoes.crianca_id AND mu.user_id = auth.uid()
    LIMIT 1
  ));


-- === MIGRATION: 20260427000002_create_ensino_tables.sql ===
-- Etapa Ensino: turmas, planos de aula, chamadas e presenças

-- ─── TABELA ensino_turmas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ensino_turmas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  ministerio_id uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome          text        NOT NULL,
  descricao     text,
  professor_id  uuid,
  ativo         boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA ensino_planos_aula ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ensino_planos_aula (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id     uuid        NOT NULL REFERENCES ensino_turmas(id) ON DELETE CASCADE,
  professor_id uuid,
  titulo       text        NOT NULL,
  data_aula    date        NOT NULL,
  objetivos    text,
  conteudo     text,
  anotacoes    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA ensino_plano_arquivos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ensino_plano_arquivos (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id       uuid        NOT NULL REFERENCES ensino_planos_aula(id) ON DELETE CASCADE,
  nome           text        NOT NULL,
  arquivo_url    text        NOT NULL,
  arquivo_tipo   text        NOT NULL,
  tamanho_bytes  integer,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA ensino_checkins ───────────────────────────────────────────────────
-- Representa uma sessão de chamada (turma + data)
CREATE TABLE IF NOT EXISTS ensino_checkins (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id       uuid        NOT NULL REFERENCES ensino_turmas(id) ON DELETE CASCADE,
  church_id      uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  ministerio_id  uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  data           date        NOT NULL,
  titulo         text,
  observacoes    text,
  registrado_por uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (turma_id, data)
);

-- ─── TABELA ensino_presencas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ensino_presencas (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id   uuid        NOT NULL REFERENCES ensino_checkins(id) ON DELETE CASCADE,
  perfil_id    uuid,
  nome_manual  text,
  is_visitante boolean     NOT NULL DEFAULT false,
  presente     boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nome_ou_perfil CHECK (perfil_id IS NOT NULL OR nome_manual IS NOT NULL)
);

-- ─── TRIGGERS updated_at ──────────────────────────────────────────────────────
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['ensino_turmas','ensino_planos_aula']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ─── STORAGE BUCKET ensino-planos ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('ensino-planos', 'ensino-planos', false)
  ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'ensino_planos_auth_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "ensino_planos_auth_select" ON storage.objects
      FOR SELECT TO authenticated USING (bucket_id = 'ensino-planos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'ensino_planos_auth_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "ensino_planos_auth_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ensino-planos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'ensino_planos_auth_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "ensino_planos_auth_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'ensino-planos');
  END IF;
END $$;

-- ─── RLS ensino_turmas ────────────────────────────────────────────────────────
ALTER TABLE ensino_turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_turmas" ON ensino_turmas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')));

CREATE POLICY "lider_all_ensino_turmas" ON ensino_turmas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = ensino_turmas.ministerio_id AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = ensino_turmas.ministerio_id AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_ensino_turmas" ON ensino_turmas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = ensino_turmas.ministerio_id AND ativo = true
  ));

-- ─── RLS ensino_planos_aula ───────────────────────────────────────────────────
ALTER TABLE ensino_planos_aula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_planos" ON ensino_planos_aula FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')));

CREATE POLICY "membro_all_ensino_planos" ON ensino_planos_aula FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_turmas t
    JOIN ministerio_usuarios mu ON mu.ministerio_id = t.ministerio_id
    WHERE t.id = ensino_planos_aula.turma_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_turmas t
    JOIN ministerio_usuarios mu ON mu.ministerio_id = t.ministerio_id
    WHERE t.id = ensino_planos_aula.turma_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS ensino_plano_arquivos ────────────────────────────────────────────────
ALTER TABLE ensino_plano_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_arquivos" ON ensino_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')));

CREATE POLICY "membro_all_ensino_arquivos" ON ensino_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_planos_aula p
    JOIN ensino_turmas t ON t.id = p.turma_id
    JOIN ministerio_usuarios mu ON mu.ministerio_id = t.ministerio_id
    WHERE p.id = ensino_plano_arquivos.plano_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_planos_aula p
    JOIN ensino_turmas t ON t.id = p.turma_id
    JOIN ministerio_usuarios mu ON mu.ministerio_id = t.ministerio_id
    WHERE p.id = ensino_plano_arquivos.plano_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS ensino_checkins ──────────────────────────────────────────────────────
ALTER TABLE ensino_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_checkins" ON ensino_checkins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')));

CREATE POLICY "membro_all_ensino_checkins" ON ensino_checkins FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    WHERE mu.user_id = auth.uid() AND mu.ministerio_id = ensino_checkins.ministerio_id AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    WHERE mu.user_id = auth.uid() AND mu.ministerio_id = ensino_checkins.ministerio_id AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS ensino_presencas ─────────────────────────────────────────────────────
ALTER TABLE ensino_presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_presencas" ON ensino_presencas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_global IN ('admin','super_admin')));

CREATE POLICY "membro_all_ensino_presencas" ON ensino_presencas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_checkins ck
    JOIN ministerio_usuarios mu ON mu.ministerio_id = ck.ministerio_id
    WHERE ck.id = ensino_presencas.checkin_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_checkins ck
    JOIN ministerio_usuarios mu ON mu.ministerio_id = ck.ministerio_id
    WHERE ck.id = ensino_presencas.checkin_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));


-- === MIGRATION: 20260427000003_add_google_calendar.sql ===
-- Fase 4: adiciona campo de URL do Google Calendar embed às configurações
ALTER TABLE configuracoes_instituicao
  ADD COLUMN IF NOT EXISTS google_calendar_embed_url text;


-- === MIGRATION: 20260428000001_fix_rls_infinite_recursion.sql ===
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


-- === MIGRATION: 20260428000002_seed_igreja_base.sql ===
-- Insere a igreja base se a tabela estiver vazia.
-- igrejas.nome é a única coluna NOT NULL (slug não existe no schema).
INSERT INTO igrejas (nome, cidade, ativa)
SELECT 'Igreja da Promessa Hortolândia', 'Hortolândia', true
WHERE NOT EXISTS (SELECT 1 FROM igrejas);


-- === MIGRATION: 20260428000003_add_musica_media_columns.sql ===
-- Add media link columns to musicas_repertorio
ALTER TABLE musicas_repertorio
  ADD COLUMN IF NOT EXISTS link_deezer text,
  ADD COLUMN IF NOT EXISTS link_spotify text,
  ADD COLUMN IF NOT EXISTS link_cifraclub text,
  ADD COLUMN IF NOT EXISTS capa_url text;

-- Add media link columns to musicas_culto
ALTER TABLE musicas_culto
  ADD COLUMN IF NOT EXISTS link_deezer text,
  ADD COLUMN IF NOT EXISTS link_spotify text,
  ADD COLUMN IF NOT EXISTS link_cifraclub text,
  ADD COLUMN IF NOT EXISTS capa_url text;


-- === MIGRATION: 20260503124237_create_ministerio_usuarios_and_escala_flow.sql ===
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


-- === MIGRATION: 20260503124322_create_musica_celebracao_avisos_config_tables.sql ===
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


-- === MIGRATION: 20260504000001_fix_ensino_storage_and_profiles_rls.sql ===
-- Tornar bucket público para acesso direto via URL
UPDATE storage.buckets SET public = true WHERE id = 'ensino-planos';

-- Adicionar policy para todos os autenticados verem profiles (necessário para busca na chamada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_view_all_profiles' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "authenticated_view_all_profiles" ON profiles FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;


-- === MIGRATION: 20260504000002_ensino_member_rls_and_progress_rpc.sql ===
-- Permite que o usuário veja suas próprias presenças
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_own_ensino_presencas' AND tablename = 'ensino_presencas') THEN
    CREATE POLICY "user_own_ensino_presencas" ON ensino_presencas FOR SELECT TO authenticated
      USING (
        perfil_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      );
  END IF;
END $$;

-- Permite que o usuário veja os checkins onde tem presenças
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_own_ensino_checkins' AND tablename = 'ensino_checkins') THEN
    CREATE POLICY "user_own_ensino_checkins" ON ensino_checkins FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM ensino_presencas ep
          JOIN profiles p ON p.id = ep.perfil_id
          WHERE ep.checkin_id = ensino_checkins.id AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Permite que o usuário veja as turmas onde tem presença
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_turmas_com_presenca' AND tablename = 'ensino_turmas') THEN
    CREATE POLICY "user_turmas_com_presenca" ON ensino_turmas FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM ensino_checkins ec
          JOIN ensino_presencas ep ON ep.checkin_id = ec.id
          JOIN profiles p ON p.id = ep.perfil_id
          WHERE ec.turma_id = ensino_turmas.id AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RPC para buscar progresso do membro no ensino
CREATE OR REPLACE FUNCTION get_meu_ensino()
RETURNS TABLE (
  turma_id   uuid,
  turma_nome text,
  data_aula  date,
  presente   boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_perfil_id uuid;
BEGIN
  SELECT id INTO v_perfil_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
  IF v_perfil_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    ec.turma_id,
    et.nome AS turma_nome,
    ec.data AS data_aula,
    ep.presente
  FROM ensino_presencas ep
  JOIN ensino_checkins ec ON ec.id = ep.checkin_id
  JOIN ensino_turmas et ON et.id = ec.turma_id
  WHERE ep.perfil_id = v_perfil_id
  ORDER BY ec.data DESC;
END;
$$;


-- === MIGRATION: 20260504000003_fix_ensino_rls_use_has_role.sql ===
-- Reescreve políticas de ensino usando has_role (SECURITY DEFINER) como o resto do sistema
-- Motivo: subquery direta em user_roles fica sujeita a RLS e bloqueava admins

-- ensino_turmas
DROP POLICY IF EXISTS "admin_all_ensino_turmas" ON ensino_turmas;
DROP POLICY IF EXISTS "lider_all_ensino_turmas" ON ensino_turmas;
DROP POLICY IF EXISTS "membro_select_ensino_turmas" ON ensino_turmas;

CREATE POLICY "admin_all_ensino_turmas" ON ensino_turmas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "lider_all_ensino_turmas" ON ensino_turmas FOR ALL TO authenticated
  USING (can_ministry(auth.uid(), 'write'::text, ministerio_id))
  WITH CHECK (can_ministry(auth.uid(), 'write'::text, ministerio_id));

CREATE POLICY "membro_select_ensino_turmas" ON ensino_turmas FOR SELECT TO authenticated
  USING (check_ministerio_member(auth.uid(), ministerio_id));

-- ensino_planos_aula
DROP POLICY IF EXISTS "admin_all_ensino_planos" ON ensino_planos_aula;
DROP POLICY IF EXISTS "membro_all_ensino_planos" ON ensino_planos_aula;

CREATE POLICY "admin_all_ensino_planos" ON ensino_planos_aula FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "membro_all_ensino_planos" ON ensino_planos_aula FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_turmas t
    WHERE t.id = ensino_planos_aula.turma_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR check_ministerio_member(auth.uid(), t.ministerio_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_turmas t
    WHERE t.id = ensino_planos_aula.turma_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR can_ministry(auth.uid(), 'write'::text, t.ministerio_id))
  ));

-- ensino_plano_arquivos
DROP POLICY IF EXISTS "admin_all_ensino_arquivos" ON ensino_plano_arquivos;
DROP POLICY IF EXISTS "membro_all_ensino_arquivos" ON ensino_plano_arquivos;

CREATE POLICY "admin_all_ensino_arquivos" ON ensino_plano_arquivos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "membro_all_ensino_arquivos" ON ensino_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_planos_aula p
    JOIN ensino_turmas t ON t.id = p.turma_id
    WHERE p.id = ensino_plano_arquivos.plano_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR check_ministerio_member(auth.uid(), t.ministerio_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_planos_aula p
    JOIN ensino_turmas t ON t.id = p.turma_id
    WHERE p.id = ensino_plano_arquivos.plano_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR can_ministry(auth.uid(), 'write'::text, t.ministerio_id))
  ));

-- ensino_checkins
DROP POLICY IF EXISTS "admin_all_ensino_checkins" ON ensino_checkins;
DROP POLICY IF EXISTS "membro_all_ensino_checkins" ON ensino_checkins;

CREATE POLICY "admin_all_ensino_checkins" ON ensino_checkins FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "membro_all_ensino_checkins" ON ensino_checkins FOR ALL TO authenticated
  USING (check_ministerio_member(auth.uid(), ministerio_id))
  WITH CHECK (can_ministry(auth.uid(), 'write'::text, ministerio_id));

-- ensino_presencas
DROP POLICY IF EXISTS "admin_all_ensino_presencas" ON ensino_presencas;
DROP POLICY IF EXISTS "membro_all_ensino_presencas" ON ensino_presencas;

CREATE POLICY "admin_all_ensino_presencas" ON ensino_presencas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "membro_all_ensino_presencas" ON ensino_presencas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_checkins ck
    WHERE ck.id = ensino_presencas.checkin_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR check_ministerio_member(auth.uid(), ck.ministerio_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_checkins ck
    WHERE ck.id = ensino_presencas.checkin_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR can_ministry(auth.uid(), 'write'::text, ck.ministerio_id))
  ));


-- === MIGRATION: 20260505000001_fix_ensino_rls_remove_recursive_policies.sql ===
-- Remove políticas que causavam recursão infinita entre ensino_checkins e ensino_presencas.
-- Cadeia: ensino_turmas → user_turmas_com_presenca → ensino_checkins
--         → user_own_ensino_checkins → ensino_presencas
--         → membro_all_ensino_presencas → ensino_checkins → loop
--
-- A feature "Meu Ensino" usa get_meu_ensino() (SECURITY DEFINER) que não passa por RLS,
-- portanto essas políticas são redundantes e apenas causam recursão.
DROP POLICY IF EXISTS "user_turmas_com_presenca" ON ensino_turmas;
DROP POLICY IF EXISTS "user_own_ensino_checkins" ON ensino_checkins;
DROP POLICY IF EXISTS "user_own_ensino_presencas" ON ensino_presencas;


