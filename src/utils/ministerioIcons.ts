import { Baby, Music, BookOpen, Users, Heart, Sparkles, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MinisterioIconConfig {
  icon: LucideIcon;
  color: string;
}

const TIPO_CONFIG: Record<string, MinisterioIconConfig> = {
  mca:               { icon: Baby,     color: 'text-pink-600 bg-pink-100' },
  musica:            { icon: Music,    color: 'text-purple-600 bg-purple-100' },
  ensino:            { icon: BookOpen, color: 'text-blue-600 bg-blue-100' },
  recepcao:          { icon: Users,    color: 'text-green-600 bg-green-100' },
  celebracao:        { icon: Sparkles, color: 'text-amber-600 bg-amber-100' },
  'pequenos-grupos': { icon: Heart,    color: 'text-rose-600 bg-rose-100' },
  padrao:            { icon: Star,     color: 'text-sky-600 bg-sky-100' },
};

const DEFAULT_CONFIG: MinisterioIconConfig = { icon: Heart, color: 'text-amber-600 bg-amber-100' };

export function getMinisterioIconConfig(tipo: string | null | undefined): MinisterioIconConfig {
  if (!tipo) return DEFAULT_CONFIG;
  return TIPO_CONFIG[tipo] ?? DEFAULT_CONFIG;
}
