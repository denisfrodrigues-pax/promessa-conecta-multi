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

interface AvisoCard {
  titulo: string;
  conteudo: string;
}

interface CardCultoProps {
  formato: 'stories' | 'feed';
  evento: { titulo: string; data_evento: string; horario_inicio?: string | null };
  itens: LiturgiaItem[];
  musicas: MusicaCard[];
  equipe: GrupoMinisterio[];
  avisos?: AvisoCard[];
  observacoesGerais?: string | null;
  logoUrl?: string | null;
  nomeIgreja?: string | null;
}

const CardCulto = forwardRef<HTMLDivElement, CardCultoProps>(
  ({ formato, evento, musicas, equipe, avisos, observacoesGerais, logoUrl, nomeIgreja }, ref) => {
    const W = 1080;
    const H = formato === 'stories' ? 1920 : 1080;
    const scale = formato === 'feed' ? 0.62 : 1;
    const sz = (n: number) => Math.round(n * scale);
    const px = sz(60);

    const dataStr = format(parseISO(evento.data_evento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    const horaStr = evento.horario_inicio ? evento.horario_inicio.slice(0, 5) : null;

    const confirmedEquipe = equipe
      .map(g => ({ ...g, membros: g.membros.filter(m => m.status === 'confirmado') }))
      .filter(g => g.membros.length > 0);

    return (
      <div ref={ref} style={{
        position: 'relative',
        width: W,
        height: H,
        background: 'linear-gradient(145deg, #0f0c29 0%, #302b63 55%, #24243e 100%)',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Ambient glow — top-center gold */}
        <div style={{
          position: 'absolute',
          top: -120, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,210,0,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Ambient glow — bottom-right deep purple */}
        <div style={{
          position: 'absolute',
          bottom: -250, right: -250,
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(30,20,80,0.9) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ═══ TOPO — Church identity ═══════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: sz(56),
          paddingBottom: sz(32),
          paddingLeft: px,
          paddingRight: px,
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: sz(80), height: sz(80),
                borderRadius: '50%',
                border: `${sz(3)}px solid rgba(255,255,255,0.85)`,
                objectFit: 'cover',
                background: 'rgba(255,255,255,0.1)',
                marginBottom: sz(16),
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            />
          ) : (
            <div style={{
              width: sz(80), height: sz(80),
              borderRadius: '50%',
              border: `${sz(3)}px solid rgba(255,255,255,0.4)`,
              background: 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: sz(34),
              marginBottom: sz(16),
            }}>⛪</div>
          )}

          <div style={{
            fontSize: sz(26),
            fontWeight: 700,
            letterSpacing: Math.max(3, sz(4)),
            textTransform: 'uppercase' as const,
            color: '#ffffff',
            textAlign: 'center' as const,
            lineHeight: 1.3,
          }}>
            {nomeIgreja ?? 'Igreja'}
          </div>

          {/* Separator */}
          <div style={{
            width: '48%', height: 1,
            background: 'rgba(255,255,255,0.22)',
            marginTop: sz(26),
          }} />
        </div>

        {/* ═══ BANNER DO EVENTO ═════════════════════════════════════════════ */}
        <div style={{
          marginLeft: px,
          marginRight: px,
          marginBottom: sz(44),
          borderRadius: sz(16),
          background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
          padding: `${sz(32)}px ${sz(44)}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center' as const,
          boxShadow: '0 8px 40px rgba(247,151,30,0.3)',
        }}>
          <div style={{
            fontSize: sz(66),
            fontWeight: 900,
            color: '#0a0a0a',
            lineHeight: 1.05,
            marginBottom: sz(14),
            letterSpacing: -1,
          }}>
            {evento.titulo}
          </div>

          <div style={{
            fontSize: sz(27),
            color: '#1a1a1a',
            fontWeight: 500,
            textTransform: 'capitalize' as const,
            marginBottom: horaStr ? sz(16) : 0,
          }}>
            {dataStr}
          </div>

          {horaStr && (
            <div style={{
              background: 'rgba(255,255,255,0.82)',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: sz(23),
              padding: `${sz(6)}px ${sz(24)}px`,
              borderRadius: sz(50),
            }}>
              {horaStr}
            </div>
          )}
        </div>

        {/* ═══ CONTENT — Músicas + Equipe ══════════════════════════════════ */}
        <div style={{
          paddingLeft: px,
          paddingRight: px,
          display: 'flex',
          flexDirection: 'column',
          gap: sz(36),
        }}>

          {/* ── Músicas ─────────────────────────────────────────────────── */}
          {musicas.length > 0 && (
            <div>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sz(14), marginBottom: sz(16) }}>
                <span style={{
                  fontSize: sz(17),
                  fontWeight: 800,
                  letterSpacing: Math.max(2, sz(4)),
                  color: '#ffd200',
                  whiteSpace: 'nowrap' as const,
                }}>MÚSICAS</span>
                <div style={{
                  flex: 1, height: 1,
                  background: 'linear-gradient(90deg, rgba(255,210,0,0.45) 0%, transparent 100%)',
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: sz(10) }}>
                {musicas.slice(0, 8).map((m, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.07)',
                    borderLeft: `3px solid #ffd200`,
                    borderRadius: `0 ${sz(10)}px ${sz(10)}px 0`,
                    padding: `${sz(16)}px ${sz(24)}px`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: sz(14),
                  }}>
                    <span style={{
                      fontSize: sz(16),
                      fontWeight: 700,
                      color: '#ffd200',
                      minWidth: sz(24),
                      textAlign: 'right' as const,
                      flexShrink: 0,
                      paddingTop: sz(2),
                    }}>{m.ordem}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: sz(22),
                        fontWeight: 700,
                        color: '#ffffff',
                        lineHeight: 1.3,
                        wordWrap: 'break-word' as const,
                        overflowWrap: 'break-word' as const,
                        whiteSpace: 'normal' as const,
                      }}>
                        {m.titulo}
                      </div>
                      {m.artista && (
                        <div style={{
                          fontSize: sz(16),
                          color: '#aaaaaa',
                          fontStyle: 'italic' as const,
                          marginTop: sz(4),
                          wordWrap: 'break-word' as const,
                          overflowWrap: 'break-word' as const,
                          whiteSpace: 'normal' as const,
                        }}>
                          {m.artista}
                        </div>
                      )}
                    </div>
                    {m.tom && (
                      <div style={{
                        background: 'rgba(255,210,0,0.13)',
                        border: '1px solid rgba(255,210,0,0.38)',
                        color: '#ffd200',
                        fontSize: sz(13),
                        fontWeight: 700,
                        padding: `${sz(3)}px ${sz(10)}px`,
                        borderRadius: sz(6),
                        whiteSpace: 'nowrap' as const,
                        flexShrink: 0,
                        marginTop: sz(2),
                      }}>
                        {m.tom}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Avisos ──────────────────────────────────────────────────── */}
          {avisos && avisos.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: sz(14), marginBottom: sz(16) }}>
                <span style={{
                  fontSize: sz(17),
                  fontWeight: 800,
                  letterSpacing: Math.max(2, sz(4)),
                  color: '#ffd200',
                  whiteSpace: 'nowrap' as const,
                }}>AVISOS</span>
                <div style={{
                  flex: 1, height: 1,
                  background: 'linear-gradient(90deg, rgba(255,210,0,0.45) 0%, transparent 100%)',
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: sz(12) }}>
                {avisos.map((a, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderLeft: `3px solid rgba(255,210,0,0.5)`,
                    borderRadius: `0 ${sz(10)}px ${sz(10)}px 0`,
                    padding: `${sz(14)}px ${sz(20)}px`,
                  }}>
                    <div style={{
                      fontSize: sz(19),
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: a.conteudo ? sz(6) : 0,
                      wordWrap: 'break-word' as const,
                      overflowWrap: 'break-word' as const,
                    }}>
                      {a.titulo}
                    </div>
                    {a.conteudo && (
                      <div style={{
                        fontSize: sz(15),
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1.5,
                        wordWrap: 'break-word' as const,
                        overflowWrap: 'break-word' as const,
                        whiteSpace: 'pre-wrap' as const,
                      }}>
                        {a.conteudo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Equipe do Dia ────────────────────────────────────────────── */}
          {confirmedEquipe.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: sz(14), marginBottom: sz(16) }}>
                <span style={{
                  fontSize: sz(17),
                  fontWeight: 800,
                  letterSpacing: Math.max(2, sz(4)),
                  color: '#ffd200',
                  whiteSpace: 'nowrap' as const,
                }}>EQUIPE DO DIA</span>
                <div style={{
                  flex: 1, height: 1,
                  background: 'linear-gradient(90deg, rgba(255,210,0,0.45) 0%, transparent 100%)',
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: sz(16) }}>
                {confirmedEquipe.map((grupo, gi) => (
                  <div key={gi}>
                    <div style={{
                      fontSize: sz(13),
                      fontWeight: 700,
                      letterSpacing: Math.max(1, sz(2)),
                      textTransform: 'uppercase' as const,
                      color: 'rgba(255,210,0,0.8)',
                      marginBottom: sz(8),
                    }}>
                      {grupo.nome}
                    </div>
                    {grupo.membros.map((m, mi) => (
                      <div key={mi} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: sz(12),
                        marginBottom: sz(7),
                        paddingLeft: sz(4),
                      }}>
                        <span style={{ fontSize: sz(13), color: '#4ade80', flexShrink: 0 }}>✓</span>
                        <span style={{
                          fontSize: sz(21),
                          fontWeight: 600,
                          color: '#ffffff',
                          flex: 1,
                        }}>
                          {m.nome}
                        </span>
                        <span style={{
                          fontSize: sz(15),
                          color: '#888888',
                          flexShrink: 0,
                        }}>
                          {m.funcao}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ── Observações Gerais ──────────────────────────────────────── */}
          {observacoesGerais && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: sz(14), marginBottom: sz(16) }}>
                <span style={{
                  fontSize: sz(17),
                  fontWeight: 800,
                  letterSpacing: Math.max(2, sz(4)),
                  color: 'rgba(255,255,255,0.5)',
                  whiteSpace: 'nowrap' as const,
                }}>OBSERVAÇÕES</span>
                <div style={{
                  flex: 1, height: 1,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
                }} />
              </div>
              <p style={{
                fontSize: sz(17),
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.6,
                fontStyle: 'italic' as const,
                wordWrap: 'break-word' as const,
                overflowWrap: 'break-word' as const,
                whiteSpace: 'pre-wrap' as const,
              }}>
                {observacoesGerais}
              </p>
            </div>
          )}
        </div>

        {/* ═══ RODAPÉ ═══════════════════════════════════════════════════════ */}
        <div style={{
          paddingLeft: px,
          paddingRight: px,
          paddingTop: sz(20),
          paddingBottom: sz(40),
          borderTop: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
        }}>
          <span style={{
            fontSize: sz(16),
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 600,
          }}>
            {nomeIgreja ?? ''}
          </span>
          <span style={{
            fontSize: sz(12),
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: 1,
          }}>
            Promessa Conecta
          </span>
        </div>
      </div>
    );
  }
);

CardCulto.displayName = 'CardCulto';
export default CardCulto;
export type { CardCultoProps, MusicaCard, GrupoMinisterio, MembroCard, AvisoCard };
