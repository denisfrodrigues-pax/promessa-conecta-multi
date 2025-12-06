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