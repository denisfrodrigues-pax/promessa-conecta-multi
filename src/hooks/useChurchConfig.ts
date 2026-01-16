import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChurchConfig {
  id: string;
  nome_igreja: string | null;
  logo_url: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  facebook: string | null;
  urls_transmissao: {
    youtube?: string;
    instagram?: string;
  } | null;
  google_maps_url: string | null;
  horario_ebd: string | null;
  horario_culto: string | null;
}

const DEFAULT_CONFIG: Partial<ChurchConfig> = {
  nome_igreja: 'Igreja da Promessa',
  endereco: 'Informações em atualização',
  telefone: null,
  email: null,
  google_maps_url: null,
  horario_ebd: '18:00',
  horario_culto: '19:07',
};

export function useChurchConfig() {
  const [config, setConfig] = useState<ChurchConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('configuracoes_instituicao')
        .select('id, nome_igreja, logo_url, endereco, telefone, email, facebook, urls_transmissao, google_maps_url, horario_ebd, horario_culto')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Merge with defaults for missing values
      if (data) {
        setConfig({
          ...data,
          urls_transmissao: data.urls_transmissao as ChurchConfig['urls_transmissao'],
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  // Helper to get a value with fallback
  const getValue = <K extends keyof ChurchConfig>(key: K): ChurchConfig[K] | string => {
    if (config && config[key] !== null && config[key] !== undefined && config[key] !== '') {
      return config[key];
    }
    return (DEFAULT_CONFIG[key] as ChurchConfig[K]) ?? 'Informações em atualização';
  };

  // Formatted helpers
  const getEndereco = (): string => {
    const endereco = config?.endereco;
    if (!endereco || endereco.trim() === '') {
      return 'Informações em atualização';
    }
    return endereco;
  };

  const getTelefone = (): string | null => {
    return config?.telefone || null;
  };

  const getEmail = (): string | null => {
    return config?.email || null;
  };

  const getHorarios = (): { ebd: string; culto: string } => {
    return {
      ebd: config?.horario_ebd || DEFAULT_CONFIG.horario_ebd || '18:00',
      culto: config?.horario_culto || DEFAULT_CONFIG.horario_culto || '19:07',
    };
  };

  const getGoogleMapsUrl = (): string | null => {
    return config?.google_maps_url || null;
  };

  const getInstagram = (): string | null => {
    return config?.urls_transmissao?.instagram || null;
  };

  const getYoutube = (): string | null => {
    return config?.urls_transmissao?.youtube || null;
  };

  const getFacebook = (): string | null => {
    return config?.facebook || null;
  };

  const hasContactInfo = (): boolean => {
    return !!(config?.endereco || config?.telefone || config?.email);
  };

  return { 
    config, 
    loading, 
    error,
    refetch: fetchConfig,
    // Helpers
    getValue,
    getEndereco,
    getTelefone,
    getEmail,
    getHorarios,
    getGoogleMapsUrl,
    getInstagram,
    getYoutube,
    getFacebook,
    hasContactInfo,
  };
}
