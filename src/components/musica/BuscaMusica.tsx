import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Music, Youtube } from 'lucide-react';

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface SearchResultItem {
  source: 'youtube' | 'deezer';
  id: string;
  titulo: string;
  artista: string;
  thumbnail?: string;
  link_youtube?: string;
  link_deezer?: string;
  capa_url?: string;
}

interface BuscaMusicaProps {
  onSelect: (item: SearchResultItem) => void;
  autoFocus?: boolean;
}

type Fonte = 'youtube' | 'deezer' | 'ambos';

async function buscarYoutube(termo: string): Promise<SearchResultItem[]> {
  if (!YT_API_KEY) return [];
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(termo)}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items ?? []).map((item: any) => ({
    source: 'youtube' as const,
    id: item.id.videoId,
    titulo: item.snippet.title,
    artista: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.default?.url,
    link_youtube: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

async function buscarDeezer(termo: string): Promise<SearchResultItem[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? SUPABASE_ANON_KEY;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/deezer-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ q: termo }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map((item: any) => ({
      source: 'deezer' as const,
      id: String(item.id),
      titulo: item.title ?? item.title_short ?? '',
      artista: item.artist?.name ?? '',
      thumbnail: item.album?.cover_medium ?? item.album?.cover ?? '',
      capa_url: item.album?.cover_medium ?? item.album?.cover ?? '',
      link_deezer: item.link ?? `https://www.deezer.com/track/${item.id}`,
    }));
  } catch {
    return [];
  }
}

export default function BuscaMusica({ onSelect, autoFocus }: BuscaMusicaProps) {
  const [busca, setBusca] = useState('');
  const [fonte, setFonte] = useState<Fonte>('ambos');
  const [resultados, setResultados] = useState<SearchResultItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!busca.trim()) {
      setResultados([]);
      return;
    }
    debounceRef.current = setTimeout(() => pesquisar(busca), 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busca, fonte]);

  async function pesquisar(termo: string) {
    setCarregando(true);
    setErro('');
    try {
      const tarefas: Promise<SearchResultItem[]>[] = [];
      if (fonte === 'youtube' || fonte === 'ambos') tarefas.push(buscarYoutube(termo));
      if (fonte === 'deezer' || fonte === 'ambos') tarefas.push(buscarDeezer(termo));

      const settled = await Promise.allSettled(tarefas);
      const items: SearchResultItem[] = [];
      settled.forEach(r => { if (r.status === 'fulfilled') items.push(...r.value); });
      setResultados(items);
    } catch {
      setErro('Erro ao buscar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  const fontes: { key: Fonte; label: string }[] = [
    { key: 'ambos', label: 'Ambos' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'deezer', label: 'Deezer' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        {fontes.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              fonte === key
                ? 'bg-promessa-600 text-white border-promessa-600'
                : 'text-muted-foreground border-border hover:bg-muted'
            }`}
            onClick={() => setFonte(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Título ou artista…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          autoFocus={autoFocus}
        />
        {carregando && (
          <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {erro && <p className="text-xs text-destructive">{erro}</p>}

      {resultados.length > 0 && (
        <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
          {resultados.map(item => (
            <button
              key={`${item.source}-${item.id}`}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
              onClick={() => onSelect(item)}
            >
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="w-12 h-9 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="w-12 h-9 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.titulo}</p>
                <p className="text-xs text-muted-foreground truncate">{item.artista}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${
                  item.source === 'youtube'
                    ? 'text-red-600 border-red-200'
                    : 'text-purple-600 border-purple-200'
                }`}
              >
                {item.source === 'youtube' ? (
                  <span className="flex items-center gap-1"><Youtube className="w-3 h-3" />YT</span>
                ) : (
                  'Deezer'
                )}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {!carregando && busca.trim() && resultados.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhum resultado encontrado.
        </p>
      )}
    </div>
  );
}
