import { createTheme } from '@mui/material/styles'

/** Universal sans-serif stack: native UI font on every platform, no web-font download. */
export const fontSans =
  "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'"

/**
 * Single source of truth for colours. MUI emits these as `--mui-palette-*` CSS variables,
 * which Tailwind consumes through `@theme inline` in index.css.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#2563eb', dark: '#1d4ed8' },
        secondary: { main: '#7c3aed' },
        error: { main: '#dc2626' },
        warning: { main: '#b45309' },
        success: { main: '#15803d' },
        info: { main: '#0369a1' },
        background: { default: '#f6f8fb', paper: '#ffffff' },
        text: { primary: '#0f172a', secondary: '#64748b' },
        divider: '#e2e8f0',
        action: { hover: 'rgba(15, 23, 42, 0.04)', selected: 'rgba(37, 99, 235, 0.08)' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#3b82f6', dark: '#60a5fa' },
        secondary: { main: '#a78bfa' },
        error: { main: '#f87171' },
        warning: { main: '#fbbf24' },
        success: { main: '#4ade80' },
        info: { main: '#38bdf8' },
        background: { default: '#080c14', paper: '#0e1420' },
        text: { primary: '#e5eaf1', secondary: '#94a3b8' },
        divider: '#1f2a3b',
        action: { hover: 'rgba(148, 163, 184, 0.08)', selected: 'rgba(59, 130, 246, 0.16)' },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: fontSans,
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    h1: { fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.015em' },
    overline: { fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1.6 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8 },
        sizeSmall: { padding: '3px 10px' },
        // Neutral outlined buttons: hairline border instead of currentColor.
        outlined: ({ ownerState }) =>
          ownerState.color === 'inherit'
            ? { borderColor: 'var(--mui-palette-divider)', backgroundColor: 'var(--mui-palette-background-paper)', '&:hover': { backgroundColor: 'var(--mui-palette-action-hover)', borderColor: 'var(--mui-palette-text-disabled)' } }
            : {},
      },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        sizeSmall: { height: 22, fontSize: 11.5 },
        outlined: ({ ownerState }) => (ownerState.color === 'default' || !ownerState.color ? { borderColor: 'var(--mui-palette-divider)' } : {}),
      },
    },
    MuiInputBase: { styleOverrides: { root: { fontSize: 14 } } },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 14 } } },
    MuiTooltip: { defaultProps: { arrow: true } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minHeight: 44 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600, whiteSpace: 'nowrap' } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 600, fontSize: 17 } } },
    MuiMenu: { defaultProps: { slotProps: { paper: { elevation: 8 } } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: 'var(--mui-palette-background-paper)' } } },
    MuiCssBaseline: {
      styleOverrides: {
        // IDs and shortcuts use the same sans-serif font as the rest of the UI.
        'code, kbd, samp, pre': { fontFamily: 'inherit' },
      },
    },
  },
})
