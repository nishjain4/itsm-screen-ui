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
        primary: { main: '#5b5fc7', dark: '#4f52b2' },
        secondary: { main: '#7c3aed' },
        error: { main: '#c4314b' },
        warning: { main: '#b45309' },
        success: { main: '#237b4b' },
        info: { main: '#0f6cbd' },
        background: { default: '#f5f5f5', paper: '#ffffff' },
        text: { primary: '#242424', secondary: '#616161' },
        divider: '#e0e0e0',
        action: { hover: 'rgba(36, 36, 36, 0.05)', selected: 'rgba(91, 95, 199, 0.10)' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#7f85f5', dark: '#9299f7' },
        secondary: { main: '#a78bfa' },
        error: { main: '#f1707b' },
        warning: { main: '#fbbf24' },
        success: { main: '#54b054' },
        info: { main: '#479ef5' },
        background: { default: '#1f1f1f', paper: '#292929' },
        text: { primary: '#ffffff', secondary: '#adadad' },
        divider: '#3d3d3d',
        action: { hover: 'rgba(255, 255, 255, 0.06)', selected: 'rgba(127, 133, 245, 0.18)' },
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
        sizeSmall: { height: 24, fontSize: 12.5 },
        outlined: ({ ownerState }) => (ownerState.color === 'default' || !ownerState.color ? { borderColor: 'var(--mui-palette-divider)' } : {}),
      },
    },
    MuiInputBase: { styleOverrides: { root: { fontSize: 15 } } },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 15 } } },
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
