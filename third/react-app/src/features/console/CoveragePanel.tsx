import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import ListItemButton from '@mui/material/ListItemButton'
import { GroupsIcon } from '../../components/icons'
import { useApp } from '../../state/AppState'

export function CoveragePanel() {
  const app = useApp()
  const total = app.groups.reduce((s, g) => s + g.channels.length, 0)
  const enabled = app.groups.reduce((s, g) => s + g.channels.filter(c => c.enabled).length, 0)
  const pct = total ? Math.round((enabled / total) * 100) : 0

  return (
    <Card component="aside" aria-labelledby="coverage-title" className="p-4 lg:sticky lg:top-[72px]">
      <div className="mb-3 flex items-start justify-between gap-2.5">
        <div>
          <h3 id="coverage-title" className="text-sm font-semibold">Monitoring coverage</h3>
          <p className="text-xs text-muted">Teams groups &amp; channels</p>
        </div>
        <Chip size="small" label={`${enabled}/${total}`} className="tabular-nums" />
      </div>
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label="Channels monitored"
        aria-valuetext={`${enabled} of ${total} channels monitored`}
        sx={{ height: 6, borderRadius: 99, mb: 1.25 }}
      />
      <div className="mb-1.5 flex gap-3.5 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-st-resolved" />Added to bot</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-line" />Not added</span>
      </div>
      {app.groups.map(g => (
        <div key={g.id} className="border-t border-line pt-2.5 pb-2">
          <div className="mb-1 flex items-center justify-between gap-2 text-[13px] font-semibold">
            <span className="flex items-center gap-2">
              <GroupsIcon sx={{ fontSize: 16 }} className="text-muted" />
              {g.name}
            </span>
            <Chip size="small" label={`${g.channels.filter(c => c.enabled).length}/${g.channels.length}`} className="tabular-nums" />
          </div>
          {g.channels.map(c => {
            const pressed = app.filters.scope === 'channel:' + c.name
            return (
              <ListItemButton
                key={c.name}
                selected={pressed}
                aria-pressed={pressed}
                title={`Filter incidents in # ${c.name}`}
                onClick={() => app.filterByChannel(c.name)}
                sx={{ borderRadius: 1.5, minHeight: 32, py: 0, px: 1, justifyContent: 'space-between', fontSize: 12.5 }}
              >
                <span>
                  <span className="text-muted">#</span> {c.name}
                </span>
                <Chip size="small" variant="outlined" label={c.enabled ? 'Added' : 'Not added'} color={c.enabled ? 'success' : 'default'} className={c.enabled ? 'tint-resolved' : ''} sx={{ height: 20, fontSize: 11 }} />
              </ListItemButton>
            )
          })}
        </div>
      ))}
      <p className="text-xs text-muted">Select a channel to filter the board. Admins can change coverage in the Control room.</p>
    </Card>
  )
}
