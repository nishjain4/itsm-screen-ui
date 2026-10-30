import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useState } from 'react'
import { BackIcon, SidebarIcon } from '../../components/icons'
import { BrandMark } from '../../components/ui'
import { formatDateTime, relTime } from '../../lib/utils'
import { useApp } from '../../state/AppState'

function useTick(ms: number) {
  const [, setT] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setT(t => t + 1), ms)
    return () => window.clearInterval(id)
  }, [ms])
}

export function Topbar({ onToggleNav, navExpanded, showNavToggle, onLeave }: { onToggleNav: () => void; navExpanded: boolean; showNavToggle: boolean; onLeave: (signOut: boolean) => void }) {
  const app = useApp()
  useTick(30_000)
  return (
    <AppBar position="static" color="inherit" elevation={0} className="flex-none border-b border-line chrome-bg">
      <Toolbar variant="dense" sx={{ minHeight: 52, gap: 1, px: { xs: 1, sm: 1.25 } }}>
        <Tooltip title="Back to workspace selection">
          <IconButton aria-label="Back to workspace selection" onClick={() => onLeave(false)}>
            <BackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {showNavToggle && (
          <Tooltip title="Show or hide teams">
            <IconButton aria-label="Toggle teams pane" aria-controls="teams-pane" aria-expanded={navExpanded} onClick={onToggleNav}>
              <SidebarIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <span className="flex min-w-0 items-center gap-2">
          <BrandMark size={26} />
          <span className="truncate text-[15px] font-semibold max-sm:hidden">OpsPilot</span>
          <span className="truncate text-xs text-muted max-lg:hidden">· {app.profile?.ws}</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip title={`Last refresh: ${formatDateTime(app.lastSync)}`}>
            <span className="hidden items-center gap-2 px-2 text-xs whitespace-nowrap text-muted md:flex">
              <span className="size-2 animate-pulse-soft rounded-full bg-st-resolved" />
              Synced {relTime(app.lastSync)}
            </span>
          </Tooltip>
        </div>
      </Toolbar>
    </AppBar>
  )
}
