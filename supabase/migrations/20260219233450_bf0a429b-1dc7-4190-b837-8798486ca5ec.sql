
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
