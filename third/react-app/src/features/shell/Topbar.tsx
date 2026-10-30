import type { SvgIconComponent } from '@mui/icons-material'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useColorScheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { BackIcon, BellIcon, CheckIcon, DarkIcon, EyeIcon, ExpandMoreIcon, KeyboardIcon, LightIcon, LogoutIcon, SearchIcon, ShieldIcon, SidebarIcon, SwitchIcon, VideoIcon } from '../../components/icons'
import { formatDate, formatDateTime, initials, relTime, statusTone, toneClass } from '../../lib/utils'
import { useApp } from '../../state/AppState'

const PAGE_TITLES = { console: 'Incident console', control: 'Control room' } as const
export const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'

function useTick(ms: number) {
  const [, setT] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setT(t => t + 1), ms)
    return () => window.clearInterval(id)
  }, [ms])
}

function Notifications() {
  const app = useApp()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const items = app.incidents
    .filter(i => i.status !== 'Resolved')
    .map(i => ({
      i,
      title: i.status === 'Waiting for IC' ? `${i.id} needs an Incident Commander` : i.zoom === 'live' ? `Live bridge open for ${i.id}` : `${i.id} is ${i.status.toLowerCase()}`,
      icon: i.status === 'Waiting for IC' ? <ShieldIcon fontSize="small" /> : i.zoom === 'live' ? <VideoIcon fontSize="small" /> : <EyeIcon fontSize="small" />,
    }))
  const unread = items.filter(n => !app.notifRead.has(n.i.id)).length
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-haspopup="true" aria-expanded={!!anchor} onClick={e => setAnchor(e.currentTarget)}>
          <Badge color="error" variant="dot" invisible={!unread}>
            <BellIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, mt: 0.75 }, role: 'region', 'aria-label': 'Notifications' } }}
      >
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <strong className="text-sm">Notifications</strong>
          <Button size="small" onClick={() => app.markRead(items.map(n => n.i.id))} disabled={!unread}>
            Mark all as read
          </Button>
        </div>
        <List disablePadding sx={{ maxHeight: 380, overflow: 'auto' }}>
          {items.map(({ i, title, icon }) => {
            const read = app.notifRead.has(i.id)
            return (
              <ListItemButton
                key={i.id}
                divider
                onClick={() => {
                  app.markRead([i.id])
                  setAnchor(null)
                  app.setOpenIncidentId(i.id)
                }}
                sx={{ alignItems: 'flex-start', gap: 1.5, py: 1.5, bgcolor: read ? undefined : 'action.selected' }}
              >
                <span className={`mt-0.5 grid size-8 flex-none place-items-center rounded-lg ${toneClass[statusTone(i.status)]}`}>{icon}</span>
                <span className="min-w-0">
                  <strong className="flex items-center gap-2 text-[13px] font-semibold">
                    {title}
                    {!read && <span className="size-1.5 rounded-full bg-primary" aria-label="unread" />}
                  </strong>
                  <span className="block text-[12.5px] text-muted">{i.title}</span>
                  <small className="text-xs text-muted">{formatDate(i.date)}</small>
                </span>
              </ListItemButton>
            )
          })}
          {!items.length && <p className="p-8 text-center text-sm text-muted">You're all caught up.</p>}
        </List>
      </Popover>
    </>
  )
}

