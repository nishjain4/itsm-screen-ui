import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Slide from '@mui/material/Slide'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { useEffect, useRef } from 'react'
import { useConfirm } from '../../components/Confirm'
import { AlertIcon, CheckCircleIcon, CheckIcon, FilterIcon, GroupsIcon, SearchIcon, TuneIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { EmptyState, SectionTitle } from '../../components/ui'
import { CORE_FEATURES, DEFAULT_ORDER } from '../../data/mock'
import { getOn, openIncidentsFor, plural, policyKey } from '../../lib/utils'
import { useApp, useDirtyCount } from '../../state/AppState'
import type { Channel, CoreFeature, Group } from '../../types'

interface CardProps {
  g: Group
  c: Channel
  flash: boolean
  onAdvanced: () => void
  onShowOpen: () => void
}

function PolicyCard({ g, c, flash, onAdvanced, onShowOpen }: CardProps) {
  const app = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const key = policyKey(g, c)
  const draft = app.policyDraft[key]
  const v = draft ?? { summary: c.summary, paging: c.paging, zoom: c.zoom }
  const off = !c.enabled
  const open = openIncidentsFor(app.incidents, g.name, c.name)
  const auto = DEFAULT_ORDER.filter(k => getOn(c, k) && c.modes[k] === 'automatic').length
  const onDemand = DEFAULT_ORDER.filter(k => getOn(c, k) && c.modes[k] === 'on-demand').length

  useEffect(() => {
    if (flash) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [flash])

  const toggle = (k: CoreFeature, checked: boolean) => {
    const next = { ...v, [k]: checked }
    app.setDraft(key, CORE_FEATURES.every(f => next[f] === c[f]) ? null : next)
  }

  const row = (k: CoreFeature, label: string, note: string) => (
    <label className={`flex items-center justify-between gap-3 border-b border-line py-2 last:border-0 ${off ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <span>
        <b className="block text-[13px] font-medium">{label}</b>
        <small className="block text-xs text-muted">{note}</small>
      </span>
      <Switch
        checked={v[k] && !off}
        disabled={off}
        onChange={e => toggle(k, e.target.checked)}
        slotProps={{ input: { role: 'switch', 'aria-label': `${label} for ${g.name} / ${c.name}` } }}
      />
    </label>
  )

  return (
    <Card
      ref={ref}
      component="article"
      aria-label={`#${c.name} policy`}
      className="flex flex-col gap-1 p-4 transition-[background-color,border-color,box-shadow] duration-300"
      sx={{
        bgcolor: off ? 'action.hover' : flash ? 'action.selected' : undefined,
        borderColor: flash ? 'primary.main' : draft ? 'warning.main' : undefined,
        boxShadow: draft ? '0 0 0 3px color-mix(in srgb, var(--color-st-monitoring) 14%, transparent)' : undefined,
      }}
    >
      <header className="mb-1.5 flex items-start justify-between gap-2">
        <div>
          <strong className="block text-sm font-semibold"># {c.name}</strong>
          <small className="text-xs text-muted">{g.name}</small>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Chip size="small" variant="outlined" color={off ? 'default' : 'success'} label={off ? 'Monitoring off' : 'Monitoring on'} className={off ? '' : 'tint-resolved'} />
          {draft && <Chip size="small" color="warning" variant="outlined" label="Modified" className="tint-monitoring" />}
        </div>
      </header>
      <div className="mb-1.5 flex flex-col gap-0.5 rounded-lg border border-line px-2.5 py-2 text-xs subtle-bg">
        {open.length ? (
          <>
            <Button size="small" color="error" startIcon={<AlertIcon />} onClick={onShowOpen} sx={{ alignSelf: 'flex-start', p: 0, minWidth: 0, fontSize: 12.5 }}>
              {plural(open.length, 'open incident')}
            </Button>
            <small className="truncate text-muted">
              {open[0].title}
              {open.length > 1 ? ` +${open.length - 1} more` : ''}
            </small>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-st-resolved">
            <CheckCircleIcon sx={{ fontSize: 15 }} />
            No open incidents
          </span>
        )}
      </div>
      {row('summary', 'Incident summary', v.summary && c.modes.summary === 'on-demand' ? 'On demand (@mention)' : `Posts every ${c.interval} min`)}
      {row('paging', 'Allow paging', 'Page the on-call responder')}
      {row('zoom', 'Allow Zoom start', 'Start a Zoom bridge')}
      <footer className="mt-auto flex items-center justify-between gap-2.5 border-t border-line pt-3">
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<TuneIcon />}
          disabled={off}
          onClick={onAdvanced}
          title={off ? 'Turn bot monitoring on to change settings' : undefined}
          aria-label={`Advanced settings for ${g.name} / ${c.name}`}
        >
          Manage more
        </Button>
        <small className="text-xs text-muted">
          {auto} automatic · {onDemand} on demand
        </small>
      </footer>
    </Card>
  )
}

function SaveBar() {
  const app = useApp()
  const confirm = useConfirm()
  const toast = useToast()
  const n = useDirtyCount()

  const discard = async () => {
    const ok = await confirm({ title: 'Discard unsaved changes?', message: `Changes to ${plural(n, 'channel')} will be lost. This cannot be undone.`, confirmLabel: 'Discard changes', tone: 'danger' })
    if (!ok) return
    app.discardDrafts()
    toast('Unsaved policy changes discarded.')
  }
  const save = () => {
    const saved = app.savePolicies()
    toast(`${plural(saved, 'channel policy', 'channel policies')} saved. Connect the API to persist changes in production.`, { variant: 'success', title: 'Policies saved' })
  }

  return (
    <Slide in={n > 0} direction="up" mountOnEnter unmountOnExit>
      <Paper
        role="region"
        aria-label="Unsaved changes"
        elevation={12}
        className="fixed right-3 bottom-5 left-3 z-[1100] flex flex-wrap items-center gap-3 rounded-xl! border border-line py-2 pr-2 pl-4 text-[13px] font-medium sm:right-auto sm:left-1/2 sm:-translate-x-1/2"
      >
        <span className="size-2 rounded-full bg-st-monitoring shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-st-monitoring)_20%,transparent)]" />
        <span>{plural(n, 'channel')} with unsaved policy changes</span>
        <Button size="small" color="inherit" onClick={discard}>
          Discard
        </Button>
        <Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={save}>
          Save all policies
        </Button>
      </Paper>
    </Slide>
  )
}

export function PoliciesTab({ onAdvanced, onShowOpen }: { onAdvanced: (groupId: string, channel: string) => void; onShowOpen: (groupId: string, channel: string) => void }) {
  const app = useApp()
  const { q, group } = app.policyFilter
  const query = q.trim().toLowerCase()
  const items = app.groups.flatMap(g =>
    g.channels.filter(c => (!group || g.id === group) && (!query || c.name.toLowerCase().includes(query) || g.name.toLowerCase().includes(query))).map(c => ({ g, c })),
  )
  const flashKey = items.find(({ g }) => g.id === app.flashGroup)
  const flashId = flashKey ? policyKey(flashKey.g, flashKey.c) : null

  return (
    <>
      <SectionTitle
        title="Channel behavior policies"
        description="Set automation rules individually for each Teams channel."
        actions={
          <>
            <TextField
              size="small"
              type="search"
              placeholder="Filter channels…"
              value={q}
              onChange={e => app.setPolicyFilter({ q: e.target.value, group })}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> },
                htmlInput: { 'aria-label': 'Filter channel policies', autoComplete: 'off' },
              }}
            />
            <TextField
              select
              size="small"
              value={group}
              onChange={e => app.setPolicyFilter({ q, group: e.target.value })}
              sx={{ minWidth: 200 }}
              slotProps={{
                select: { displayEmpty: true, inputProps: { 'aria-label': 'Filter by Teams group' } },
                input: { startAdornment: <InputAdornment position="start"><GroupsIcon sx={{ fontSize: 18 }} /></InputAdornment> },
              }}
            >
              <MenuItem value="">All groups</MenuItem>
              {app.groups.map(g => (
                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
              ))}
            </TextField>
          </>
        }
      />
      {items.length ? (
        <div className="grid gap-3.5 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {items.map(({ g, c }) => (
            <PolicyCard
              key={policyKey(g, c)}
              g={g}
              c={c}
              flash={policyKey(g, c) === flashId}
              onAdvanced={() => onAdvanced(g.id, c.name)}
              onShowOpen={() => onShowOpen(g.id, c.name)}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={<FilterIcon />} title="No channels match">Adjust the filter to see more channels.</EmptyState>
      )}
      <p className="mt-3 text-xs text-muted">
        Custom intervals are stored in minutes and should be validated server-side (1–120). The open-incident count excludes resolved and closed incidents. Enforce paging and meeting permissions in the backend.
      </p>
      {/* Keeps the last cards scrollable above the fixed save bar. */}
      {Object.keys(app.policyDraft).length > 0 && <div aria-hidden className="h-20" />}
      <SaveBar />
    </>
  )
}
