import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Church, MapPin, Clock, Instagram, Youtube, Facebook, Globe,
  MessageCircle, Share2, Copy, ExternalLink, Phone, Mail,
} from 'lucide-react';

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

interface EventoSemanal {
  id: string;
  nome: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string | null;
  local: string | null;
}

export default function MinhaIgreja() {
  const { churchId } = useAuth();
  const { config, loading, localizacao } = useIgrejaConfig();
  const [eventos, setEventos] = useState<EventoSemanal[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  useEffect(() => {
    if (!churchId) return;
    supabase
      .from('igreja_eventos_semanais')
      .select('id, nome, dia_semana, horario_inicio, horario_fim, local')
      .eq('church_id', churchId)
      .eq('ativo', true)
      .order('dia_semana')
      .order('horario_inicio')
      .then(({ data }) => {
        setEventos((data ?? []) as EventoSemanal[]);
        setLoadingEventos(false);
      });
  }, [churchId]);

  const shareLink = config.subdominio
    ? `https://${config.subdominio}.vercel.app`
    : window.location.origin;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: config.nome,
          text: config.slogan ?? `Conheça a ${config.nome}!`,
          url: shareLink,
        });
      } catch {
        // usuário cancelou
      }
    } else {
      navigator.clipboard.writeText(shareLink);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copiado!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">

      {/* ── Hero da Igreja ───────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden min-h-[200px] flex items-end p-6"
        style={
          config.foto_hero_urls.length > 0
            ? {
                backgroundImage: `url(${config.foto_hero_urls[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Overlay */}
        <div className={`absolute inset-0 ${config.foto_hero_urls.length > 0 ? 'bg-gradient-to-t from-black/70 via-black/30 to-transparent' : 'bg-gradient-to-br from-promessa-700 to-promessa-900'}`} />

        <div className="relative z-10 flex items-end gap-4 w-full">
          {/* Logo */}
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.nome}
              className="h-16 w-16 object-contain bg-white/90 rounded-xl p-2 shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Church className="w-8 h-8 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-white leading-tight">{config.nome}</h1>
            {localizacao && (
              <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" /> {localizacao}
              </p>
            )}
          </div>

          {/* Botão Compartilhar */}
          <Button
            size="sm"
            variant="secondary"
            className="flex-shrink-0 bg-white/90 text-promessa-700 hover:bg-white"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* ── Slogan e Versículo ──────────────────────────────────────────── */}
      {(config.slogan || config.versiculo) && (
        <div className="bg-card border rounded-2xl p-5 space-y-3">
          {config.slogan && (
            <p className="text-sm font-medium text-foreground">{config.slogan}</p>
          )}
          {config.versiculo && (
            <blockquote className="border-l-4 border-promessa-300 pl-4 text-sm text-muted-foreground italic">
              "{config.versiculo}"
              {config.versiculo_referencia && (
                <cite className="block text-xs font-semibold not-italic text-promessa-600 mt-1">
                  {config.versiculo_referencia}
                </cite>
              )}
            </blockquote>
          )}
        </div>
      )}

      {/* ── Nossos Encontros ────────────────────────────────────────────── */}
      <div className="bg-card border rounded-2xl p-5">
        <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-promessa-600" />
          Nossos Encontros
        </h2>
        {loadingEventos ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum evento semanal cadastrado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {eventos.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                <div className="w-10 h-10 bg-promessa-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-promessa-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{ev.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {DIAS_SEMANA[ev.dia_semana]} · {ev.horario_inicio.slice(0, 5)}
                    {ev.horario_fim && ` – ${ev.horario_fim.slice(0, 5)}`}
                    {ev.local && ` · ${ev.local}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Localização e Contato ───────────────────────────────────────── */}
      {(config.endereco || config.responsavel_telefone || config.whatsapp || config.responsavel_email) && (
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-promessa-600" />
            Localização e Contato
          </h2>
          <div className="space-y-3 text-sm">
            {config.endereco && (
              <a
                href={`https://maps.google.com?q=${encodeURIComponent(config.endereco)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-muted-foreground hover:text-promessa-700 transition-colors"
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-promessa-600" />
                <span>{config.endereco}</span>
              </a>
            )}
            {(config.responsavel_telefone || config.whatsapp) && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0 text-promessa-600" />
                <span>{config.responsavel_telefone || config.whatsapp}</span>
              </div>
            )}
            {config.responsavel_email && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4 flex-shrink-0 text-promessa-600" />
                <span>{config.responsavel_email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Redes Sociais ───────────────────────────────────────────────── */}
      {(config.instagram_url || config.youtube_url || config.facebook_url || config.whatsapp || config.site_url) && (
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-promessa-600" />
            Redes Sociais
          </h2>
          <div className="flex flex-wrap gap-3">
            {config.instagram_url && (
              <a href={config.instagram_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <Instagram className="w-4 h-4" /> Instagram
              </a>
            )}
            {config.youtube_url && (
              <a href={config.youtube_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <Youtube className="w-4 h-4" /> YouTube
              </a>
            )}
            {config.facebook_url && (
              <a href={config.facebook_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
            )}
            {config.whatsapp && (
              <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            {config.site_url && (
              <a href={config.site_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-promessa-700 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <Globe className="w-4 h-4" /> Site
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Link da Igreja ──────────────────────────────────────────────── */}
      <div className="bg-promessa-50 border border-promessa-200 rounded-2xl p-5">
        <h2 className="font-display font-semibold text-base mb-3 text-promessa-700 flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Site da Igreja
        </h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-promessa-700 bg-white border border-promessa-200 px-3 py-2 rounded-lg font-mono truncate">
            {shareLink}
          </code>
          <Button variant="outline" size="icon" className="border-promessa-300 text-promessa-700 flex-shrink-0" onClick={copyLink} title="Copiar link">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="border-promessa-300 text-promessa-700 flex-shrink-0" onClick={handleShare} title="Compartilhar">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
