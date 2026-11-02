import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'
import Zoom from '@mui/material/Zoom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpIcon, BackIcon, CloseIcon, RefreshIcon, SearchIcon } from '../../components/icons'
import { EmptyState, Person, StatusChip } from '../../components/ui'
import { STATUSES } from '../../data/mock'
import { formatDate, plural } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Incident, IncidentStatus } from '../../types'
import { FocusedTicket, HoverProgress, useHoverFocus } from './HoverFocus'

const PAGE_SIZE = 24

/** Newest raised first; resolved tickets always go to the end. */
function byLatestOpenFirst(a: Incident, b: Incident) {
  const ra = a.status === 'Resolved' ? 1 : 0
  const rb = b.status === 'Resolved' ? 1 : 0
  return ra - rb || b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
}

function StatusCard({ incident, onOpen, onFocus }: { incident: Incident; onOpen: () => void; onFocus: () => void }) {
  const { arming, cancel, hoverProps } = useHoverFocus(onFocus)

  return (
    <Card
      component="button"
      type="button"
      onClick={() => {
        cancel()
        onOpen()
      }}
      {...hoverProps}
      aria-label={`${incident.id}: ${incident.title}, status ${incident.status}`}
      className="relative flex! h-full w-full! cursor-pointer flex-col! items-stretch! gap-3 overflow-hidden p-4! text-left! transition duration-300 hover:z-10 hover:scale-[1.03] hover:border-primary/50 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-xs font-semibold">{incident.id}</code>
        <StatusChip status={incident.status} />
      </div>
      <div>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">{incident.title}</h3>
        <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">{incident.summary}</p>
      </div>
      <footer className="mt-auto flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
        <Person name={incident.creator} size={20} />
        <span className="ml-auto whitespace-nowrap">{formatDate(incident.date)}</span>
      </footer>
      <HoverProgress arming={arming} />
    </Card>
  )
}

export function TicketStatusBoard({ onBack, backLabel }: { onBack?: () => void; backLabel?: string }) {
  const app = useApp()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<IncidentStatus | ''>('')
  const [team, setTeam] = useState('')
  const [focused, setFocused] = useState<Incident | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)

  const teams = useMemo(() => [...new Set(app.incidents.map(i => i.team))].sort(), [app.incidents])
  const data = useMemo(() => {
    const q = query.trim().toLowerCase()
    return app.incidents
      .filter(
        i =>
          (!status || i.status === status) &&
          (!team || i.team === team) &&
          (!q || [i.id, i.title, i.summary, i.creator, i.team, i.channel].some(v => v.toLowerCase().includes(q))),
      )
      .sort(byLatestOpenFirst)
  }, [app.incidents, query, status, team])

  const filterKey = `${query}|${status}|${team}`
  const [page, setPage] = useState({ key: filterKey, n: PAGE_SIZE })
  const limit = page.key === filterKey ? page.n : PAGE_SIZE

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [filterKey])

  // Render progressively so long lists stay responsive.
  useEffect(() => {
    const el = sentinel.current
    if (!el || limit >= data.length) return
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setPage({ key: filterKey, n: limit + PAGE_SIZE }),
      { root: scroller.current, rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [limit, data.length, filterKey])

  const visible = data.slice(0, limit)

  const pill = (active: boolean) =>
    `h-9 flex-none rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      active ? 'bg-fg text-paper' : 'bg-hover text-fg hover:bg-line'
    }`

  const card = (incident: Incident) => (
    <StatusCard
      key={incident.id}
      incident={incident}
      onOpen={() => app.setOpenIncidentId(incident.id)}
      onFocus={() => setFocused(incident)}
    />
  )

  return (
    <section aria-labelledby="status-board-title" className="relative flex h-full flex-col">
      <header className="flex-none border-b border-line bg-paper px-4 pt-3 pb-3 sm:px-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="text" color="inherit" startIcon={<BackIcon />} onClick={onBack} className="flex-none normal-case!">
              {backLabel ?? 'Back'}
            </Button>
          )}
          <h1 id="status-board-title" className="flex-none text-[17px] font-semibold tracking-tight max-sm:sr-only">Status Page</h1>
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-hover px-4 focus-within:outline-2 focus-within:outline-primary">
            <SearchIcon aria-hidden fontSize="small" className="text-muted" />
            <span className="sr-only">Search tickets</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tickets, teams, people…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="grid place-items-center text-muted hover:text-fg">
                <CloseIcon fontSize="small" />
              </button>
            )}
          </label>
          <span className="flex-none text-xs text-muted max-md:hidden" aria-live="polite">{plural(data.length, 'ticket')}</span>
        </div>
        <nav aria-label="Filter tickets" className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" className={pill(!status && !team)} aria-pressed={!status && !team} onClick={() => { setStatus(''); setTeam('') }}>
            All tickets
          </button>
          {STATUSES.map(s => (
            <button key={s} type="button" className={pill(status === s)} aria-pressed={status === s} onClick={() => setStatus(status === s ? '' : s)}>
              {s}
            </button>
          ))}
          <span aria-hidden className="mx-1 w-px flex-none self-stretch bg-line" />
          {teams.map(t => (
            <button key={t} type="button" className={pill(team === t)} aria-pressed={team === t} onClick={() => setTeam(team === t ? '' : t)}>
              {t}
            </button>
          ))}
        </nav>
      </header>

      <div
        ref={scroller}
        onScroll={e => setScrolled(e.currentTarget.scrollTop > 400)}
        className="min-h-0 flex-1 overflow-auto scroll-smooth px-4 pb-24 sm:px-6"
      >
        <div className="mx-auto max-w-[1500px]" aria-busy={app.refreshing}>
          {!data.length ? (
            <div className="pt-3">
              <EmptyState
                icon={<SearchIcon />}
                title="No tickets match"
                action={<Button variant="outlined" color="inherit" size="small" onClick={() => { setQuery(''); setStatus(''); setTeam('') }}>Reset filters</Button>}
              >
                Try a different search term or filter.
              </EmptyState>
            </div>
          ) : (
            <>
              <div aria-label="Tickets, newest first, resolved last" role="list" className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4">
                {visible.map(i => <div key={i.id} role="listitem">{card(i)}</div>)}
              </div>
              {limit < data.length && (
                <div ref={sentinel} className="py-6 text-center text-xs text-muted">
                  Loading more tickets…
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="absolute right-5 bottom-5 flex flex-col gap-3">
        <Zoom in={scrolled}>
          <Fab size="small" aria-label="Back to top" onClick={() => scroller.current?.scrollTo({ top: 0 })} sx={{ bgcolor: 'background.paper', color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}>
            <ArrowUpIcon fontSize="small" />
          </Fab>
        </Zoom>
        <Tooltip title="Refresh tickets" placement="left">
          <span>
            <Fab size="medium" aria-label="Refresh tickets" onClick={app.refresh} disabled={app.refreshing} sx={{ bgcolor: 'background.paper', color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}>
              <RefreshIcon className={app.refreshing ? 'animate-spin' : ''} />
            </Fab>
          </span>
        </Tooltip>
      </div>

      <FocusedTicket
        incident={focused}
        onClose={() => setFocused(null)}
        onOpen={id => {
          setFocused(null)
          app.setOpenIncidentId(id)
        }}
      />
    </section>
  )
}
