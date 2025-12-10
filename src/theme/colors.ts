// Igreja da Promessa - Paleta Master
// Baseada na cor real da logo (#5A9462)

export const colors = {
  // Primary (base logo) - full palette
  primary: {
    50: "#F2F7F4",
    100: "#D9E8DF",
    200: "#B4D1C0",
    300: "#8FBBA0",
    400: "#6BA481",
    500: "#5A9462", // Cor da logo
    600: "#4B7B51",
    700: "#396939",
    800: "#2A4A2A",
    900: "#1A2F1A",
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
    900: "#1A2F1A",
    800: "#2A4A2A",
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
  primary: colors.primary[500],
  primaryLight: colors.primary[300],
  primaryDark: colors.primary[700],
  secondary: colors.secondary.DEFAULT,
  secondaryLight: colors.secondary[300],
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  neutral: colors.neutral[400],
  // Chart specific fills and strokes
  fill: "#5A9462",
  stroke: "#396939",
} as const;

export default colors;
