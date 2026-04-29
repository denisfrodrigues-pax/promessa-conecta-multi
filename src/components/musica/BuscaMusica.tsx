import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Music, ExternalLink, Youtube } from 'lucide-react';
import { toast } from 'sonner';

export interface SearchResultItem {
  titulo: string;
  artista: string;
  tom?: string | null;
  link_youtube?: string | null;
  link_cifraclub?: string | null;
  link_spotify_busca?: string | null;
  link_deezer_busca?: string | null;
  capa_url?: string | null;
}

interface BuscaMusicaProps {
  onSelect: (item: SearchResultItem) => void;
  onManual?: () => void;
}

export default function BuscaMusica({ onSelect, onManual }: BuscaMusicaProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<SearchResultItem | null>(null);
  const [erro, setErro] = useState('');

  async function buscar() {
    if (!query.trim()) return;
    setLoading(true);
    setErro('');
    setResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke('busca-musica-ia', {
        body: { query: query.trim() },
      });
      if (error) throw new Error(error.message ?? 'Erro ao buscar');
      if (data?.error) throw new Error(data.error);
      setResultado(data as SearchResultItem);
    } catch (err: any) {
      const msg = err?.message ?? 'Erro ao buscar música. Tente novamente.';
      setErro(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function resetBusca() {
    setResultado(null);
    setErro('');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
        <Loader2 className="w-7 h-7 animate-spin text-promessa-500" />
        <p className="text-sm">Buscando informações da música...</p>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="space-y-4">
        {/* Result card */}
        <div className="border rounded-xl p-4 bg-muted/30 space-y-3">
          <div className="flex items-start gap-3">
            {resultado.capa_url ? (
              <img
                src={resultado.capa_url}
                alt="Capa"
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base leading-tight">{resultado.titulo}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{resultado.artista}</p>
              {resultado.tom && (
                <Badge variant="outline" className="mt-1 font-mono text-xs">{resultado.tom}</Badge>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {resultado.link_youtube && (
              <a
                href={resultado.link_youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <Youtube className="w-3 h-3" />
                YouTube
              </a>
            )}
            {resultado.link_cifraclub && (
              <a
                href={resultado.link_cifraclub}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                CifraClub
              </a>
            )}
            {resultado.link_spotify_busca && (
              <a
                href={resultado.link_spotify_busca}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Spotify
              </a>
            )}
            {resultado.link_deezer_busca && (
              <a
                href={resultado.link_deezer_busca}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Deezer
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => onSelect(resultado)}>
            Usar esta música
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetBusca}>
              Buscar novamente
            </Button>
            {onManual && (
              <Button variant="ghost" className="flex-1" onClick={onManual}>
                Cadastrar manualmente
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Nome da música ou artista…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') buscar(); }}
            autoFocus
          />
        </div>
        <Button onClick={buscar} disabled={!query.trim()}>
          Buscar
        </Button>
      </div>

      {erro && <p className="text-xs text-destructive">{erro}</p>}

      {onManual && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground underline"
          onClick={onManual}
        >
          Cadastrar manualmente sem buscar
        </button>
      )}
    </div>
  );
}
