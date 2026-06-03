import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface IgrejaConfig {
  id: string;
  nome: string;
  slug: string | null;
  plano: string;
  ativo: boolean;
  // Identidade visual
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string | null;
  foto_hero_urls: string[];
  foto_login_url: string | null;
  slogan: string | null;
  versiculo: string | null;
  versiculo_referencia: string | null;
  // Localização
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  // Redes sociais
  instagram_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  whatsapp: string | null;
  site_url: string | null;
  // Nomenclatura de módulos
  nome_modulo_pequenos_grupos: string;
  nome_modulo_culto: string;
  nome_modulo_escola_biblica: string;
  nome_modulo_financeiro: string;
  // Módulos habilitados
  modulo_pequenos_grupos: boolean;
  modulo_escola_biblica: boolean;
  modulo_financeiro: boolean;
  modulo_repertorio: boolean;
  modulo_auditoria: boolean;
  // Deploy
  subdominio: string | null;
  dominio_customizado: string | null;
  // Responsável
  responsavel_nome: string | null;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  // Sobre
  missao: string | null;
  visao: string | null;
  cultos_config: Record<string, unknown> | null;
}

const DEFAULT_CONFIG: IgrejaConfig = {
  id: '',
  nome: 'Minha Igreja',
  slug: null,
  plano: 'teste',
  ativo: true,
  logo_url: null,
  cor_primaria: '#396939',
  cor_secundaria: null,
  foto_hero_urls: [],
  foto_login_url: null,
  slogan: null,
  versiculo: null,
  versiculo_referencia: null,
  cidade: null,
  estado: null,
  endereco: null,
  instagram_url: null,
  youtube_url: null,
  facebook_url: null,
  whatsapp: null,
  site_url: null,
  nome_modulo_pequenos_grupos: 'Base',
  nome_modulo_culto: 'Culto',
  nome_modulo_escola_biblica: 'Escola Bíblica',
  nome_modulo_financeiro: 'Financeiro',
  modulo_pequenos_grupos: true,
  modulo_escola_biblica: true,
  modulo_financeiro: true,
  modulo_repertorio: true,
  modulo_auditoria: true,
  subdominio: null,
  dominio_customizado: null,
  responsavel_nome: null,
  responsavel_email: null,
  responsavel_telefone: null,
  missao: null,
  visao: null,
  cultos_config: null,
};

/**
 * Hook multi-tenant que carrega a configuração completa da igreja do usuário logado.
 * Substitui useChurchConfig para todos os contextos autenticados.
 * Exemplo: const { nomeModulo, modulo_escola_biblica } = useIgrejaConfig()
 */
export function useIgrejaConfig() {
  const { churchId, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<IgrejaConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!churchId) {
      setLoading(false);
      return;
    }
    fetchConfig(churchId);
  }, [churchId, authLoading]);

  async function fetchConfig(id: string) {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('igrejas')
        .select(`
          id, nome, slug, plano, ativo,
          logo_url, cor_primaria, cor_secundaria,
          foto_hero_urls, foto_login_url,
          slogan, versiculo, versiculo_referencia,
          cidade, estado, endereco,
          instagram_url, youtube_url, facebook_url, whatsapp, site_url,
          nome_modulo_pequenos_grupos, nome_modulo_culto,
          nome_modulo_escola_biblica, nome_modulo_financeiro,
          modulo_pequenos_grupos, modulo_escola_biblica,
          modulo_financeiro, modulo_repertorio, modulo_auditoria,
          subdominio, dominio_customizado,
          responsavel_nome, responsavel_email, responsavel_telefone,
          missao, visao, cultos_config
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...data,
          nome: data.nome ?? DEFAULT_CONFIG.nome,
          cor_primaria: data.cor_primaria ?? DEFAULT_CONFIG.cor_primaria,
          foto_hero_urls: Array.isArray(data.foto_hero_urls) ? data.foto_hero_urls : [],
          nome_modulo_pequenos_grupos: data.nome_modulo_pequenos_grupos ?? DEFAULT_CONFIG.nome_modulo_pequenos_grupos,
          nome_modulo_culto: data.nome_modulo_culto ?? DEFAULT_CONFIG.nome_modulo_culto,
          nome_modulo_escola_biblica: data.nome_modulo_escola_biblica ?? DEFAULT_CONFIG.nome_modulo_escola_biblica,
          nome_modulo_financeiro: data.nome_modulo_financeiro ?? DEFAULT_CONFIG.nome_modulo_financeiro,
          modulo_pequenos_grupos: data.modulo_pequenos_grupos ?? true,
          modulo_escola_biblica: data.modulo_escola_biblica ?? true,
          modulo_financeiro: data.modulo_financeiro ?? true,
          modulo_repertorio: data.modulo_repertorio ?? true,
          modulo_auditoria: data.modulo_auditoria ?? true,
          plano: data.plano ?? 'teste',
          ativo: data.ativo ?? true,
        });
      }
    } catch (err) {
      console.error('[useIgrejaConfig] Erro ao carregar config da igreja:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  const refetch = () => {
    if (churchId) fetchConfig(churchId);
  };

  // Helpers de nomenclatura
  const nomeModulo = {
    bases: config.nome_modulo_pequenos_grupos,
    culto: config.nome_modulo_culto,
    escolaBiblica: config.nome_modulo_escola_biblica,
    financeiro: config.nome_modulo_financeiro,
  };

  // Helper de localização
  const localizacao = [config.cidade, config.estado]
    .filter(Boolean)
    .join(' - ') || null;

  return {
    config,
    loading,
    error,
    refetch,
    nomeModulo,
    localizacao,
  };
}
