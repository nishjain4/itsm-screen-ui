import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import { CloseIcon } from '../../components/icons'
import { useApp } from '../../state/AppState'
import type { Role } from '../../types'
import { MOD_KEY } from './Topbar'

const ROWS: [string[], string, Role?][] = [
  [[MOD_KEY, 'K'], 'Open command palette'],
  [['/'], 'Focus incident search', 'user'],
  [['['], 'Collapse or expand the sidebar'],
  [['?'], 'Show keyboard shortcuts'],
  [['Alt', '↑/↓'], 'Reorder a focused workflow step', 'admin'],
  [['Esc'], 'Close dialog or menu'],
]

export function ShortcutsDialog() {
  const app = useApp()
  const close = () => app.setShortcutsOpen(false)
  const rows = ROWS.filter(([, , role]) => !role || role === app.role)
  return (
    <Dialog open={app.shortcutsOpen} onClose={close} fullWidth maxWidth="xs" aria-labelledby="shortcuts-title">
      <DialogTitle id="shortcuts-title" className="flex items-start justify-between">
        <span>
          Keyboard shortcuts
          <span className="block text-[13px] font-normal text-muted">Work faster across OpsPilot.</span>
        </span>
        <IconButton aria-label="Close dialog" onClick={close} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {rows.map(([keys, label]) => (
          <div key={label} className="flex items-center justify-between border-b border-line py-2.5 text-[13px] last:border-0">
            <span>{label}</span>
            <span className="flex gap-1">
              {keys.map(k => (
                <kbd key={k}>{k}</kbd>
              ))}
            </span>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  )
}
