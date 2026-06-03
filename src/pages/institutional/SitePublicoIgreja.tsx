import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin, Clock, Phone, Mail, Globe, Instagram, Youtube, Facebook,
  Heart, HandHeart, Users, Sparkles, ArrowRight, LogIn, MessageCircle,
  Building2,
} from 'lucide-react';

interface Igreja {
  id: string;
  nome: string;
  slug: string;
  slogan: string | null;
  versiculo: string | null;
  versiculo_referencia: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  foto_hero_urls: string[];
  missao: string | null;
  visao: string | null;
  historia: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  google_maps_url: string | null;
  horario_ebd: string | null;
  horario_culto: string | null;
  horario_bases: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  site_url: string | null;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SitePublicoIgreja() {
  const { churchSlug, slug: legacySlug } = useParams<{ churchSlug?: string; slug?: string }>();
  const slug = churchSlug ?? legacySlug;
  const [igreja, setIgreja] = useState<Igreja | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('igrejas')
        .select(`
          id, nome, slug, slogan, versiculo, versiculo_referencia,
          logo_url, cor_primaria, cor_secundaria,
          foto_hero_urls, missao, visao, historia,
          cidade, estado, endereco, telefone, email,
          google_maps_url, horario_ebd, horario_culto, horario_bases,
          whatsapp, instagram_url, youtube_url, facebook_url, site_url
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        const raw = data.foto_hero_urls;
        const urls: string[] = Array.isArray(raw) ? (raw as string[]) : [];
        setIgreja({ ...data, foto_hero_urls: urls } as Igreja);
      }
      setLoading(false);
    })();
  }, [slug]);

  const shuffled = useMemo(
    () => (igreja?.foto_hero_urls?.length ? shuffleArray(igreja.foto_hero_urls) : []),
    [igreja],
  );

  useEffect(() => {
    if (shuffled.length < 2) return;
    const id = setInterval(() => setSlide(s => (s + 1) % shuffled.length), 6000);
    return () => clearInterval(id);
  }, [shuffled.length]);

  const cor1 = igreja?.cor_primaria  ?? '#2D6A4F';
  const cor2 = igreja?.cor_secundaria ?? '#1B4332';
  const hasHero = shuffled.length > 0;
  const localidade = [igreja?.cidade, igreja?.estado].filter(Boolean).join(', ');

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b bg-white" />
      <div className="h-screen bg-gray-200 animate-pulse" />
      <div className="container mx-auto px-4 py-20 space-y-8">
        {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    </div>
  );

  /* ── Not found ── */
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Igreja não encontrada</h1>
        <p className="text-gray-500 mb-6">Não existe uma igreja com o slug "<strong>{slug}</strong>".</p>
        <Button asChild variant="outline"><Link to="/">Voltar ao início</Link></Button>
      </div>
    </div>
  );

  if (!igreja) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── HEADER ── */}
      <header className="w-full border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {igreja.logo_url ? (
              <img src={igreja.logo_url} alt={`Logo ${igreja.nome}`} className="h-10 w-10 object-contain rounded" />
            ) : (
              <div className="h-10 w-10 rounded flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${cor1}, ${cor2})` }}>
                <Building2 className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-semibold text-gray-900 leading-tight">{igreja.nome}</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Login
            </Link>
          </Button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen overflow-hidden">
        {hasHero ? (
          shuffled.map((url, i) => (
            <div key={i} className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{ backgroundImage: `url(${url})`, opacity: i === slide ? 1 : 0 }} />
          ))
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${cor1} 0%, ${cor2} 100%)` }} />
        )}
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-white">
          {localidade && (
            <p className="text-xs uppercase tracking-widest text-white/70 mb-4">{localidade}</p>
          )}
          {igreja.logo_url && (
            <img src={igreja.logo_url} alt="Logo" className="h-20 w-20 object-contain mx-auto mb-4 drop-shadow-lg" />
          )}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 drop-shadow-lg">
            {igreja.nome}
          </h1>
          {igreja.slogan && (
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-xl mx-auto mb-6 leading-relaxed">
              {igreja.slogan}
            </p>
          )}
          {igreja.versiculo && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 max-w-lg mx-auto">
              <p className="text-sm italic text-white/90">"{igreja.versiculo}"</p>
              {igreja.versiculo_referencia && (
                <p className="text-xs text-white/60 mt-1">— {igreja.versiculo_referencia}</p>
              )}
            </div>
          )}
        </div>

        {/* Dots */}
        {shuffled.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {shuffled.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === slide ? 'bg-white scale-125' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </section>

      {/* ── MISSÃO E VISÃO ── */}
      {(igreja.missao || igreja.visao) && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Quem Somos</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: 'Nossa Missão', text: igreja.missao ?? 'Em breve', icon: Heart },
                { title: 'Nossa Visão',  text: igreja.visao  ?? 'Em breve', icon: Sparkles },
              ].map(({ title, text, icon: Icon }) => (
                <Card key={title} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ backgroundColor: `${cor1}20` }}>
                      <Icon className="w-7 h-7" style={{ color: cor1 }} />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {igreja.historia && (
              <div className="mt-12 bg-muted/30 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Nossa História</h3>
                <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                  {igreja.historia}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── HORÁRIOS ── */}
      {(igreja.horario_ebd || igreja.horario_culto || igreja.horario_bases) && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Nossos Encontros</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { label: 'Escola Bíblica',      value: igreja.horario_ebd   ?? 'A confirmar' },
                { label: 'Culto de Celebração', value: igreja.horario_culto ?? 'A confirmar' },
                { label: 'Bases / Grupos',       value: igreja.horario_bases ?? 'A confirmar' },
              ].map(h => (
                <div key={h.label} className="bg-card rounded-2xl p-8 text-center border hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${cor1}20` }}>
                    <Clock className="w-7 h-7" style={{ color: cor1 }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{h.label}</h3>
                  <p className="font-bold text-lg" style={{ color: cor1 }}>{h.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAÇA PARTE ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Faça Parte</h2>
            <p className="text-muted-foreground">Diversas formas de você fazer parte da nossa comunidade</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${cor1}20` }}>
                  <HandHeart className="w-8 h-8" style={{ color: cor1 }} />
                </div>
                <h3 className="font-semibold text-xl mb-3">Seja um Voluntário</h3>
                <p className="text-muted-foreground text-sm mb-6">Use seus dons para servir a Deus e às pessoas.</p>
                <Button className="w-full" style={{ backgroundColor: cor1 }} asChild>
                  <Link to="/seja-voluntario">Quero servir</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${cor1}20` }}>
                  <Users className="w-8 h-8" style={{ color: cor1 }} />
                </div>
                <h3 className="font-semibold text-xl mb-3">Sou Novo</h3>
                <p className="text-muted-foreground text-sm mb-6">Cadastre-se e faça parte da nossa família.</p>
                <Button className="w-full" style={{ backgroundColor: cor1 }} asChild>
                  <Link to="/sou-novo">Cadastrar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CONTRIBUIÇÕES ── */}
      <section className="py-20 text-white" style={{ background: `linear-gradient(135deg, ${cor1}, ${cor2})` }}>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Contribuições</h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            As contribuições são voluntárias e fazem parte da missão de servir a Deus e às pessoas.
          </p>
          <Button size="lg" className="bg-white hover:bg-white/90 shadow-lg" style={{ color: cor1 }} asChild>
            <Link to="/contribuicoes" className="flex items-center gap-2">
              <Heart className="w-5 h-5" /> Contribuir
            </Link>
          </Button>
        </div>
      </section>

      {/* ── CONTATO / LOCALIZAÇÃO ── */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Venha nos visitar</h2>
              <div className="space-y-4 text-muted-foreground">
                {(igreja.endereco || 'A confirmar') && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 shrink-0" style={{ color: cor1 }} />
                    <p>{igreja.endereco ?? 'A confirmar'}</p>
                  </div>
                )}
                {igreja.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 shrink-0" style={{ color: cor1 }} />
                    <p>{igreja.telefone}</p>
                  </div>
                )}
                {igreja.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 shrink-0" style={{ color: cor1 }} />
                    <p>{igreja.email}</p>
                  </div>
                )}
              </div>

              {/* Social links */}
              <div className="flex flex-wrap gap-3 mt-8">
                {igreja.whatsapp && (
                  <a href={`https://wa.me/${igreja.whatsapp.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${cor1}20` }} aria-label="WhatsApp">
                    <MessageCircle className="w-5 h-5" style={{ color: cor1 }} />
                  </a>
                )}
                {igreja.instagram_url && (
                  <a href={igreja.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${cor1}20` }} aria-label="Instagram">
                    <Instagram className="w-5 h-5" style={{ color: cor1 }} />
                  </a>
                )}
                {igreja.youtube_url && (
                  <a href={igreja.youtube_url} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${cor1}20` }} aria-label="YouTube">
                    <Youtube className="w-5 h-5" style={{ color: cor1 }} />
                  </a>
                )}
                {igreja.facebook_url && (
                  <a href={igreja.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${cor1}20` }} aria-label="Facebook">
                    <Facebook className="w-5 h-5" style={{ color: cor1 }} />
                  </a>
                )}
                {igreja.site_url && (
                  <a href={igreja.site_url} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${cor1}20` }} aria-label="Site">
                    <Globe className="w-5 h-5" style={{ color: cor1 }} />
                  </a>
                )}
              </div>
            </div>

            {/* Mapa */}
            <div className="rounded-2xl overflow-hidden border aspect-video bg-muted">
              {igreja.google_maps_url ? (
                <iframe src={igreja.google_maps_url} width="100%" height="100%"
                  style={{ border: 0 }} allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Localização ${igreja.nome}`} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <MapPin className="h-10 w-10" />
                  <p className="text-sm">{localidade || 'Localização a confirmar'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 text-white/80" style={{ backgroundColor: cor2 }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {igreja.logo_url && (
                  <img src={igreja.logo_url} alt="Logo" className="h-8 w-8 object-contain" />
                )}
                <h3 className="font-bold text-white text-lg">{igreja.nome}</h3>
              </div>
              {igreja.slogan && <p className="text-sm text-white/70 mb-4">{igreja.slogan}</p>}
              <div className="space-y-1.5 text-sm">
                {(igreja.endereco) && (
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />{igreja.endereco}
                  </p>
                )}
                {igreja.telefone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" />{igreja.telefone}</p>}
                {igreja.email    && <p className="flex items-center gap-2"><Mail  className="w-4 h-4" />{igreja.email}</p>}
              </div>
            </div>
            <div>
              {(igreja.horario_ebd || igreja.horario_culto || igreja.horario_bases) && (
                <>
                  <h4 className="font-semibold text-white mb-4">Horários</h4>
                  <ul className="space-y-2 text-sm">
                    {igreja.horario_ebd    && <li>{igreja.horario_ebd} — Escola Bíblica</li>}
                    {igreja.horario_culto  && <li>{igreja.horario_culto} — Culto de Celebração</li>}
                    {igreja.horario_bases  && <li>{igreja.horario_bases} — Bases</li>}
                  </ul>
                </>
              )}
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} {igreja.nome}. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link to="/auth" className="hover:text-white transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
