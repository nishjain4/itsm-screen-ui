import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import Tooltip from '@mui/material/Tooltip'
import type { ReactNode } from 'react'
import { DashboardIcon, KeyboardIcon, TuneIcon } from '../../components/icons'
import { BrandMark } from '../../components/ui'
import { isOpen } from '../../lib/utils'
import { useApp, useDirtyCount } from '../../state/AppState'
import type { Page } from '../../types'

function NavItem({ page, label, icon, collapsed, badge, onNavigate }: { page: Page; label: string; icon: ReactNode; collapsed: boolean; badge?: ReactNode; onNavigate: () => void }) {
  const app = useApp()
  const selected = app.page === page
  return (
    <Tooltip title={collapsed ? label : ''} placement="right">
      <ListItemButton
        selected={selected}
        aria-current={selected ? 'page' : undefined}
        onClick={() => {
          app.goTo(page)
          onNavigate()
        }}
        sx={{ borderRadius: 2, minHeight: 38, px: collapsed ? 0 : 1.25, justifyContent: collapsed ? 'center' : 'flex-start', position: 'relative', '&.Mui-selected': { color: 'primary.main', fontWeight: 600 } }}
      >
        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, color: 'inherit' }}>{icon}</ListItemIcon>
        {!collapsed && <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: 'inherit' } } }} />}
        {badge}
      </ListItemButton>
    </Tooltip>
  )
}

const label = (text: string, collapsed: boolean) =>
  collapsed ? <div className="mx-2 my-2 border-t border-line" /> : (
    <ListSubheader disableSticky sx={{ bgcolor: 'transparent', lineHeight: '30px', fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', px: 1.25, mt: 1 }}>
      {text}
    </ListSubheader>
  )

const HEALTH: [string, 'ok' | 'warn', string][] = [
  ['Teams bot', 'ok', 'Operational'],
  ['Microsoft Graph', 'ok', 'Operational'],
  ['Zoom bridge', 'warn', 'Degraded'],
]

export function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const app = useApp()
  const dirty = useDirtyCount()
  const openCount = app.incidents.filter(isOpen).length
  const admin = app.role === 'admin'
  return (
    <nav aria-label="Primary" className={`flex h-full flex-col gap-1.5 ${collapsed ? 'px-2.5' : 'px-3'} py-3`}>
      <div className={`mb-1 flex h-10 items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-1.5'}`}>
        <BrandMark />
        {!collapsed && <span className="text-base font-bold tracking-tight">OpsPilot</span>}
      </div>

      <div className={`mb-2 flex items-center gap-2.5 rounded-xl border border-line subtle-bg ${collapsed ? 'justify-center p-1.5' : 'p-2'}`}>
        <span className={`grid size-8 flex-none place-items-center rounded-lg text-[11px] font-bold ${admin ? 'tint-secondary' : 'tint-primary'}`}>{app.profile?.initials}</span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-tight">
            <strong className="truncate text-[13px]">{app.profile?.ws}</strong>
            <small className="text-[11.5px] text-muted">{app.profile?.role}</small>
          </span>
        )}
      </div>

      <List disablePadding dense sx={{ display: 'grid', gap: 0.25 }}>
        {admin ? (
          <>
            {label('Administer', collapsed)}
            <NavItem
              page="control"
              label="Control room"
              icon={<TuneIcon fontSize="small" />}
              collapsed={collapsed}
              onNavigate={onNavigate}
              badge={dirty > 0 && <span title="Unsaved policy changes" className={`size-2 rounded-full bg-st-monitoring ${collapsed ? 'absolute top-1.5 right-2' : 'ml-auto'}`} />}
            />
          </>
        ) : (
          <>
            {label('Operate', collapsed)}
            <NavItem
              page="console"
              label="Incident console"
              icon={<DashboardIcon fontSize="small" />}
              collapsed={collapsed}
              onNavigate={onNavigate}
              badge={!collapsed && <Chip size="small" label={openCount} aria-label={`${openCount} open incidents`} className="tint-active tabular-nums" sx={{ height: 20, minWidth: 24 }} />}
            />
          </>
        )}
      </List>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-2.5">
        {!collapsed && (
          <div aria-label="Service health" className="grid gap-1.5 pb-2">
            <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold tracking-[.07em] text-muted uppercase">Service health</p>
            {HEALTH.map(([name, st, text]) => (
              <div key={name} className="flex items-center gap-2.5 px-2.5 text-[12.5px]">
                <span className={`size-2 rounded-full ${st === 'ok' ? 'bg-st-resolved' : 'bg-st-monitoring'}`} />
                {name}
                <span className={`ml-auto text-[11px] font-medium ${st === 'ok' ? 'text-st-resolved' : 'text-st-monitoring'}`}>{text}</span>
              </div>
            ))}
          </div>
        )}
        <Tooltip title={collapsed ? 'Keyboard shortcuts' : ''} placement="right">
          <ListItemButton onClick={() => app.setShortcutsOpen(true)} sx={{ borderRadius: 2, minHeight: 38, px: collapsed ? 0 : 1.25, justifyContent: collapsed ? 'center' : 'flex-start', flexGrow: 0 }}>
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34 }}>
              <KeyboardIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText primary="Keyboard shortcuts" slotProps={{ primary: { sx: { fontSize: 13.5 } } }} />
                <kbd>?</kbd>
              </>
            )}
          </ListItemButton>
        </Tooltip>
      </div>
    </nav>
  )
}
