import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, HelpCircle, HandHeart, Share2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Devocional {
  id: string;
  titulo: string;
  subtitulo: string | null;
  versiculo_texto: string;
  versiculo_referencia: string;
  reflexao: string;
  para_pensar: string;
  oracao: string;
  serie: string | null;
  semana: number | null;
  data_publicacao: string;
}

export default function DevocionaldaSemana() {
  const [open, setOpen] = useState(false);

  const { data: devocional } = useQuery({
    queryKey: ['devocional-semana'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('devocionais')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();
      return data as Devocional | null;
    },
    staleTime: 1000 * 60 * 60,
  });

  if (!devocional) return null;

  function handleShare() {
    const text = `📖 *${devocional!.titulo}*\n${devocional!.subtitulo ? `_${devocional!.subtitulo}_\n` : ''}\n"${devocional!.versiculo_texto}"\n— ${devocional!.versiculo_referencia}\n\n${devocional!.reflexao}\n\n💭 *Para pensar:*\n${devocional!.para_pensar}\n\n🙏 *Oração:*\n${devocional!.oracao}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('Devocional copiado!', { description: 'Cole em qualquer conversa para compartilhar.' });
      });
    }
  }

  return (
    <>
      {/* Card de preview */}
      <div className="bg-gradient-to-br from-promessa-900 to-promessa-700 rounded-2xl p-6 text-white shadow-elevated">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-white/20 text-white border border-white/30 text-xs">
            <BookOpen className="w-3 h-3 mr-1" />
            Devocional da Semana
          </Badge>
          {devocional.serie && (
            <span className="text-white/60 text-xs">{devocional.serie}</span>
          )}
        </div>

        <blockquote className="border-l-2 border-white/40 pl-4 mb-4">
          <p className="text-white/90 text-base leading-relaxed italic">
            "{devocional.versiculo_texto}"
          </p>
          <footer className="text-white/60 text-sm mt-1">— {devocional.versiculo_referencia}</footer>
        </blockquote>

        <p className="text-white font-display font-semibold text-lg mb-4 leading-snug">
          {devocional.titulo}
        </p>

        <Button
          onClick={() => setOpen(true)}
          className="bg-white text-promessa-800 hover:bg-white/90 font-semibold"
          size="sm"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Ler devocional completo
        </Button>
      </div>

      {/* Modal completo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-br from-promessa-900 to-promessa-700 px-6 pt-6 pb-8 text-white rounded-t-lg">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {devocional.serie && (
                    <p className="text-white/60 text-xs mb-1 uppercase tracking-wide">
                      {devocional.serie}{devocional.semana ? ` · Semana ${devocional.semana}` : ''}
                    </p>
                  )}
                  <DialogTitle className="text-white text-2xl font-display font-bold leading-tight text-left">
                    {devocional.titulo}
                  </DialogTitle>
                  {devocional.subtitulo && (
                    <p className="text-white/70 text-sm mt-1">{devocional.subtitulo}</p>
                  )}
                </div>
              </div>
            </DialogHeader>

            <blockquote className="mt-5 border-l-2 border-white/40 pl-4">
              <p className="text-white/90 text-base leading-relaxed italic">
                "{devocional.versiculo_texto}"
              </p>
              <footer className="text-white/60 text-sm mt-2">— {devocional.versiculo_referencia}</footer>
            </blockquote>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Reflexão */}
            <div>
              <div className="space-y-3">
                {devocional.reflexao.split('\n\n').filter(Boolean).map((paragrafo, i) => (
                  <p key={i} className="text-foreground leading-relaxed text-sm">
                    {paragrafo}
                  </p>
                ))}
              </div>
            </div>

            {/* Para pensar */}
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Para pensar hoje</h3>
              </div>
              <p className="text-amber-900 dark:text-amber-200 text-sm leading-relaxed">
                {devocional.para_pensar}
              </p>
            </div>

            {/* Oração */}
            <div className="bg-promessa-50 dark:bg-promessa-950/30 rounded-xl p-4 border border-promessa-200 dark:border-promessa-800">
              <div className="flex items-center gap-2 mb-2">
                <HandHeart className="w-4 h-4 text-promessa-600 shrink-0" />
                <h3 className="font-semibold text-promessa-800 dark:text-promessa-300 text-sm">Oração</h3>
              </div>
              <p className="text-promessa-900 dark:text-promessa-200 text-sm leading-relaxed italic">
                {devocional.oracao}
              </p>
            </div>

            {/* Ações */}
            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
