import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import ListSubheader from '@mui/material/ListSubheader'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { Fragment, useState } from 'react'
import { useConfirm } from '../../components/Confirm'
import { AddIcon, ExternalIcon, EyeIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { StatusChip, useDemoLink } from '../../components/ui'
import { openIncidentsFor, plural, validateChannelName } from '../../lib/utils'
import { useApp } from '../../state/AppState'

const titleWithDesc = (id: string, title: string, desc: string) => (
  <DialogTitle id={id}>
    {title}
    <span className="block text-[13px] font-normal text-muted">{desc}</span>
  </DialogTitle>
)

export function ChannelManagerDialog({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const app = useApp()
  const confirm = useConfirm()
  const toast = useToast()
  const g = app.groups.find(x => x.id === groupId)
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => Object.fromEntries((g?.channels ?? []).map(c => [c.name, c.enabled])))
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  if (!g) return null

  const save = async () => {
    const clean = name.trim().replace(/^#/, '')
    const err = clean ? validateChannelName(clean, g) : ''
    setError(err)
    if (err) {
      document.getElementById('new-channel-name')?.focus()
      return
    }
    const disabling = g.channels.filter(c => c.enabled && !toggles[c.name])
    if (disabling.length) {
      const ok = await confirm({
        title: 'Stop monitoring channels?',
        message: (
          <>
            OpsPilot will stop monitoring{' '}
            {disabling.map((c, i) => (
              <Fragment key={c.name}>
                {i > 0 && ', '}
                <b>#{c.name}</b>
              </Fragment>
            ))}
            . Automations will pause and unsaved policy edits for {disabling.length === 1 ? 'this channel' : 'these channels'} are dropped. The Teams{' '}
            {disabling.length === 1 ? 'channel is' : 'channels are'} not deleted.
          </>
        ),
        confirmLabel: 'Stop monitoring',
        tone: 'danger',
      })
      if (!ok) return
    }
    app.setChannelsEnabled(g.id, Object.entries(toggles).map(([n, on]) => ({ name: n, on })))
    if (clean) app.addChannel(g.id, clean)
    toast('Channel monitoring changes saved.', { variant: 'success', title: 'Changes saved' })
    onClose()
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="mgr-title">
      {titleWithDesc('mgr-title', 'Manage channels', `${g.name} · Toggling monitoring never creates or deletes the underlying Teams channel.`)}
      <DialogContent dividers>
        {g.channels.map(c => (
          <div key={c.name} className="flex items-center justify-between gap-3 border-b border-line py-2.5">
            <div>
              <strong className="text-[13px]"># {c.name}</strong>
              <small className="block text-xs text-muted">{toggles[c.name] ? 'Bot monitoring enabled' : 'Not currently monitored'}</small>
            </div>
            <FormControlLabel
              labelPlacement="start"
              label={<span className="text-[12.5px] text-muted">Monitor</span>}
              control={
                <Switch
                  checked={!!toggles[c.name]}
                  onChange={e => setToggles(t => ({ ...t, [c.name]: e.target.checked }))}
                  slotProps={{ input: { role: 'switch', 'aria-label': `Monitor #${c.name}` } }}
                />
              }
            />
          </div>
        ))}
        <TextField
          id="new-channel-name"
          fullWidth
          size="small"
          label="Add existing channel to bot service"
          placeholder="e.g. incident-response"
          value={name}
          onChange={e => {
            setName(e.target.value)
            setError('')
          }}
          error={!!error}
          helperText={error || 'Demo only: in production, choose from channels returned by Microsoft Graph instead of accepting an arbitrary name.'}
          sx={{ mt: 2.5 }}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { autoComplete: 'off' } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>Save changes</Button>
      </DialogActions>
    </Dialog>
  )
}

const NEW = '__new__'

export function AddChannelDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp()
  const toast = useToast()
  const [groupId, setGroupId] = useState(app.groups[0]?.id ?? '')
  const g = app.groups.find(x => x.id === groupId)
  const firstOff = (gid: string) => app.groups.find(x => x.id === gid)?.channels.find(c => !c.enabled)?.name ?? NEW
  const [channel, setChannel] = useState(() => firstOff(groupId))
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  if (!g) return null

  const submit = () => {
    if (channel === NEW) {
      const clean = name.trim().replace(/^#/, '')
      const err = clean ? validateChannelName(clean, g) : 'Enter a channel name.'
      setError(err)
      if (err) {
        document.getElementById('add-channel-name')?.focus()
        return
      }
      app.addChannel(g.id, clean)
      toast(`#${clean} added to the ${g.name} monitoring scope.`, { variant: 'success', title: 'Channel added' })
    } else {
      app.setChannelsEnabled(g.id, [{ name: channel, on: true }])
      toast(`#${channel} added to the ${g.name} monitoring scope.`, { variant: 'success', title: 'Channel added' })
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="add-title">
      {titleWithDesc('add-title', 'Add channel to bot service', 'Choose a channel that already exists in a bot-enabled Team. The backend verifies access before updating the monitoring scope.')}
      <DialogContent dividers className="grid gap-4">
        <TextField
          select
          size="small"
          label="Teams group"
          value={groupId}
          onChange={e => {
            setGroupId(e.target.value)
            setChannel(firstOff(e.target.value))
            setError('')
          }}
          sx={{ mt: 1 }}
        >
          {app.groups.map(x => (
            <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Channel" value={channel} onChange={e => { setChannel(e.target.value); setError('') }}>
          <ListSubheader>Existing channels</ListSubheader>
          {g.channels.map(c => (
            <MenuItem key={c.name} value={c.name} disabled={c.enabled} sx={{ fontSize: 13 }}>
              # {c.name} {c.enabled ? '(already monitored)' : '(monitoring off)'}
            </MenuItem>
          ))}
          <MenuItem value={NEW}>
            <AddIcon fontSize="small" sx={{ mr: 1 }} /> Type a new channel name…
          </MenuItem>
        </TextField>
        {channel === NEW && (
          <TextField
            id="add-channel-name"
            size="small"
            label="New channel name"
            placeholder="e.g. incident-response"
            autoFocus
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            error={!!error}
            helperText={error || ' '}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { autoComplete: 'off' } }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={submit}>Add to bot service</Button>
      </DialogActions>
    </Dialog>
  )
}

export function OpenIncidentsDialog({ groupId, channel, onClose }: { groupId: string; channel: string; onClose: () => void }) {
  const app = useApp()
  const demo = useDemoLink()
  const g = app.groups.find(x => x.id === groupId)
  if (!g) return null
  const open = openIncidentsFor(app.incidents, g.name, channel)
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="open-title">
      {titleWithDesc('open-title', `Open incidents · #${channel}`, `${g.name} · ${plural(open.length, 'open incident')}`)}
      <DialogContent dividers className="grid gap-2.5">
        {open.length ? (
          open.map(i => (
            <div key={i.id} className="grid gap-1.5 rounded-xl border border-line p-3.5 subtle-bg">
              <div className="flex items-start justify-between gap-2.5">
                <strong className="text-sm">{i.title}</strong>
                <StatusChip status={i.status} />
              </div>
              <small className="text-xs text-muted">{i.id} · Created by {i.creator} · IC: {i.ic}</small>
              <p className="text-[13px] text-muted">{i.summary}</p>
              <div className="flex gap-2">
                <Button size="small" variant="outlined" color="inherit" startIcon={<EyeIcon />} onClick={() => { onClose(); app.setOpenIncidentId(i.id) }}>
                  View details
                </Button>
                <Button size="small" color="inherit" startIcon={<ExternalIcon />} href={i.link} onClick={demo(`Teams thread for ${i.id}`)}>
                  Open source thread
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted">There are currently no open incidents for this channel.</p>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
