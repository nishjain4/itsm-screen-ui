import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Drawer from '@mui/material/Drawer'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { useState } from 'react'
import { AddIcon, CheckIcon, GroupsIcon, TuneIcon } from '../../components/icons'
import { SectionTitle } from '../../components/ui'
import { useApp } from '../../state/AppState'

function ChannelSettingsPanel({
  groupId,
  groupName,
  channel,
  open,
  onClose,
}: {
  groupId: string
  groupName: string
  channel: { name: string; enabled: boolean; interval: string }
  open: boolean
  onClose: () => void
}) {
  const app = useApp()

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 420 }, borderLeft: '1px solid var(--color-line)' } } }}>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold tracking-[.08em] text-muted uppercase">Channel settings</div>
            <h3 className="mt-1 text-[20px] font-semibold tracking-tight"># {channel.name}</h3>
          </div>
          <Chip
            size="small"
            variant="outlined"
            color={channel.enabled ? 'success' : 'default'}
            label={channel.enabled ? 'Monitoring on' : 'Monitoring off'}
            className={channel.enabled ? 'tint-resolved' : ''}
          />
        </header>

        <div className="flex-1 space-y-4 overflow-auto px-5 py-4">
          <div className="rounded-xl border border-line bg-hover p-3.5">
            <div className="text-[12px] font-semibold tracking-[.08em] text-muted uppercase">Team</div>
            <div className="mt-1 text-base font-medium">{groupName}</div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
              <span className="text-sm text-muted">Monitoring</span>
              <strong className="text-sm font-medium">{channel.enabled ? 'Enabled' : 'Disabled'}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
              <span className="text-sm text-muted">Summary interval</span>
              <strong className="text-sm font-medium">{channel.interval} min</strong>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="contained" onClick={() => { app.jumpToPolicies(groupId); onClose() }}>
              Open channel settings
            </Button>
            <Button variant="outlined" color="inherit" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export function GroupsTab({ onManage }: { onManage: (groupId: string) => void }) {
  const app = useApp()
  const [selected, setSelected] = useState<{ groupId: string; channel: string } | null>(null)

  return (
    <div className="flex flex-1 flex-col">
      <SectionTitle title="Teams connected to OpsPilot" description="Only groups where the bot is installed and has access appear here." />

      <TableContainer className="rounded-xl border border-line bg-paper">
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'action.hover', color: 'text.secondary', fontSize: 13.5 } }}>
              <TableCell>Team</TableCell>
              <TableCell>Channels</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {app.groups.map(g => (
              <TableRow key={g.id} hover sx={{ '& td': { py: 2 } }}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="tint-primary grid size-9 place-items-center rounded-lg">
                      <GroupsIcon fontSize="small" />
                    </span>
                    <div>
                      <div className="font-medium text-[14px]">{g.name}</div>
                      <small className="text-xs text-muted">Team ID: {g.teamId}</small>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {g.channels.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelected({ groupId: g.id, channel: c.name })}
                        className={`rounded-full border px-2 py-1 text-[12px] transition-colors ${
                          c.enabled ? 'border-st-resolved bg-st-resolved/10 text-st-resolved' : 'border-line bg-hover text-muted'
                        }`}
                      >
                        # {c.name}
                      </button>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" color="success" icon={<CheckIcon />} label="Bot installed" className="tint-resolved" />
                </TableCell>
                <TableCell align="right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={() => onManage(g.id)} size="small">
                      Manage
                    </Button>
                    <Button variant="outlined" color="inherit" startIcon={<TuneIcon />} onClick={() => app.jumpToPolicies(g.id)} size="small">
                      Settings
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selected && (() => {
        const g = app.groups.find(x => x.id === selected.groupId)
        const c = g?.channels.find(x => x.name === selected.channel)
        if (!g || !c) return null
        return (
          <ChannelSettingsPanel
            groupId={g.id}
            groupName={g.name}
            channel={c}
            open={!!selected}
            onClose={() => setSelected(null)}
          />
        )
      })()}
    </div>
  )
}
