import Collapse from '@mui/material/Collapse'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'
import { DashboardIcon, ExpandMoreIcon } from '../../components/icons'
import { initials, isOpen, openIncidentsFor, teamTint } from '../../lib/utils'
import { useApp } from '../../state/AppState'

const countBadge = (n: number, label: string) =>
  n > 0 && (
    <span aria-label={label} className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-st-active px-1.5 text-[11px] font-semibold text-white tabular-nums">
      {n}
    </span>
  )

export function TeamsPane({ onNavigate }: { onNavigate: () => void }) {
  const app = useApp()
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const openTotal = app.incidents.filter(isOpen).length

  const toggle = (id: string) =>
    setCollapsed(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const select = (ref: { team: string; channel: string } | null) => {
    app.goTo('console')
    app.openChannel(ref)
    onNavigate()
  }

  return (
    <nav aria-label="Teams and channels" className="flex h-full flex-col">
      <div className="flex h-14 flex-none items-center gap-2 border-b border-line px-4">
        <h2 className="text-[19px] font-bold tracking-tight">Teams</h2>
        <span className="ml-auto text-xs text-muted">{openTotal} open</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        <ListItemButton
          selected={!app.channel}
          aria-current={!app.channel ? 'page' : undefined}
          onClick={() => select(null)}
          sx={{ borderRadius: 1.5, minHeight: 40, gap: 1.25, px: 1.25, mb: 1 }}
        >
          <span className="grid size-7 flex-none place-items-center rounded-md tint-primary">
            <DashboardIcon sx={{ fontSize: 17 }} />
          </span>
          <span className="truncate text-[15px] font-semibold">All incidents</span>
          {countBadge(openTotal, `${openTotal} open incidents`)}
        </ListItemButton>

        <p className="px-2 pt-1 pb-1.5 text-[12px] font-semibold tracking-[.07em] text-muted uppercase">Your teams</p>
        <List disablePadding dense>
          {app.groups.map((g, gi) => {
            const hasSelected = app.channel?.team === g.name
            const expanded = hasSelected || !collapsed.has(g.id)
            const teamOpen = app.incidents.filter(i => i.team === g.name && isOpen(i)).length
            return (
              <li key={g.id}>
                <ListItemButton
                  aria-expanded={expanded}
                  aria-controls={`team-${g.id}`}
                  onClick={() => toggle(g.id)}
                  sx={{ borderRadius: 1.5, minHeight: 40, gap: 1, px: 0.75 }}
                >
                  <ExpandMoreIcon sx={{ fontSize: 18, transition: 'transform .15s', transform: expanded ? 'none' : 'rotate(-90deg)' }} className="text-muted" />
                  <span aria-hidden className={`grid size-7 flex-none place-items-center rounded-md text-[11px] font-bold text-white ${teamTint(gi)}`}>
                    {initials(g.name)}
                  </span>
                  <span className="truncate text-[15px] font-semibold">{g.name}</span>
                  {!expanded && countBadge(teamOpen, `${teamOpen} open incidents in ${g.name}`)}
                </ListItemButton>
                <Collapse in={expanded} id={`team-${g.id}`}>
                  <List disablePadding dense aria-label={`${g.name} channels`}>
                    {g.channels.map(c => {
                      const selected = hasSelected && app.channel?.channel === c.name
                      const open = openIncidentsFor(app.incidents, g.name, c.name).length
                      return (
                        <li key={c.name}>
                          <Tooltip title={c.enabled ? '' : 'Not added to the bot — no new incidents are tracked'} placement="right">
                            <ListItemButton
                              selected={selected}
                              aria-current={selected ? 'page' : undefined}
                              onClick={() => select({ team: g.name, channel: c.name })}
                              sx={{
                                borderRadius: 1.5,
                                minHeight: 34,
                                pl: 6.75,
                                pr: 1.25,
                                gap: 1,
                                '&.Mui-selected': { fontWeight: 600 },
                              }}
                            >
                              <span className={`truncate text-[14.5px] ${open ? 'font-semibold' : ''} ${c.enabled ? '' : 'text-muted'}`}>
                                <span className="text-muted">#</span> {c.name}
                              </span>
                              {!c.enabled && <span aria-label="Not monitored" className="size-1.5 flex-none rounded-full bg-line" />}
                              {countBadge(open, `${open} open incidents`)}
                            </ListItemButton>
                          </Tooltip>
                        </li>
                      )
                    })}
                  </List>
                </Collapse>
              </li>
            )
          })}
        </List>
      </div>

      
    </nav>
  )
}
