import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useConfirm } from '../../components/Confirm'
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, CloseIcon, CloudIcon, CopyIcon, DragIcon, InfoIcon, MailIcon, PhoneIcon, ResetIcon, ShieldIcon, SummaryIcon, VideoIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { DEFAULT_ORDER, FEATURES, makeChannel } from '../../data/mock'
import { getOn, isCore, isValidMinutes, plural, policyKey } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Channel, CoreValues, ExtraFeature, FeatureKey, FeatureMode } from '../../types'

const ICONS: Record<FeatureKey, ReactNode> = {
  summary: <SummaryIcon fontSize="small" />,
  paging: <PhoneIcon fontSize="small" />,
  zoom: <VideoIcon fontSize="small" />,
  outage: <CloudIcon fontSize="small" />,
  similar: <CopyIcon fontSize="small" />,
  ic: <ShieldIcon fontSize="small" />,
  notify: <MailIcon fontSize="small" />,
}

interface Draft {
  order: FeatureKey[]
  on: Record<FeatureKey, boolean>
  mode: Record<FeatureKey, FeatureMode>
  interval: Record<FeatureKey, string>
  ic: { on: boolean; after: string }
}

function draftFrom(c: Channel, pending?: CoreValues): Draft {
  const on = Object.fromEntries(DEFAULT_ORDER.map(k => [k, getOn(c, k)])) as Record<FeatureKey, boolean>
  if (pending) Object.assign(on, pending)
  return { order: [...c.order], on, mode: { ...c.modes }, interval: { ...c.intervals, summary: c.interval }, ic: { ...c.icAutoAssign } }
}

export interface AdvancedTarget {
  groupId: string
  channel: string
}

