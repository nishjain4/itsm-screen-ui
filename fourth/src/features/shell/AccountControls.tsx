import type { SvgIconComponent } from '@mui/icons-material'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import { useColorScheme } from '@mui/material/styles'
import { useState } from 'react'
import { BellIcon, CheckIcon, DarkIcon, EyeIcon, LightIcon, LogoutIcon, ShieldIcon, SwitchIcon, VideoIcon } from '../../components/icons'
import { formatDate, initials, statusTone, toneClass } from '../../lib/utils'
import { useApp } from '../../state/AppState'

// Menus open to the right of the bottom-left rail.
const ANCHOR = { vertical: 'bottom', horizontal: 'right' } as const
const TRANSFORM = { vertical: 'bottom', horizontal: 'left' } as const
const railBtn = { width: 44, height: 44, borderRadius: 2 }

export function Notifications() {
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
      <Tooltip title="Notifications" placement="right">
        <IconButton sx={railBtn} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-haspopup="true" aria-expanded={!!anchor} onClick={e => setAnchor(e.currentTarget)}>
          <Badge color="error" badgeContent={unread} max={9}>
            <BellIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={ANCHOR}
        transformOrigin={TRANSFORM}
        slotProps={{ paper: { sx: { width: 380, ml: 1 }, role: 'region', 'aria-label': 'Notifications' } }}
      >
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <strong className="text-sm">Notifications</strong>
          <Button size="small" onClick={() => app.markRead(items.map(n => n.i.id))} disabled={!unread}>
            Mark all as read
          </Button>
        </div>
        <List disablePadding sx={{ maxHeight: 420, overflow: 'auto' }}>
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
                  <strong className="flex items-center gap-2 text-[14px] font-semibold">
                    {title}
                    {!read && <span className="size-1.5 rounded-full bg-primary" aria-label="unread" />}
                  </strong>
                  <span className="block text-[13.5px] text-muted">{i.title}</span>
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

export function ThemeMenu() {
  const { mode, setMode } = useColorScheme()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const opts: ['light' | 'dark', string, SvgIconComponent][] = [
    ['light', 'Light', LightIcon],
    ['dark', 'Dark', DarkIcon],
  ]
  return (
    <>
      <Tooltip title="Theme" placement="right">
        <IconButton sx={railBtn} aria-label="Change theme" aria-haspopup="menu" aria-expanded={!!anchor} onClick={e => setAnchor(e.currentTarget)}>
          {mode === 'dark' ? <DarkIcon /> : <LightIcon />}
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={ANCHOR} transformOrigin={TRANSFORM} slotProps={{ paper: { sx: { ml: 1 } } }}>
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

export function UserMenu({ onLeave }: { onLeave: (signOut: boolean) => void }) {
  const app = useApp()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const p = app.profile
  if (!p) return null
  const close = () => setAnchor(null)
  return (
    <>
      <Tooltip title={`${p.name} · ${p.role}`} placement="right">
        <ButtonBase aria-haspopup="menu" aria-expanded={!!anchor} aria-label={`Account: ${p.name}`} onClick={e => setAnchor(e.currentTarget)} sx={{ borderRadius: 99 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 600 }} className={app.role === 'admin' ? 'bg-linear-to-br! from-violet-600 to-pink-600' : 'bg-linear-to-br! from-indigo-500 to-violet-500'}>
            {p.initials || initials(p.name)}
          </Avatar>
          <span aria-hidden className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-paper bg-st-resolved" />
        </ButtonBase>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close} anchorOrigin={ANCHOR} transformOrigin={TRANSFORM} slotProps={{ paper: { sx: { minWidth: 260, ml: 1 } } }}>
        <div className="px-4 py-2 leading-snug">
          <strong className="block text-[14px]">{p.name}</strong>
          <small className="block text-[13px] text-muted">{p.role}</small>
          <small className="text-[13px] text-muted">{p.email}</small>
        </div>
        <Divider />
        <MenuItem onClick={() => { close(); onLeave(false) }}>
          <ListItemIcon><SwitchIcon fontSize="small" /></ListItemIcon>
          Switch workspace
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
