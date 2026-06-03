import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicEventoSemanal {
  id: string;
  nome: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string | null;
  local: string | null;
  descricao: string | null;
}

export interface PublicIgrejaData {
  id: string;
  nome: string;
  slug: string | null;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string | null;
  foto_hero_urls: string[];
  foto_login_url: string | null;
  slogan: string | null;
  versiculo: string | null;
  versiculo_referencia: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  whatsapp: string | null;
  site_url: string | null;
  responsavel_nome: string | null;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  subdominio: string | null;
  dominio_customizado: string | null;
}

function detectSubdomain(): string | null {
  try {
    const host = window.location.hostname; // ex: "promessa-sumare.promessa-conecta.app"
    // Ignora localhost, IPs e domínios de 1 nível
    if (host === 'localhost' || host.match(/^\d+\.\d+\.\d+\.\d+$/)) return null;
    const parts = host.split('.');
    if (parts.length <= 2) return null; // ex: "promessa-conecta.app" → sem subdomain
    // Retorna o primeiro segmento como subdomain
    return parts[0];
  } catch {
    return null;
  }
}

/**
 * Hook para o site público. Detecta a igreja via subdomínio ou domínio customizado.
 * Se não encontrar, usa a primeira igreja ativa (fallback para dev/single-tenant).
 */
export function usePublicIgreja() {
  const [igreja, setIgreja] = useState<PublicIgrejaData | null>(null);
  const [eventos, setEventos] = useState<PublicEventoSemanal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIgreja();
  }, []);

  async function fetchIgreja() {
    setLoading(true);
    try {
      const subdomain = detectSubdomain();
      const hostname = window.location.hostname;

      let query = supabase
        .from('igrejas')
        .select(`
          id, nome, slug, logo_url, cor_primaria, cor_secundaria,
          foto_hero_urls, foto_login_url, slogan, versiculo, versiculo_referencia,
          cidade, estado, endereco,
          instagram_url, youtube_url, facebook_url, whatsapp, site_url,
          responsavel_nome, responsavel_email, responsavel_telefone,
          subdominio, dominio_customizado
        `)
        .eq('ativo', true);

      // Tenta por subdomínio ou domínio customizado primeiro
      if (subdomain) {
        const { data } = await query.eq('subdominio', subdomain).maybeSingle();
        if (data) { await applyIgreja(data); return; }
      }
      // Tenta por domínio customizado
      const { data: byDomain } = await supabase
        .from('igrejas')
        .select('id, nome, slug, logo_url, cor_primaria, cor_secundaria, foto_hero_urls, foto_login_url, slogan, versiculo, versiculo_referencia, cidade, estado, endereco, instagram_url, youtube_url, facebook_url, whatsapp, site_url, responsavel_nome, responsavel_email, responsavel_telefone, subdominio, dominio_customizado')
        .eq('ativo', true)
        .eq('dominio_customizado', hostname)
        .maybeSingle();
      if (byDomain) { await applyIgreja(byDomain); return; }

      // Fallback: primeira igreja ativa (dev/single-tenant)
      const { data: first } = await supabase
        .from('igrejas')
        .select('id, nome, slug, logo_url, cor_primaria, cor_secundaria, foto_hero_urls, foto_login_url, slogan, versiculo, versiculo_referencia, cidade, estado, endereco, instagram_url, youtube_url, facebook_url, whatsapp, site_url, responsavel_nome, responsavel_email, responsavel_telefone, subdominio, dominio_customizado')
        .eq('ativo', true)
        .order('created_at')
        .limit(1)
        .maybeSingle();
      if (first) { await applyIgreja(first); return; }
    } catch (err) {
      console.error('[usePublicIgreja]', err);
    } finally {
      setLoading(false);
    }
  }

  async function applyIgreja(data: any) {
    const ig: PublicIgrejaData = {
      ...data,
      cor_primaria: data.cor_primaria ?? '#396939',
      foto_hero_urls: Array.isArray(data.foto_hero_urls) ? data.foto_hero_urls : [],
    };
    setIgreja(ig);

    // Busca eventos semanais ativos
    const { data: evs } = await supabase
      .from('igreja_eventos_semanais')
      .select('id, nome, dia_semana, horario_inicio, horario_fim, local, descricao')
      .eq('church_id', ig.id)
      .eq('ativo', true)
      .order('dia_semana')
      .order('horario_inicio');
    setEventos((evs ?? []) as PublicEventoSemanal[]);
  }

  const localizacao = igreja
    ? [igreja.cidade, igreja.estado].filter(Boolean).join(' - ') || null
    : null;

  return { igreja, eventos, loading, localizacao };
}
