import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import ListItemButton from '@mui/material/ListItemButton'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import { Fragment, useEffect, useRef, useState } from 'react'
import { ActivityIcon, CalendarIcon, ChatIcon, CloseIcon, InfoIcon, PersonIcon, SearchIcon, ShieldIcon, VideoIcon } from '../../components/icons'
import { PillButton, PillMenu } from '../../components/Pill'
import { BrandMark, EmptyState, StatusChip, useDemoLink } from '../../components/ui'
import { STATUSES } from '../../data/mock'
import { formatDate, incidentsInChannel, initials, isOpen, plural, sortIncidents, teamTint } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Incident } from '../../types'
import { IncidentCard } from './IncidentBoard'
import { BoardSkeleton, ViewActions } from './ViewParts'

type ChannelTab = 'posts' | 'open'

const DATE_OPTIONS = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)

/** Teams-style "Find in chat" side panel. */
function FindPanel({ incidents, channel, onClose, onJump }: { incidents: Incident[]; channel: string; onClose: () => void; onJump: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [range, setRange] = useState('')
  const [person, setPerson] = useState('')
  const [meeting, setMeeting] = useState(false)
  const [awaitingIc, setAwaitingIc] = useState(false)

  const people = [...new Set(incidents.flatMap(i => [i.creator, i.ic]).filter(p => p !== 'Unassigned'))].sort()
  const q = query.trim().toLowerCase()
  const searching = !!(q || status || range || person || meeting || awaitingIc)
  const results = sortIncidents(
    incidents.filter(
      i =>
        (!q || [i.id, i.title, i.summary, i.creator, i.ic].some(x => x.toLowerCase().includes(q))) &&
        (!status || i.status === status) &&
        (!range || i.date >= daysAgo(Number(range))) &&
        (!person || i.creator === person || i.ic === person) &&
        (!meeting || i.zoom !== 'none') &&
        (!awaitingIc || i.ic === 'Unassigned'),
    ),
    { key: 'date', dir: 'desc' },
  )

  return (
    <aside
      aria-labelledby="find-title"
      onKeyDown={e => {
        if (e.key === 'Escape') onClose()
      }}
      className="flex w-[400px] flex-none flex-col border-l border-line bg-paper max-md:absolute max-md:inset-0 max-md:z-20 max-md:w-full"
    >
      <div className="flex h-16 flex-none items-center justify-between px-5">
        <h2 id="find-title" className="text-[18px] font-bold">Find in channel</h2>
        <IconButton aria-label="Close find in channel" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      <div className="flex-none px-5 pb-4">
        <label className="flex items-center gap-2 rounded-md border-b-2 border-line bg-hover px-3 transition-colors focus-within:border-primary">
          <InputBase
            autoFocus
            fullWidth
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter a search keyword…"
            sx={{ height: 44, fontSize: 15 }}
            slotProps={{ input: { 'aria-label': `Search incidents in # ${channel}`, autoComplete: 'off' } }}
          />
          <SearchIcon className="text-muted" />
        </label>
        <div role="group" aria-label="Search filters" className="mt-3 flex flex-wrap gap-2">
          <PillMenu iconOnly label="Status" icon={<ActivityIcon />} value={status} allLabel="Any status" options={STATUSES.map(s => ({ value: s, label: s }))} onChange={setStatus} />
          <PillMenu iconOnly label="Date" icon={<CalendarIcon />} value={range} allLabel="Any time" options={DATE_OPTIONS} onChange={setRange} />
          <PillMenu iconOnly label="Person" icon={<PersonIcon />} value={person} allLabel="Anyone" options={people.map(p => ({ value: p, label: p }))} onChange={setPerson} />
          <PillButton icon={<VideoIcon />} tooltip="Has a Zoom meeting" ariaLabel="Has a Zoom meeting" ariaPressed={meeting} active={meeting} onClick={() => setMeeting(m => !m)} />
          <PillButton icon={<ShieldIcon />} tooltip="Awaiting Incident Commander" ariaLabel="Awaiting Incident Commander" ariaPressed={awaitingIc} active={awaitingIc} onClick={() => setAwaitingIc(v => !v)} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-t border-line" aria-live="polite">
        {!searching ? (
          <p className="px-5 py-8 text-center text-[14px] text-muted">Enter a keyword or pick a filter to find incidents in # {channel}.</p>
        ) : !results.length ? (
          <p className="px-5 py-8 text-center text-[14px] text-muted">No incidents found. Try another keyword or filter.</p>
        ) : (
          <>
            <p className="px-5 pt-3 pb-1 text-[13px] font-semibold text-muted">{plural(results.length, 'result')}</p>
            {results.map(i => (
              <ListItemButton key={i.id} onClick={() => onJump(i.id)} sx={{ display: 'block', px: 2.5, py: 1.5 }}>
                <span className="flex items-center gap-2 text-[13px] text-muted">
                  <code className="font-semibold">{i.id}</code>
                  <StatusChip status={i.status} />
                  <span className="ml-auto">{formatDate(i.date)}</span>
                </span>
                <strong className="mt-1 block text-[15px] font-semibold">{i.title}</strong>
                <span className="line-clamp-2 text-[13.5px] text-muted">{i.summary}</span>
              </ListItemButton>
            ))}
          </>
        )}
      </div>
    </aside>
  )
}

export function ChannelView() {
  const app = useApp()
  const demo = useDemoLink()
  const [tab, setTab] = useState<ChannelTab>('posts')
  const [findOpen, setFindOpen] = useState(false)
  const [flashId, setFlashId] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const ref = app.channel!
  const group = app.groups.find(g => g.name === ref.team)
  const channel = group?.channels.find(c => c.name === ref.channel)
  const all = incidentsInChannel(app.incidents, ref)
  const openCount = all.filter(isOpen).length
  // Chat order: oldest at the top, newest just above the composer.
  const feed = sortIncidents(all.filter(i => tab === 'posts' || isOpen(i)), { key: 'date', dir: 'asc' })

  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [tab, app.refreshing])

  const jump = (id: string) => {
    setTab('posts')
    requestAnimationFrame(() => document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    setFlashId(id)
    window.setTimeout(() => setFlashId(f => (f === id ? null : f)), 1800)
  }

  let lastDay = ''
  return (
    <section aria-labelledby="channel-title" className="relative flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex-none border-b border-line bg-paper px-4 sm:px-5">
          <div className="flex h-14 items-center gap-3">
            <span aria-hidden className={`grid size-8 flex-none place-items-center rounded-md text-[11px] font-bold text-white ${teamTint(app.groups.findIndex(g => g.name === ref.team))}`}>
              {initials(ref.team)}
            </span>
            <div className="min-w-0">
              <h1 id="channel-title" className="truncate text-[17px] font-semibold tracking-tight">
                <span className="text-muted">#</span> {ref.channel}
              </h1>
              <p className="truncate text-xs text-muted">{ref.team}</p>
            </div>
            {channel && (
              <Chip
                size="small"
                variant="outlined"
                label={channel.enabled ? 'Monitored' : 'Not added to bot'}
                color={channel.enabled ? 'success' : 'default'}
                className={`max-md:hidden! ${channel.enabled ? 'tint-resolved' : ''}`}
                sx={{ height: 22, fontSize: 12 }}
              />
            )}
            <div className="ml-auto flex items-center gap-1">
              <Tooltip title="Find in channel">
                <IconButton aria-label={`Find in # ${ref.channel}`} aria-expanded={findOpen} onClick={() => setFindOpen(o => !o)} color={findOpen ? 'primary' : 'default'}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <ViewActions />
            </div>
          </div>
          <Tabs value={tab} onChange={(_, v: ChannelTab) => setTab(v)} aria-label="Channel tabs" sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0, px: 1.5, fontSize: 14.5 } }}>
            <Tab value="posts" label={`Posts (${all.length})`} />
            <Tab value="open" label={`Open (${openCount})`} />
          </Tabs>
        </header>

        <div ref={feedRef} className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6" aria-live="polite" aria-busy={app.refreshing}>
          <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
            {app.refreshing ? (
              <BoardSkeleton />
            ) : !feed.length ? (
              <EmptyState icon={<ChatIcon />} title={tab === 'open' ? 'No open incidents' : 'No incidents in this channel yet'}>
                OpsPilot posts a card here whenever an incident is raised in this channel.
              </EmptyState>
            ) : (
              feed.map(i => {
                const newDay = i.date !== lastDay
                lastDay = i.date
                return (
                  <Fragment key={i.id}>
                    {newDay && (
                      <div role="separator" className="flex items-center gap-3 text-[13px] font-medium text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
                        {formatDate(i.date)}
                      </div>
                    )}
                    <article
                      id={`post-${i.id}`}
                      aria-label={`Post: ${i.id}`}
                      className={`flex scroll-m-6 gap-3 rounded-xl transition-shadow duration-500 ${flashId === i.id ? 'ring-2 ring-primary ring-offset-4 ring-offset-canvas' : ''}`}
                    >
                      <BrandMark size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2 text-[13.5px]">
                          <strong className="text-[15px]">OpsPilot</strong>
                          <span className="rounded border border-line px-1 text-[11px] font-semibold text-muted uppercase">App</span>
                          <span className="text-muted">posted {i.id}</span>
                        </div>
                        <IncidentCard incident={i} />
                      </div>
                    </article>
                  </Fragment>
                )
              })
            )}
          </div>
        </div>

        <footer className="flex-none border-t border-line bg-paper px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 rounded-md border border-line px-3 py-2 text-[14px] text-muted subtle-bg">
            <InfoIcon sx={{ fontSize: 18 }} />
            <span className="flex-1">Incidents are posted here automatically by OpsPilot. Reply in Microsoft Teams to collaborate.</span>
            <Button size="small" variant="outlined" color="inherit" startIcon={<ChatIcon />} href={`#teams-channel-${ref.channel}`} onClick={demo(`Teams channel # ${ref.channel}`)}>
              Open in Teams
            </Button>
          </div>
        </footer>
      </div>

      {findOpen && <FindPanel incidents={all} channel={ref.channel} onClose={() => setFindOpen(false)} onJump={jump} />}
    </section>
  )
}
