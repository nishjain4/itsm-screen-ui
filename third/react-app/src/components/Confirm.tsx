import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertIcon } from './icons'

export interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  tone?: 'warning' | 'danger'
}
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>
const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>(o => {
    resolver.current?.(false)
    setOpts(o)
    setOpen(true)
    return new Promise<boolean>(resolve => {
      resolver.current = resolve
    })
  }, [])

  const close = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOpen(false)
  }

  const danger = opts?.tone === 'danger'
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onClose={() => close(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        slotProps={{ paper: { role: 'alertdialog' } }}
      >
        <DialogTitle id="confirm-title">{opts?.title}</DialogTitle>
        <DialogContent>
          <div className="flex items-start gap-3.5">
            <span className={`grid size-10 flex-none place-items-center rounded-full ${danger ? 'tint-active' : 'tint-monitoring'}`}>
              <AlertIcon fontSize="small" />
            </span>
            <div id="confirm-desc" className="pt-0.5 text-[13.5px] text-muted">
              {opts?.message}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant="contained" color={danger ? 'error' : 'primary'} onClick={() => close(true)} autoFocus>
            {opts?.confirmLabel ?? 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
