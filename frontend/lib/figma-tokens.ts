/**
 * Design tokens extracted from Figma (VedaAI Hiring Assignment).
 * Source of truth: design/figma-specs/FIGMA_SPECS.json + design/screens/*.png
 */
export const figma = {
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceMuted: '#fafafa',
    surfaceHover: '#f4f4f5',
    ink: '#1c1c1e',
    inkSecondary: '#858585',
    inkTertiary: '#a1a1aa',
    inkMeta: '#4c4c4c',
    accent: '#ff6136',
    border: '#e4e4e7',
    borderLight: '#e5e5e5',
    borderDashed: '#d4d4d8',
    success: '#4caf50',
    danger: '#ff4141',
    navDark: '#171717',
    outputShell: '#2d2d2d',
  },
  radius: {
    shell: '24px',
    card: '24px',
    cardLg: '32px',
    navItem: '16px',
    profile: '20px',
    upload: '20px',
  },
  size: {
    sidebar: 280,
    headerDesktop: 60,
    headerMobile: 72,
    bottomNav: 72,
    cta: 52,
    filterBar: 64,
    searchInput: 46,
    filterMobile: 52,
    fab: 56,
    cardHeight: 142,
  },
} as const