function ThemeMenu() {
  const { mode, setMode } = useColorScheme()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const dark = mode === 'dark'
  const opts: ['light' | 'dark', string, SvgIconComponent][] = [
    ['light', 'Light', LightIcon],
    ['dark', 'Dark', DarkIcon],
  ]
  return (
    <>
      <Tooltip title="Theme">
        <IconButton aria-label="Change theme" aria-haspopup="menu" aria-expanded={!!anchor} onClick={e => setAnchor(e.currentTarget)}>
          {dark ? <DarkIcon fontSize="small" /> : <LightIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {opts.map(([value, text, Icon]) => (
          <MenuItem
            key={value}
            selected={mode === value}
            role="menuitemradio"
            aria-checked={mode === value}
            onClick={() => {
              setMode(value)
              setAnchor(null)
            }}
            sx={{ minWidth: 180 }}
          >
            <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
            <ListItemText>{text}</ListItemText>
            {mode === value && <CheckIcon fontSize="small" color="primary" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

function UserMenu({ onLeave }: { onLeave: (signOut: boolean) => void }) {
  const app = useApp()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const p = app.profile
  if (!p) return null
  const close = () => setAnchor(null)
  return (
    <>
      <ButtonBase
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-label={`Account: ${p.name}`}
        onClick={e => setAnchor(e.currentTarget)}
        className="h-10 gap-2.5 rounded-xl! py-0 pr-2 pl-1 hover:bg-hover"
      >
        <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 600 }} className={app.role === 'admin' ? 'bg-linear-to-br! from-violet-600 to-pink-600' : 'bg-linear-to-br! from-blue-600 to-violet-500'}>
          {p.initials || initials(p.name)}
        </Avatar>
        <span className="hidden flex-col text-left leading-tight whitespace-nowrap xl:flex">
          <strong className="text-[13px]">{p.name}</strong>
          <small className="text-[11px] text-muted">{p.role}</small>
        </span>
        <ExpandMoreIcon sx={{ fontSize: 16 }} className="text-muted" />
      </ButtonBase>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { minWidth: 240 } } }}>
        <div className="px-4 py-2 leading-snug">
          <strong className="block text-[13px]">{p.name}</strong>
          <small className="text-xs text-muted">{p.email}</small>
        </div>
        <Divider />
        <MenuItem onClick={() => { close(); onLeave(false) }}>
          <ListItemIcon><SwitchIcon fontSize="small" /></ListItemIcon>
          Switch workspace
        </MenuItem>
        <MenuItem onClick={() => { close(); app.setShortcutsOpen(true) }}>
          <ListItemIcon><KeyboardIcon fontSize="small" /></ListItemIcon>
          Keyboard shortcuts
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { close(); onLeave(true) }} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit' }}><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  )
}

export function Topbar({ onToggleNav, navExpanded, onLeave }: { onToggleNav: () => void; navExpanded: boolean; onLeave: (signOut: boolean) => void }) {
  const app = useApp()
  useTick(30_000)
  return (
    <AppBar position="sticky" color="inherit" elevation={0} className="border-b border-line bg-canvas/80! backdrop-blur-md backdrop-saturate-150">
      <Toolbar variant="dense" sx={{ minHeight: 56, gap: 1.25, px: { xs: 1, sm: 1.5 } }}>
        <Tooltip title="Back to workspace selection">
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<BackIcon />}
            onClick={() => onLeave(false)}
            aria-label="Back to workspace selection"
            sx={{ minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 } } }}
          >
            <span className="max-sm:hidden">Back</span>
          </Button>
        </Tooltip>
        <Tooltip title="Toggle sidebar ([)">
          <IconButton aria-label="Toggle sidebar" aria-controls="app-sidebar" aria-expanded={navExpanded} onClick={onToggleNav}>
            <SidebarIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ my: 1.75, display: { xs: 'none', md: 'block' } }} />
        <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: 13, '& .MuiBreadcrumbs-li:not(:last-child)': { display: { xs: 'none', md: 'list-item' } }, '& .MuiBreadcrumbs-separator': { display: { xs: 'none', md: 'flex' } } }}>
          <span>OpsPilot</span>
          <span>{app.profile?.ws}</span>
          <Typography aria-current="page" sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            {PAGE_TITLES[app.page]}
          </Typography>
        </Breadcrumbs>

        <ButtonBase
          onClick={() => app.setPaletteOpen(true)}
          aria-label={`Search and run commands (${MOD_KEY}+K)`}
          className="ml-auto! h-9 gap-2 rounded-lg! border border-line bg-paper px-3! text-[13px] text-muted shadow-xs transition hover:border-muted/50 md:w-[clamp(220px,28vw,360px)] md:justify-start!"
        >
          <SearchIcon sx={{ fontSize: 18 }} />
          <span className="hidden flex-1 truncate text-left md:inline">Search incidents, pages, actions…</span>
          <kbd className="hidden md:inline-block">{MOD_KEY} K</kbd>
        </ButtonBase>

        <div className="flex items-center gap-1">
          <Tooltip title={`Last refresh: ${formatDateTime(app.lastSync)}`}>
            <span className="hidden items-center gap-2 px-2 text-xs whitespace-nowrap text-muted 2xl:flex">
              <span className="size-2 animate-pulse-soft rounded-full bg-st-resolved" />
              Synced {relTime(app.lastSync)}
            </span>
          </Tooltip>
          <Chip size="small" variant="outlined" color="warning" label="Preview" title="Mock data — no live connection" className="tint-monitoring mr-1 hidden! lg:inline-flex!" />
          <Notifications />
          <ThemeMenu />
          <UserMenu onLeave={onLeave} />
        </div>
      </Toolbar>
    </AppBar>
  )
}
