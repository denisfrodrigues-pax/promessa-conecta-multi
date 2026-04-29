import { forwardRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LiturgiaItem {
  ordem: number;
  tipo: string;
  titulo: string;
  responsavel: string | null;
  duracao_minutos: number | null;
}

interface MusicaCard {
  ordem: number;
  titulo: string;
  artista: string;
  tom?: string | null;
}

interface MembroCard {
  nome: string;
  funcao: string;
  status: string;
}

interface GrupoMinisterio {
  nome: string;
  membros: MembroCard[];
}

interface CardCultoProps {
  formato: 'stories' | 'feed';
  evento: { titulo: string; data_evento: string; horario_inicio?: string | null };
  itens: LiturgiaItem[];
  musicas: MusicaCard[];
  equipe: GrupoMinisterio[];
  logoUrl?: string | null;
  nomeIgreja?: string | null;
}

const TIPO_LABEL: Record<string, string> = {
  abertura: 'Abertura', louvor: 'Louvor', oracao: 'Oração', palavra: 'Palavra',
  aviso: 'Aviso', oferta: 'Oferta', encerramento: 'Encerramento', outro: 'Outro',
};

const STATUS_ICON: Record<string, string> = {
  confirmado: '✅', pendente: '⏳',
};

const CardCulto = forwardRef<HTMLDivElement, CardCultoProps>(
  ({ formato, evento, itens, musicas, equipe, logoUrl, nomeIgreja }, ref) => {
    const W = 1080;
    const H = formato === 'stories' ? 1920 : 1080;

    const dataStr = format(parseISO(evento.data_evento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    const horaStr = evento.horario_inicio ? evento.horario_inicio.slice(0, 5) : null;

    const s: Record<string, React.CSSProperties> = {
      root: {
        position: 'relative',
        width: W,
        height: H,
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 45%, #0f3460 100%)',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '64px 72px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      },
      noiseOverlay: {
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Crect width=\'1\' height=\'1\' fill=\'white\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
      },
      glowTop: {
        position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(96,165,250,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      },
      header: {
        display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40,
      },
      logo: {
        width: 72, height: 72, borderRadius: 16,
        objectFit: 'contain', background: 'rgba(255,255,255,0.1)',
        padding: 6, flexShrink: 0,
      },
      logoPlaceholder: {
        width: 72, height: 72, borderRadius: 16,
        background: 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, flexShrink: 0,
      },
      churchName: {
        fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: 1,
        textTransform: 'uppercase',
      },
      dividerLine: {
        height: 1, background: 'linear-gradient(90deg, rgba(96,165,250,0.6) 0%, rgba(96,165,250,0) 100%)',
        marginBottom: 40,
      },
      eventTitle: {
        fontSize: formato === 'stories' ? 68 : 52, fontWeight: 800,
        lineHeight: 1.1, marginBottom: 16,
        background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      },
      eventMeta: {
        fontSize: 22, color: 'rgba(255,255,255,0.65)', marginBottom: 8, fontWeight: 400,
        textTransform: 'capitalize',
      },
      hora: {
        display: 'inline-block', marginLeft: 12,
        background: 'rgba(96,165,250,0.2)', borderRadius: 8,
        padding: '2px 12px', fontSize: 20, color: '#93c5fd', fontWeight: 600,
      },
      sectionDivider: {
        height: 1, background: 'rgba(255,255,255,0.12)', margin: '32px 0',
      },
      sectionTitle: {
        fontSize: 16, fontWeight: 700, letterSpacing: 3,
        textTransform: 'uppercase', color: '#93c5fd', marginBottom: 18,
      },
      liturgiaRow: {
        display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14,
      },
      liturgiaNum: {
        fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 700,
        minWidth: 24, textAlign: 'right' as const,
      },
      liturgiaTitulo: {
        fontSize: 20, fontWeight: 600, flex: 1,
      },
      liturgiaTipo: {
        fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic',
      },
      musicaRow: {
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12,
      },
      musicaNum: {
        fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 700, minWidth: 24, textAlign: 'right' as const,
      },
      musicaTitulo: {
        fontSize: 19, fontWeight: 600, flex: 1,
      },
      musicaArtista: {
        fontSize: 14, color: 'rgba(255,255,255,0.55)',
      },
      tomBadge: {
        fontSize: 13, fontWeight: 700, background: 'rgba(96,165,250,0.2)',
        color: '#93c5fd', padding: '2px 10px', borderRadius: 6,
      },
      equipeGrupo: { marginBottom: 20 },
      equipeMinisterioNome: {
        fontSize: 14, fontWeight: 700, letterSpacing: 1.5,
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8,
      },
      equipeMembroRow: {
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
        fontSize: 17,
      },
      footer: {
        marginTop: 'auto', paddingTop: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      },
      footerChurch: {
        fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: 600,
      },
      watermark: {
        fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: 1,
      },
    };

    const confirmedEquipe = equipe
      .map(g => ({ ...g, membros: g.membros.filter(m => m.status === 'confirmado') }))
      .filter(g => g.membros.length > 0);

    return (
      <div ref={ref} style={s.root}>
        <div style={s.noiseOverlay} />
        <div style={s.glowTop} />

        {/* Header */}
        <div style={s.header}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={s.logo} crossOrigin="anonymous" />
          ) : (
            <div style={s.logoPlaceholder}>⛪</div>
          )}
          <span style={s.churchName}>{nomeIgreja ?? 'Igreja'}</span>
        </div>

        <div style={s.dividerLine} />

        {/* Event title */}
        <div style={s.eventTitle}>{evento.titulo}</div>
        <div style={s.eventMeta}>
          {dataStr}
          {horaStr && <span style={s.hora}>{horaStr}</span>}
        </div>

        {/* Liturgy */}
        {itens.length > 0 && (
          <>
            <div style={s.sectionDivider} />
            <div style={s.sectionTitle}>Ordem do Culto</div>
            {itens.slice(0, formato === 'stories' ? 10 : 8).map((item, i) => (
              <div key={i} style={s.liturgiaRow}>
                <span style={s.liturgiaNum}>{item.ordem}</span>
                <span style={s.liturgiaTitulo}>{item.titulo}</span>
                <span style={s.liturgiaTipo}>{TIPO_LABEL[item.tipo] ?? item.tipo}</span>
                {item.duracao_minutos ? (
                  <span style={{ ...s.liturgiaTipo, color: 'rgba(255,255,255,0.35)' }}>
                    {item.duracao_minutos}min
                  </span>
                ) : null}
              </div>
            ))}
          </>
        )}

        {/* Músicas */}
        {musicas.length > 0 && (
          <>
            <div style={s.sectionDivider} />
            <div style={s.sectionTitle}>Músicas</div>
            {musicas.slice(0, 6).map((m, i) => (
              <div key={i} style={s.musicaRow}>
                <span style={s.musicaNum}>{m.ordem}</span>
                <div style={{ flex: 1 }}>
                  <span style={s.musicaTitulo}>{m.titulo}</span>
                  <span style={s.musicaArtista}> — {m.artista}</span>
                </div>
                {m.tom && <span style={s.tomBadge}>{m.tom}</span>}
              </div>
            ))}
          </>
        )}

        {/* Equipe */}
        {confirmedEquipe.length > 0 && (
          <>
            <div style={s.sectionDivider} />
            <div style={s.sectionTitle}>Equipe do Dia</div>
            {confirmedEquipe.map((grupo, gi) => (
              <div key={gi} style={s.equipeGrupo}>
                <div style={s.equipeMinisterioNome}>{grupo.nome}</div>
                {grupo.membros.map((m, mi) => (
                  <div key={mi} style={s.equipeMembroRow}>
                    <span>✅</span>
                    <span style={{ fontWeight: 500 }}>{m.nome}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>— {m.funcao}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* Footer */}
        <div style={s.footer}>
          <span style={s.footerChurch}>{nomeIgreja ?? ''}</span>
          <span style={s.watermark}>Promessa Conecta</span>
        </div>
      </div>
    );
  }
);

CardCulto.displayName = 'CardCulto';
export default CardCulto;
export type { CardCultoProps, MusicaCard, GrupoMinisterio, MembroCard };
