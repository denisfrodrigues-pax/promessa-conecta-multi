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

const DEFAULT_CONFIG: ChurchConfig = {
  id: '',
  nome_igreja: 'Igreja da Promessa',
  logo_url: null,
  endereco: 'Informações em atualização',
  telefone: null,
  email: null,
  facebook: null,
  urls_transmissao: { youtube: '', instagram: '' },
  google_maps_url: null,
  horario_ebd: '18:00',
  horario_culto: '19:07',
};

export function useChurchConfig() {
  // Initialize with defaults so config is never null after mount
  const [config, setConfig] = useState<ChurchConfig>(DEFAULT_CONFIG);
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
      
      // Always merge with defaults - ensures no null config
      if (data) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...data,
          // Ensure urls_transmissao is properly merged
          urls_transmissao: {
            ...DEFAULT_CONFIG.urls_transmissao,
            ...(data.urls_transmissao as ChurchConfig['urls_transmissao'] || {}),
          },
        });
      } else {
        // No data in DB, use defaults
        setConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError(err as Error);
      // Keep defaults on error
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }

  // Helper to get a value with fallback
  const getValue = <K extends keyof ChurchConfig>(key: K): ChurchConfig[K] | string => {
    const value = config[key];
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
    return DEFAULT_CONFIG[key] ?? 'Informações em atualização';
  };

  // Formatted helpers
  const getEndereco = (): string => {
    const endereco = config.endereco;
    if (!endereco || endereco.trim() === '') {
      return DEFAULT_CONFIG.endereco || 'Informações em atualização';
    }
    return endereco;
  };

  const getTelefone = (): string | null => {
    const telefone = config.telefone;
    return telefone && telefone.trim() !== '' ? telefone : null;
  };

  const getEmail = (): string | null => {
    const email = config.email;
    return email && email.trim() !== '' ? email : null;
  };

  const getHorarios = (): { ebd: string; culto: string } => {
    return {
      ebd: config.horario_ebd || DEFAULT_CONFIG.horario_ebd || '18:00',
      culto: config.horario_culto || DEFAULT_CONFIG.horario_culto || '19:07',
    };
  };

  const getGoogleMapsUrl = (): string | null => {
    const url = config.google_maps_url;
    return url && url.trim() !== '' ? url : null;
  };

  const getInstagram = (): string | null => {
    const instagram = config.urls_transmissao?.instagram;
    return instagram && instagram.trim() !== '' ? instagram : null;
  };

  const getYoutube = (): string | null => {
    const youtube = config.urls_transmissao?.youtube;
    return youtube && youtube.trim() !== '' ? youtube : null;
  };

  const getFacebook = (): string | null => {
    const facebook = config.facebook;
    return facebook && facebook.trim() !== '' ? facebook : null;
  };

  const hasContactInfo = (): boolean => {
    return !!(config.endereco || config.telefone || config.email);
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
