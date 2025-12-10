// Igreja da Promessa - Paleta Master
// Baseada na cor real da logo (#5A9462)

export const colors = {
  // Primary (base logo)
  primary: {
    900: "#1F3A25",
    800: "#2F5738",
    700: "#3F724A",
    600: "#4E8D5D",
    500: "#5A9462", // Cor da logo
    400: "#73A97A",
    300: "#8FBE92",
    200: "#B6D8BA",
    100: "#D9ECDD",
    DEFAULT: "#5A9462",
    dark: "#396939",
    light: "#73A97A",
  },

  // Secondary (verde acinzentado / sofisticado)
  secondary: {
    900: "#33403B",
    700: "#546A62",
    500: "#85A89A",
    300: "#B7CEC4",
    100: "#E4EEE9",
    DEFAULT: "#85A89A",
    light: "#B7CEC4",
  },

  // Neutrals
  neutral: {
    950: "#0D0E0F",
    900: "#1F2324",
    800: "#2A2E2F",
    700: "#353A3B",
    600: "#3E4546",
    500: "#5A6364",
    400: "#7A8687",
    300: "#9BA5A6",
    200: "#C7CECF",
    100: "#E8EBEC",
    50: "#FCF7F6", // Background principal
  },

  // Background & Surface
  background: "#FCF7F6",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F7F6",

  // Accent
  accent: "#396939",

  // Semantic
  success: "#4CAF50",
  warning: "#E6A327",
  error: "#D9534F",
  info: "#5A9462",
} as const;

// CSS Variables mapping
export const cssVars = {
  "--color-primary": colors.primary.DEFAULT,
  "--color-primary-dark": colors.primary.dark,
  "--color-primary-light": colors.primary.light,
  "--color-secondary": colors.secondary.DEFAULT,
  "--color-secondary-light": colors.secondary.light,
  "--color-bg": colors.background,
  "--color-surface": colors.surface,
  "--color-surface-alt": colors.surfaceAlt,
  "--color-neutral-900": colors.neutral[900],
  "--color-neutral-600": colors.neutral[600],
  "--color-neutral-400": colors.neutral[400],
  "--color-neutral-200": colors.neutral[200],
  "--color-accent": colors.accent,
  "--color-success": colors.success,
  "--color-warning": colors.warning,
  "--color-error": colors.error,
} as const;

// Recharts color palette for graphs
export const chartColors = {
  primary: colors.primary.DEFAULT,
  primaryLight: colors.primary[300],
  primaryDark: colors.primary[700],
  secondary: colors.secondary.DEFAULT,
  secondaryLight: colors.secondary[300],
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  neutral: colors.neutral[400],
} as const;

export default colors;
