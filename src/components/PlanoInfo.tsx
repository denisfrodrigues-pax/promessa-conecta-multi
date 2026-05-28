import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Sparkles } from 'lucide-react';

type Plano = 'teste' | 'basico' | 'completo';

interface PlanoConfig {
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

const PLANO_CONFIG: Record<Plano, PlanoConfig> = {
  teste: {
    label: 'Teste',
    description: 'Período de avaliação gratuita (30 dias)',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Sparkles className="w-3 h-3" />,
  },
  basico: {
    label: 'Básico',
    description: 'Funções essenciais de gestão',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Building2 className="w-3 h-3" />,
  },
  completo: {
    label: 'Completo',
    description: 'Acesso a todos os módulos',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Sparkles className="w-3 h-3" />,
  },
};

interface PlanoInfoProps {
  /** Modo compact exibe apenas o badge inline (default: false) */
  compact?: boolean;
}

export function PlanoInfo({ compact = false }: PlanoInfoProps) {
  const { churchId } = useAuth();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [nomeIgreja, setNomeIgreja] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) { setLoading(false); return; }
    supabase
      .from('igrejas')
      .select('nome, plano')
      .eq('id', churchId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNomeIgreja(data.nome);
          setPlano((data.plano as Plano) ?? 'teste');
        }
      })
      .finally(() => setLoading(false));
  }, [churchId]);

  if (loading || !plano) return null;

  const config = PLANO_CONFIG[plano] ?? PLANO_CONFIG.teste;

  /* ── Modo compacto: apenas o badge ─────────────────────────────────── */
  if (compact) {
    return (
      <Badge variant="outline" className={`text-xs gap-1 ${config.color}`}>
        {config.icon}
        Plano {config.label}
      </Badge>
    );
  }

  /* ── Modo completo: card com info da igreja ─────────────────────────── */
  return (
    <Card className="border-dashed">
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">Igreja</p>
          <p className="font-semibold text-sm truncate">{nomeIgreja ?? '–'}</p>
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 gap-1 ${config.color}`}>
          {config.icon}
          {config.label}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default PlanoInfo;
