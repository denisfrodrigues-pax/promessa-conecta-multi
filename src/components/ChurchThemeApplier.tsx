import { useEffect } from 'react';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';

/**
 * Converte hex (#rrggbb) para valores HSL separados [h, s, l]
 * usados pelas CSS variables do Tailwind: "h s% l%"
 */
function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return [130, 25, 47]; // promessa default

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, Math.round(l * 100)];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Componente nulo que aplica as CSS variables da igreja no <html>.
 * Deve ficar dentro do AuthProvider.
 *
 * Atualiza automaticamente todas as classes `text-promessa-*`, `bg-promessa-*`
 * e também expõe `--color-primary` para uso inline.
 */
export function ChurchThemeApplier() {
  const { config, loading } = useIgrejaConfig();

  useEffect(() => {
    if (loading) return;

    const hex = config.cor_primaria;
    if (!hex || !hex.startsWith('#')) return;

    const [h, s, l] = hexToHsl(hex);
    const root = document.documentElement;
    const lDark = Math.max(0, l - 15);
    const lLight = Math.min(100, l + 10);
    // Texto branco para cores com lightness < 60, escuro para mais claras
    const fg = l < 60 ? '0 0% 100%' : '0 0% 10%';

    // ── Variáveis diretas (inline/arbitrário) ────────────────────────
    root.style.setProperty('--color-primary', hex);
    root.style.setProperty('--color-primary-hex', hex);

    // ── shadcn/ui: botões, inputs, ring, sidebar ─────────────────────
    root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--primary-foreground', fg);
    root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
    root.style.setProperty('--sidebar-primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--sidebar-primary-foreground', fg);

    // ── Escala completa promessa ──────────────────────────────────────
    const scale: Record<string, number> = {
      50: 96, 100: 87, 200: 76, 300: 65, 400: 53,
      500: 47, 600: 39, 700: 32, 800: 23, 900: 14,
    };
    for (const [shade, targetL] of Object.entries(scale)) {
      root.style.setProperty(`--promessa-${shade}`, `${h} ${s}% ${targetL}%`);
    }

    // ── Variantes primary ─────────────────────────────────────────────
    root.style.setProperty('--promessa-primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--promessa-primary-dark', `${h} ${s}% ${lDark}%`);
    root.style.setProperty('--promessa-primary-light', `${h} ${s}% ${lLight}%`);

    // ── Gradientes ────────────────────────────────────────────────────
    root.style.setProperty(
      '--gradient-primary',
      `linear-gradient(135deg, hsl(${h} ${s}% ${l}%) 0%, hsl(${h} ${s}% ${lLight}%) 100%)`
    );

    // ── Charts ────────────────────────────────────────────────────────
    root.style.setProperty('--chart-primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--chart-primary-dark', `${h} ${s}% ${lDark}%`);
    root.style.setProperty('--chart-primary-light', `${h} ${s}% ${lLight}%`);

    // ── Cor secundária ────────────────────────────────────────────────
    if (config.cor_secundaria) {
      root.style.setProperty('--color-secondary', config.cor_secundaria);
      const [h2, s2, l2] = hexToHsl(config.cor_secundaria);
      root.style.setProperty('--promessa-secondary', `${h2} ${s2}% ${l2}%`);
    }
  }, [config.cor_primaria, config.cor_secundaria, loading]);

  return null;
}
