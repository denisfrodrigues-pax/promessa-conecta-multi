/**
 * Converte hex (#rrggbb) para valores HSL separados [h, s, l]
 * usados pelas CSS variables do Tailwind: "h s% l%"
 */
export function hexToHsl(hex: string): [number, number, number] {
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

const THEME_PROPERTIES = [
  '--color-primary-hex',
  '--primary',
  '--primary-foreground',
  '--ring',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--promessa-50', '--promessa-100', '--promessa-200', '--promessa-300', '--promessa-400',
  '--promessa-500', '--promessa-600', '--promessa-700', '--promessa-800', '--promessa-900',
  '--promessa-primary', '--promessa-primary-dark', '--promessa-primary-light',
  '--accent', '--accent-foreground',
  '--gradient-primary',
  '--gradient-hero',
  '--chart-primary', '--chart-primary-dark', '--chart-primary-light',
  '--color-secondary', '--promessa-secondary',
] as const;

/**
 * Aplica a paleta de uma igreja (cor_primaria/cor_secundaria) nas CSS custom
 * properties consumidas pelo shadcn/ui e pela escala `--promessa-*` do Tailwind
 * (bg-primary, bg-promessa-900, bg-gradient-hero, etc). Compartilhado entre
 * ChurchThemeApplier (tema do usuário logado) e IgrejaSlugContext (tema por
 * slug da URL, sem exigir login).
 */
export function applyChurchTheme(corPrimaria: string | null | undefined, corSecundaria?: string | null): void {
  if (!corPrimaria || !corPrimaria.startsWith('#')) return;

  const [h, s, l] = hexToHsl(corPrimaria);
  const root = document.documentElement;
  const lDark = Math.max(0, l - 15);
  const lLight = Math.min(100, l + 10);
  // Texto branco para cores com lightness < 60, escuro para mais claras
  const fg = l < 60 ? '0 0% 100%' : '0 0% 10%';

  root.style.setProperty('--color-primary-hex', corPrimaria);

  root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
  root.style.setProperty('--primary-foreground', fg);
  root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
  root.style.setProperty('--sidebar-primary', `${h} ${s}% ${l}%`);
  root.style.setProperty('--sidebar-primary-foreground', fg);

  const scale: Record<string, number> = {
    50: 96, 100: 87, 200: 76, 300: 65, 400: 53,
    500: 47, 600: 39, 700: 32, 800: 23, 900: 14,
  };
  for (const [shade, targetL] of Object.entries(scale)) {
    root.style.setProperty(`--promessa-${shade}`, `${h} ${s}% ${targetL}%`);
  }

  root.style.setProperty('--promessa-primary', `${h} ${s}% ${l}%`);
  root.style.setProperty('--promessa-primary-dark', `${h} ${s}% ${lDark}%`);
  root.style.setProperty('--promessa-primary-light', `${h} ${s}% ${lLight}%`);

  // --accent alimenta o hover de variant="outline"/"ghost" do Button (shadcn) —
  // variável separada de --primary, também hardcoded em verde no default.
  root.style.setProperty('--accent', `${h} ${s}% ${lLight}%`);
  root.style.setProperty('--accent-foreground', fg);

  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${h} ${s}% ${l}%) 0%, hsl(${h} ${s}% ${lLight}%) 100%)`
  );
  // Usada por `bg-gradient-hero` (Auth.tsx, InstallPWA.tsx, cards de destaque
  // do app do membro) — variável separada de --gradient-primary, também
  // hardcoded em verde no default estático do index.css.
  root.style.setProperty(
    '--gradient-hero',
    `linear-gradient(135deg, hsl(${h} ${s}% ${l}%) 0%, hsl(${h} ${s}% ${lDark}%) 50%, hsl(${h} ${s}% ${lLight}% / 0.3) 100%)`
  );

  root.style.setProperty('--chart-primary', `${h} ${s}% ${l}%`);
  root.style.setProperty('--chart-primary-dark', `${h} ${s}% ${lDark}%`);
  root.style.setProperty('--chart-primary-light', `${h} ${s}% ${lLight}%`);

  if (corSecundaria) {
    root.style.setProperty('--color-secondary', corSecundaria);
    const [h2, s2, l2] = hexToHsl(corSecundaria);
    root.style.setProperty('--promessa-secondary', `${h2} ${s2}% ${l2}%`);
  } else {
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--promessa-secondary');
  }
}

/**
 * Remove as CSS custom properties aplicadas por applyChurchTheme, devolvendo
 * o controle para os defaults estáticos do stylesheet (usado ao sair do
 * contexto de uma igreja, ex.: navegar de /i/:slug/* para a raiz).
 */
export function resetChurchTheme(): void {
  const root = document.documentElement;
  for (const prop of THEME_PROPERTIES) {
    root.style.removeProperty(prop);
  }
}
