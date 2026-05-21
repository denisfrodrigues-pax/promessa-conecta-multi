import { forwardRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface ResumoVisualProps {
  evento: { titulo: string; data_evento: string; horario_inicio?: string | null };
  musicas: MusicaCard[];
  equipe: GrupoMinisterio[];
  avisos?: AvisoCard[];
  observacoesGerais?: string | null;
  logoUrl?: string | null;
  nomeIgreja?: string | null;
}

const G_ACCENT = '#4ade80';
const G_HEADER = '#86efac';
const YELLOW = '#fde047';

function SectionHeader({ label, color, lineColor }: { label: string; color: string; lineColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 4, color, whiteSpace: 'nowrap' as const }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${lineColor} 0%, transparent 100%)` }} />
    </div>
  );
}

const ResumoVisual = forwardRef<HTMLDivElement, ResumoVisualProps>(
  ({ evento, musicas, equipe, avisos, observacoesGerais, logoUrl, nomeIgreja }, ref) => {
    const PAD = 64;

    const dataStr = format(parseISO(evento.data_evento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    const horaStr = evento.horario_inicio ? evento.horario_inicio.slice(0, 5) : null;

    const confirmedEquipe = equipe
      .map(g => ({ ...g, membros: g.membros.filter(m => m.status === 'confirmado') }))
      .filter(g => g.membros.length > 0);

    const pendingEquipe = equipe
      .map(g => ({ ...g, membros: g.membros.filter(m => m.status === 'pendente') }))
      .filter(g => g.membros.length > 0);

    const hasMusicas = musicas.length > 0;
    const hasAvisos = avisos && avisos.length > 0;
    const hasEquipe = confirmedEquipe.length > 0 || pendingEquipe.length > 0;

    return (
      <div ref={ref} style={{
        width: 1400,
        background: 'linear-gradient(145deg, #1a2e1a 0%, #273f27 55%, #1a2e1a 100%)',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: '#ffffff',
        boxSizing: 'border-box',
        padding: PAD,
      }}>

        {/* ── CABEÇALHO ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 40 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: 80, height: 80,
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.85)',
                objectFit: 'cover',
                flexShrink: 0,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            />
          ) : (
            <div style={{
              width: 80, height: 80,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, flexShrink: 0,
            }}>
              ⛪
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 5,
              textTransform: 'uppercase' as const,
              color: G_ACCENT,
              marginBottom: 6,
            }}>
              {nomeIgreja ?? 'Igreja'}
            </div>
            <div style={{
              fontSize: 40,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: 10,
            }}>
              {evento.titulo}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
              <span style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.72)',
                textTransform: 'capitalize' as const,
              }}>
                {dataStr}
              </span>
              {horaStr && (
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '4px 18px',
                  borderRadius: 30,
                }}>
                  {horaStr}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── DIVISOR ────────────────────────────────────────────────────── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 40 }} />

        {/* ── MÚSICAS + AVISOS (2 colunas) ───────────────────────────────── */}
        {(hasMusicas || hasAvisos) && (
          <div style={{ display: 'flex', gap: 40, marginBottom: 40, alignItems: 'flex-start' }}>

            {hasMusicas && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <SectionHeader label="MÚSICAS" color={G_HEADER} lineColor="rgba(134,239,172,0.45)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {musicas.map((m, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.07)',
                      borderLeft: `3px solid ${G_ACCENT}`,
                      borderRadius: '0 8px 8px 0',
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: G_ACCENT, minWidth: 20, flexShrink: 0 }}>
                        {m.ordem}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#ffffff',
                          lineHeight: 1.3,
                          wordWrap: 'break-word' as const,
                        }}>
                          {m.titulo}
                        </div>
                        {m.artista && (
                          <div style={{
                            fontSize: 13,
                            color: '#aaaaaa',
                            fontStyle: 'italic' as const,
                            marginTop: 2,
                          }}>
                            {m.artista}
                          </div>
                        )}
                      </div>
                      {m.tom && (
                        <div style={{
                          background: 'rgba(74,222,128,0.13)',
                          border: '1px solid rgba(74,222,128,0.38)',
                          color: G_ACCENT,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          whiteSpace: 'nowrap' as const,
                          flexShrink: 0,
                        }}>
                          {m.tom}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasAvisos && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <SectionHeader label="AVISOS" color={G_HEADER} lineColor="rgba(134,239,172,0.45)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {avisos!.map((a, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderLeft: '3px solid rgba(74,222,128,0.5)',
                      borderRadius: '0 8px 8px 0',
                      padding: '12px 16px',
                    }}>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#ffffff',
                        marginBottom: a.conteudo ? 5 : 0,
                        wordWrap: 'break-word' as const,
                      }}>
                        {a.titulo}
                      </div>
                      {a.conteudo && (
                        <div style={{
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.7)',
                          lineHeight: 1.55,
                          wordWrap: 'break-word' as const,
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

            {/* placeholder column se só há músicas (mantém alinhamento) */}
            {hasMusicas && !hasAvisos && <div style={{ flex: 1 }} />}
            {!hasMusicas && hasAvisos && <div style={{ flex: 1 }} />}
          </div>
        )}

        {/* ── EQUIPE: CONFIRMADOS + PENDENTES (2 colunas) ───────────────── */}
        {hasEquipe && (
          <div style={{ display: 'flex', gap: 40, marginBottom: 40, alignItems: 'flex-start' }}>

            {confirmedEquipe.length > 0 && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <SectionHeader label="CONFIRMADOS" color={G_HEADER} lineColor="rgba(134,239,172,0.45)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {confirmedEquipe.map((grupo, gi) => (
                    <div key={gi}>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: 'uppercase' as const,
                        color: 'rgba(134,239,172,0.8)',
                        marginBottom: 7,
                      }}>
                        {grupo.nome}
                      </div>
                      {grupo.membros.map((m, mi) => (
                        <div key={mi} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 5,
                          paddingLeft: 4,
                        }}>
                          <span style={{ fontSize: 12, color: G_ACCENT, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', flex: 1 }}>
                            {m.nome}
                          </span>
                          <span style={{ fontSize: 12, color: '#888888', flexShrink: 0 }}>
                            {m.funcao}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingEquipe.length > 0 && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <SectionHeader label="PENDENTES" color={YELLOW} lineColor="rgba(253,224,71,0.4)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {pendingEquipe.map((grupo, gi) => (
                    <div key={gi}>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: 'uppercase' as const,
                        color: 'rgba(253,224,71,0.8)',
                        marginBottom: 7,
                      }}>
                        {grupo.nome}
                      </div>
                      {grupo.membros.map((m, mi) => (
                        <div key={mi} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 5,
                          paddingLeft: 4,
                        }}>
                          <span style={{ fontSize: 12, color: YELLOW, flexShrink: 0 }}>⏳</span>
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.75)', flex: 1 }}>
                            {m.nome}
                          </span>
                          <span style={{ fontSize: 12, color: '#888888', flexShrink: 0 }}>
                            {m.funcao}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* preenche coluna vazia se só há confirmados ou só há pendentes */}
            {confirmedEquipe.length > 0 && pendingEquipe.length === 0 && <div style={{ flex: 1 }} />}
            {confirmedEquipe.length === 0 && pendingEquipe.length > 0 && <div style={{ flex: 1 }} />}
          </div>
        )}

        {/* ── OBSERVAÇÕES ────────────────────────────────────────────────── */}
        {observacoesGerais && (
          <div style={{ marginBottom: 40 }}>
            <SectionHeader label="OBSERVAÇÕES" color="rgba(255,255,255,0.5)" lineColor="rgba(255,255,255,0.15)" />
            <p style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.65,
              fontStyle: 'italic' as const,
              wordWrap: 'break-word' as const,
              whiteSpace: 'pre-wrap' as const,
              margin: 0,
            }}>
              {observacoesGerais}
            </p>
          </div>
        )}

        {/* ── RODAPÉ ─────────────────────────────────────────────────────── */}
        <div style={{
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
            {nomeIgreja ?? ''}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: 1 }}>
            Promessa Conecta
          </span>
        </div>
      </div>
    );
  }
);

ResumoVisual.displayName = 'ResumoVisual';
export default ResumoVisual;
export type { ResumoVisualProps, MusicaCard, GrupoMinisterio, MembroCard, AvisoCard };
