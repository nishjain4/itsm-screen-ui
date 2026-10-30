import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Grow from '@mui/material/Grow'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'
export interface ToastOptions {
  variant?: ToastVariant
  title?: string
}
interface ToastItem extends Required<Pick<ToastOptions, 'variant'>> {
  id: number
  message: string
  title?: string
}

type ToastFn = (message: string, opts?: ToastOptions) => void
const ToastContext = createContext<ToastFn | null>(null)

const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setItems(xs => xs.filter(x => x.id !== id))
  }, [])

  const schedule = useCallback(
    (id: number, variant: ToastVariant) => {
      timers.current.set(id, window.setTimeout(() => dismiss(id), variant === 'error' ? 7000 : 4500))
    },
    [dismiss],
  )

  const toast = useCallback<ToastFn>(
    (message, { variant = 'info', title } = {}) => {
      const id = ++seq.current
      setItems(xs => [...xs.slice(-(MAX_VISIBLE - 1)), { id, message, title, variant }])
      schedule(id, variant)
    },
    [schedule],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Bottom-left on desktop so toasts never cover dialog/sheet action buttons; top on mobile. */}
      <div
        className="pointer-events-none fixed bottom-5 left-5 z-[1500] flex w-[min(400px,calc(100vw-32px))] flex-col gap-2.5 max-sm:top-3 max-sm:right-4 max-sm:bottom-auto max-sm:left-4 max-sm:w-auto"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map(t => (
          <Grow in key={t.id}>
            <Alert
              severity={t.variant}
              variant="outlined"
              role={t.variant === 'error' ? 'alert' : 'status'}
              onClose={() => dismiss(t.id)}
              onMouseEnter={() => window.clearTimeout(timers.current.get(t.id))}
              onMouseLeave={() => schedule(t.id, t.variant)}
              slotProps={{ closeButton: { 'aria-label': 'Dismiss notification' } }}
              className="pointer-events-auto shadow-xl"
              sx={{ bgcolor: 'background.paper', color: 'text.primary', borderColor: 'divider', alignItems: 'flex-start' }}
            >
              {t.title ? (
                <>
                  <AlertTitle sx={{ fontWeight: 600, mb: 0 }}>{t.title}</AlertTitle>
                  <span className="text-muted">{t.message}</span>
                </>
              ) : (
                <span className="font-medium">{t.message}</span>
              )}
            </Alert>
          </Grow>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return useMemo(() => ctx, [ctx])
}
