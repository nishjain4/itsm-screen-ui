import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Zoom from '@mui/material/Zoom'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChatIcon, CloseIcon, ExternalIcon } from '../../components/icons'
import { Person, StatusChip, useDemoLink, ZoomLink } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import type { Incident } from '../../types'

/** How long a card must be hovered before its focus view opens (ms). */
export const HOVER_DELAY = 1000

/** Starts a timer on pointer-enter and calls `onFocus` once it elapses; cancels on leave/click. */
export function useHoverFocus(onFocus: () => void) {
  const timer = useRef<number | undefined>(undefined)
  const [arming, setArming] = useState(false)
  const cancel = () => {
    window.clearTimeout(timer.current)
    setArming(false)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return {
    arming,
    cancel,
    hoverProps: {
      onMouseEnter: () => {
        setArming(true)
        timer.current = window.setTimeout(() => {
          setArming(false)
          onFocus()
        }, HOVER_DELAY)
      },
      onMouseLeave: cancel,
    },
  }
}

/** Fills along the card's bottom edge over the hover delay so users can see the focus view is about to open. */
export function HoverProgress({ arming }: { arming: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute bottom-0 left-0 h-[3px] bg-primary ease-linear"
      style={{ width: arming ? '100%' : '0%', transitionProperty: 'width', transitionDuration: arming ? `${HOVER_DELAY}ms` : '0ms' }}
    />
  )
}

export function FocusedTicket({ incident, onClose, onOpen }: { incident: Incident | null; onClose: () => void; onOpen: (id: string) => void }) {
  const demo = useDemoLink()
  // Closing on pointer-leave only once the pointer has entered, so it doesn't vanish as it opens.
  const entered = useRef(false)
  useEffect(() => {
    entered.current = false
  }, [incident])

  if (!incident) return null
  const rows: [string, ReactNode][] = [
    ['Status', <StatusChip key="s" status={incident.status} />],
    ['Incident Commander', <Person key="ic" name={incident.ic} size={24} />],
    ['Reported by', <Person key="r" name={incident.creator} size={24} />],
    ['Raised', formatDate(incident.date)],
    ['Teams group', incident.team],
    ['Channel', `#${incident.channel}`],
    ['Meeting', <ZoomLink key="z" incident={incident} />],
  ]
  return (
    <Dialog
      open
      onClose={onClose}
      slots={{ transition: Zoom }}
      aria-labelledby="focused-ticket-title"
      slotProps={{
        backdrop: { sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgb(15 23 42 / .45)' } },
        paper: {
          onMouseEnter: () => (entered.current = true),
          onMouseLeave: () => entered.current && onClose(),
          sx: { width: 640, maxWidth: 'calc(100% - 32px)', borderRadius: 4, backgroundImage: 'none' },
        },
      }}
    >
      <article className="relative p-6 sm:p-8">
        <IconButton aria-label="Close" onClick={onClose} size="small" className="absolute! top-4 right-4">
          <CloseIcon fontSize="small" />
        </IconButton>
        <div className="flex flex-wrap items-center gap-2 pr-10">
          <code className="text-sm font-semibold text-muted">{incident.id}</code>
          <StatusChip status={incident.status} />
        </div>
        <h2 id="focused-ticket-title" className="mt-2 text-[22px] leading-tight font-semibold tracking-tight">{incident.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{incident.summary}</p>
        <dl className="mt-5 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 border-t border-line pt-5 text-[14px]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="min-w-0 truncate">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="contained" disableElevation startIcon={<ChatIcon />} href={incident.link} onClick={demo(`Teams thread for ${incident.id}`)}>
            Open Teams thread
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<ExternalIcon />} onClick={() => onOpen(incident.id)}>
            Full view
          </Button>
        </div>
      </article>
    </Dialog>
  )
}
