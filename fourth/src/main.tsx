import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ConfirmProvider } from './components/Confirm'
import { ToastProvider } from './components/Toast'
import './index.css'
import { AppProvider } from './state/AppState'
import { theme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* enableCssLayer puts MUI styles in `@layer mui` so Tailwind utilities can override them. */}
    <StyledEngineProvider enableCssLayer>
      {/* Emitted first by Emotion so the layer order is fixed before any other style is parsed. */}
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme} defaultMode="light">
        <CssBaseline enableColorScheme />
        <ToastProvider>
          <ConfirmProvider>
            <AppProvider>
              <App />
            </AppProvider>
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
)
