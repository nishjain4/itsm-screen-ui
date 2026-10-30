import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import { useCallback, type MouseEvent, type ReactNode } from 'react'
import { initials, statusTone, toneClass } from '../lib/utils'
import type { Incident, IncidentStatus } from '../types'
import { ActivityIcon, AlertIcon, ClockIcon, VideoIcon } from './icons'
import { useToast } from './Toast'

export function StatusChip({ status }: { status: IncidentStatus }) {
  const tone = statusTone(status)
  return (
    <Chip
      size="small"
      variant="outlined"
      color={tone}
      label={status}
      icon={<span className={`ml-2! size-1.5 rounded-full bg-current ${status === 'Active' ? 'animate-pulse-soft' : ''}`} />}
      className={toneClass[tone]}
    />
  )
}

export function Person({ name, size = 22 }: { name: string; size?: number }) {
  if (name === 'Unassigned')
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-st-monitoring">
        <AlertIcon sx={{ fontSize: 16 }} />
        Awaiting IC
      </span>
    )
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      <Avatar aria-hidden className="tint-primary" sx={{ width: size, height: size, fontSize: size * 0.42, fontWeight: 600, border: 1, borderColor: 'divider' }}>
        {initials(name)}
      </Avatar>
      {name}
    </span>
  )
}

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid flex-none place-items-center rounded-lg bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-[0_4px_12px_-4px_rgb(37_99_235/.6)]"
      style={{ width: size, height: size }}
    >
      <ActivityIcon sx={{ fontSize: size * 0.58 }} />
    </span>
  )
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-line bg-paper px-5 py-12 text-center text-muted">
      <span className="mb-1.5 grid size-11 place-items-center rounded-xl bg-hover">{icon}</span>
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      {children && <div className="text-sm">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Prototype links: intercept navigation and explain the backend dependency. */
export function useDemoLink() {
  const toast = useToast()
  return useCallback(
    (label: string) => (e: MouseEvent) => {
      e.preventDefault()
      toast(`Connect the backend to open the real ${label}.`, { title: 'Prototype only' })
    },
    [toast],
  )
}

export function ZoomLink({ incident }: { incident: Incident }) {
  const demo = useDemoLink()
  if (incident.zoom === 'live')
    return (
      <Chip
        component="a"
        href="#zoom-live"
        clickable
        size="small"
        variant="outlined"
        color="success"
        icon={<VideoIcon />}
        label="Join live bridge"
        onClick={demo('Zoom join link')}
        className="tint-resolved"
      />
    )
  if (incident.zoom === 'scheduled')
    return <Chip component="a" href="#zoom-scheduled" clickable size="small" variant="outlined" icon={<ClockIcon />} label="Zoom scheduled" onClick={demo('Zoom meeting details')} />
  return <span className="text-[12.5px] text-muted">{incident.zoom === 'ended' ? 'Meeting ended' : 'No meeting attached'}</span>
}

export function SectionTitle({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