export function AdvancedSettingsDialog({ target, onClose }: { target: AdvancedTarget; onClose: () => void }) {
  const app = useApp()
  const confirm = useConfirm()
  const toast = useToast()
  const wide = useMediaQuery('(min-width:900px)')
  const g = app.groups.find(x => x.id === target.groupId)
  const c = g?.channels.find(x => x.name === target.channel)
  const key = g && c ? policyKey(g, c) : ''
  const [draft, setDraft] = useState<Draft | null>(() => (c ? draftFrom(c, app.policyDraft[key]) : null))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragKey, setDragKey] = useState<FeatureKey | null>(null)
  const [dropKey, setDropKey] = useState<FeatureKey | null>(null)
  const chipRefs = useRef(new Map<FeatureKey, HTMLLIElement>())
  const pendingFocus = useRef<FeatureKey | null>(null)

  useEffect(() => {
    const k = pendingFocus.current
    if (!k) return
    pendingFocus.current = null
    const active = document.activeElement as HTMLButtonElement | null
    if (!active || active === document.body || active.disabled) chipRefs.current.get(k)?.focus()
  })

  if (!g || !c || !draft) return null

  const isMovable = (k: FeatureKey) => draft.on[k] && draft.mode[k] === 'automatic'
  const movable = draft.order.filter(isMovable)
  const patch = (p: Partial<Draft>) => setDraft(d => (d ? { ...d, ...p } : d))
  const clearError = (id: string) => setErrors(e => {
    if (!e[id]) return e
    const next = { ...e }
    delete next[id]
    return next
  })

  const reorder = (from: FeatureKey, to: FeatureKey) => {
    if (!isMovable(from) || !isMovable(to) || from === to) return
    const list = draft.order.filter(isMovable)
    list.splice(list.indexOf(to), 0, list.splice(list.indexOf(from), 1)[0])
    let n = 0
    patch({ order: draft.order.map(k => (isMovable(k) ? list[n++] : k)) })
  }
  const move = (k: FeatureKey, delta: number) => {
    const target = movable[movable.indexOf(k) + delta]
    if (!target) return
    pendingFocus.current = k
    reorder(k, target)
  }

  const onChipKey = (k: FeatureKey) => (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    e.preventDefault()
    move(k, e.key === 'ArrowUp' ? -1 : 1)
  }
  const dnd = (k: FeatureKey) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      setDragKey(k)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', k)
    },
    onDragOver: (e: DragEvent) => {
      if (!dragKey) return
      e.preventDefault()
      setDropKey(k)
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      if (dragKey) reorder(dragKey, k)
      setDragKey(null)
      setDropKey(null)
    },
    onDragEnd: () => {
      setDragKey(null)
      setDropKey(null)
    },
  })

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset to default settings?',
      message: (
        <>
          All features, modes, intervals and the workflow order for <b>#{c.name}</b> will be restored to the {g.name} defaults immediately.
        </>
      ),
      confirmLabel: 'Reset settings',
      tone: 'danger',
    })
    if (!ok) return
    const fresh = { ...makeChannel(g, c.name, c.enabled) }
    app.updateChannel(g.id, c.name, () => fresh)
    app.setDraft(key, null)
    setDraft(draftFrom(fresh))
    setErrors({})
    app.logAudit('Reset settings', '#' + c.name, `${g.name} · restored group defaults`, 'reset')
    toast(`#${c.name} reset to default settings.`, { variant: 'success', title: 'Settings reset' })
  }

  const save = () => {
    const next: Record<string, string> = {}
    for (const k of DEFAULT_ORDER) {
      if (!draft.on[k] || draft.mode[k] !== 'automatic') continue
      const v = draft.interval[k] ?? ''
      if (v === '' && k !== 'summary') continue
      if (!isValidMinutes(v)) next['adv-int-' + k] = `${FEATURES[k].label} interval must be a whole number between 1 and 120.`
    }
    if (draft.on.ic && draft.mode.ic === 'automatic' && draft.ic.on && !isValidMinutes(draft.ic.after)) next['adv-ic-after'] = 'IC auto-assign delay must be a whole number between 1 and 120.'
    setErrors(next)
    if (Object.keys(next).length) {
      requestAnimationFrame(() => {
        const node = document.getElementById(Object.keys(next)[0])
        node?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        node?.focus({ preventScroll: true })
      })
      toast(`Fix ${plural(Object.keys(next).length, 'field')} before saving.`, { variant: 'error', title: 'Check the highlighted fields' })
      return
    }
    app.updateChannel(g.id, c.name, ch => ({
      ...ch,
      summary: draft.on.summary,
      paging: draft.on.paging,
      zoom: draft.on.zoom,
      extraOn: Object.fromEntries(DEFAULT_ORDER.filter(k => !isCore(k)).map(k => [k, draft.on[k]])) as Record<ExtraFeature, boolean>,
      modes: { ...draft.mode },
      order: [...draft.order],
      interval: isValidMinutes(draft.interval.summary) ? draft.interval.summary : ch.interval,
      intervals: Object.fromEntries(DEFAULT_ORDER.map(k => [k, isValidMinutes(draft.interval[k] ?? '') ? draft.interval[k] : ''])) as Record<FeatureKey, string>,
      icAutoAssign: { on: draft.ic.on, after: isValidMinutes(draft.ic.after) ? draft.ic.after : '' },
    }))
    app.setDraft(key, null)
    const autoN = DEFAULT_ORDER.filter(k => draft.on[k] && draft.mode[k] === 'automatic').length
    const offN = DEFAULT_ORDER.filter(k => !draft.on[k]).length
    app.logAudit('Updated advanced settings', '#' + c.name, `${g.name} · ${autoN} automatic, ${DEFAULT_ORDER.length - autoN - offN} on demand, ${offN} off`, 'policy')
    toast(`Advanced settings saved for #${c.name}.`, { variant: 'success', title: 'Settings saved' })
    onClose()
  }

  const numberField = (id: string, label: string, value: string, help: string, onChange: (v: string) => void, placeholder?: string) => (
    <TextField
      id={id}
      size="small"
      type="number"
      label={label}
      value={value}
      placeholder={placeholder}
      onChange={e => {
        onChange(e.target.value.trim())
        clearError(id)
      }}
      error={!!errors[id]}
      helperText={errors[id] ?? help}
      sx={{ mt: 1.75, maxWidth: 360 }}
      fullWidth
      slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, max: 120, step: 1, inputMode: 'numeric' } }}
    />
  )

  const featureRow = (k: FeatureKey) => {
    const on = draft.on[k]
    const auto = draft.mode[k] === 'automatic'
    const F = FEATURES[k]
    return (
      <Card key={k} component="section" aria-labelledby={`adv-t-${k}`} className="mb-2.5 p-3.5" sx={{ bgcolor: on ? undefined : 'action.hover' }}>
        <div className="flex items-center gap-3.5">
          <span className={`grid size-9.5 flex-none place-items-center rounded-xl ${on ? 'tint-primary' : 'bg-hover text-muted'}`}>{ICONS[k]}</span>
          <div className="min-w-0 flex-1">
            <strong id={`adv-t-${k}`} className="block text-sm font-semibold">{F.label}</strong>
            <small className="text-xs text-muted">{F.desc}</small>
          </div>
          <FormControlLabel
            labelPlacement="start"
            label={<span className="text-xs text-muted">{on ? 'On' : 'Off'}</span>}
            control={<Switch checked={on} onChange={e => patch({ on: { ...draft.on, [k]: e.target.checked } })} slotProps={{ input: { role: 'switch', 'aria-label': F.label } }} />}
            sx={{ mr: 0 }}
          />
        </div>
        {on && (
          <div className="mt-3 border-t border-dashed border-line pt-3">
            <RadioGroup
              row
              aria-label={`${F.label} mode`}
              value={draft.mode[k]}
              onChange={e => patch({ mode: { ...draft.mode, [k]: e.target.value as FeatureMode } })}
              className="grid! max-w-[540px] grid-cols-1 gap-2.5 sm:grid-cols-2"
            >
              {(
                [
                  ['on-demand', 'On demand', 'Only when @mentioned'],
                  ['automatic', 'Automatic', 'Runs without a mention'],
                ] as const
              ).map(([value, title, sub]) => (
                <FormControlLabel
                  key={value}
                  value={value}
                  control={<Radio size="small" />}
                  label={
                    <span className="leading-tight">
                      <b className="block text-[13px] font-semibold">{title}</b>
                      <small className="text-xs text-muted">{sub}</small>
                    </span>
                  }
                  sx={{
                    m: 0,
                    px: 1.25,
                    py: 0.75,
                    border: 1,
                    borderRadius: 2,
                    borderColor: draft.mode[k] === value ? 'primary.main' : 'divider',
                    bgcolor: draft.mode[k] === value ? 'action.selected' : 'background.paper',
                  }}
                />
              ))}
            </RadioGroup>
            {auto &&
              numberField(
                `adv-int-${k}`,
                'Run every (minutes)',
                draft.interval[k] ?? '',
                k === 'summary' ? 'Whole number from 1 to 120.' : 'Leave blank to keep the default timing. Otherwise 1 to 120.',
                v => patch({ interval: { ...draft.interval, [k]: v } }),
                k === 'summary' ? undefined : 'Default',
              )}
            {auto && k === 'ic' && (
              <div className="mt-3 border-t border-line pt-3">
                <FormControlLabel
                  control={<Switch checked={draft.ic.on} onChange={e => patch({ ic: { ...draft.ic, on: e.target.checked } })} slotProps={{ input: { role: 'switch' } }} />}
                  label={
                    <span className="leading-tight">
                      <b className="block text-[13px]">Auto-assign IC</b>
                      <small className="text-xs text-muted">If no IC is found, the bot assigns one after the delay below.</small>
                    </span>
                  }
                />
                {draft.ic.on && numberField('adv-ic-after', 'Assign after (minutes)', draft.ic.after, 'Whole number from 1 to 120.', v => patch({ ic: { ...draft.ic, after: v } }))}
              </div>
            )}
          </div>
        )}
      </Card>
    )
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg" fullScreen={!wide} aria-labelledby="adv-title" aria-describedby="adv-desc">
      <DialogTitle id="adv-title" className="flex items-start gap-3 border-b border-line">
        <span className="flex-1">
          Advanced settings
          <span id="adv-desc" className="block text-[13px] font-normal text-muted">
            {g.name} · # {c.name}
          </span>
        </span>
        <Button size="small" variant="outlined" color="inherit" startIcon={<ResetIcon />} onClick={reset} title="Reset every setting for this channel to its default">
          Reset to default
        </Button>
        <IconButton aria-label="Close dialog" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <div className="mb-2 flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-[13px] subtle-bg">
          <InfoIcon fontSize="small" color="primary" />
          <span>
            <b>1.</b> Turn features on or off and choose how each runs. <b>2.</b> Arrange the order of automatic features on the right.
          </span>
        </div>
        <div className="mt-2 grid items-start gap-5 md:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
          <div>
            <h4 className="mb-2.5 text-[13px] font-semibold tracking-[.07em] text-muted uppercase">Features</h4>
            {DEFAULT_ORDER.map(featureRow)}
          </div>
          <aside aria-label="Workflow order" className="rounded-xl border border-line p-4 subtle-bg md:sticky md:top-0">
            <strong className="block text-[15px]">Workflow order</strong>
            <small className="mb-3.5 block text-xs text-muted">Automatic features run top to bottom. Drag a card, use the arrows, or press Alt + ↑/↓.</small>
            {movable.length ? (
              <ol aria-label="Automatic feature run order" className="flex flex-col gap-3">
                {movable.map((k, i) => (
                  <li
                    key={k}
                    ref={n => {
                      if (n) chipRefs.current.set(k, n)
                      else chipRefs.current.delete(k)
                    }}
                    tabIndex={0}
                    aria-label={`Step ${i + 1} of ${movable.length}: ${FEATURES[k].label}`}
                    onKeyDown={onChipKey(k)}
                    {...dnd(k)}
                    className={`relative flex cursor-grab items-center gap-2.5 rounded-lg border bg-paper px-3 py-2 shadow-xs transition outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-primary ${dropKey === k && dragKey !== k ? 'border-primary ring-3 ring-primary/20' : 'border-line'} ${dragKey === k ? 'opacity-40' : ''} ${i < movable.length - 1 ? "after:absolute after:-bottom-3.25 after:left-[47px] after:h-3 after:w-0.5 after:bg-line after:content-['']" : ''}`}
                  >
                    <DragIcon fontSize="small" className="text-muted" aria-hidden />
                    <span aria-hidden className="grid size-6 flex-none place-items-center rounded-full bg-primary text-xs font-semibold text-white">{i + 1}</span>
                    <span className="flex min-w-0 flex-1 items-center gap-2 text-[13px] font-semibold [&_svg]:text-primary">
                      {ICONS[k]}
                      {FEATURES[k].label}
                    </span>
                    <IconButton size="small" disabled={i === 0} onClick={() => move(k, -1)} aria-label={`Move ${FEATURES[k].label} up`}>
                      <ArrowUpIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" disabled={i === movable.length - 1} onClick={() => move(k, 1)} aria-label={`Move ${FEATURES[k].label} down`}>
                      <ArrowDownIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-6 text-center text-sm text-muted">No automatic features are on, so there is nothing to order.</p>
            )}
          </aside>
        </div>
      </DialogContent>
      <DialogActions className="border-t border-line subtle-bg" sx={{ px: 3, py: 1.5 }}>
        <span className="mr-auto text-xs text-muted">Changes apply to #{c.name} only.</span>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<CheckIcon />} onClick={save}>Save settings</Button>
      </DialogActions>
    </Dialog>
  )
}
