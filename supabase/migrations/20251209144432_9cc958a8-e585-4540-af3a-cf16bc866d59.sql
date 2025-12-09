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