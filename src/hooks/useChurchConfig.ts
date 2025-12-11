import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChurchConfig {
  id: string;
  nome_igreja: string | null;
  logo_url: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
}

export function useChurchConfig() {
  const [config, setConfig] = useState<ChurchConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const { data, error } = await supabase
        .from('configuracoes_instituicao')
        .select('id, nome_igreja, logo_url, endereco, telefone, email')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  }

  return { config, loading, refetch: fetchConfig };
}
