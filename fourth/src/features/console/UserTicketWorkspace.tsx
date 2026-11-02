import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import { useState } from 'react'
import { ActivityIcon, DashboardIcon, RefreshIcon, SearchIcon } from '../../components/icons'
import { EmptyState, Person, StatusChip } from '../../components/ui'
import { formatDate, plural, sortIncidents } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Incident } from '../../types'
import { FocusedTicket, HoverProgress, useHoverFocus } from './HoverFocus'
import { TicketStatusBoard } from './TicketStatusBoard'

function TicketCard({ incident, owned, onOpen, onFocus }: { incident: Incident; owned: boolean; onOpen: () => void; onFocus: () => void }) {
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
      aria-label={`View details for ${incident.id}: ${incident.title}`}
      className="relative flex! w-full! cursor-pointer flex-col! items-stretch! gap-4 overflow-hidden p-5! text-left! transition duration-300 hover:z-10 hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-xs font-semibold">{incident.id}/{incident.channel}</code>
        <StatusChip status={incident.status} />
        <span className="ml-auto text-xs text-muted">Raised {formatDate(incident.date)}</span>
      </div>
      <div>
        <h2 className="text-[16px] font-semibold leading-snug">{incident.title}</h2>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{incident.summary}</p>
      </div>
      <footer className="mt-auto flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
        {owned ? (
          <span>By me</span>
        ) : (
          <>
            <span>Reported by</span>
            <Person name={incident.creator} size={20} />
          </>
        )}
      </footer>
      <HoverProgress arming={arming} />
    </Card>
  )
}

export function UserTicketWorkspace() {
  const app = useApp()
  const [showAll, setShowAll] = useState(false)
  const [focused, setFocused] = useState<Incident | null>(null)
  const owned = sortIncidents(
    app.incidents.filter(incident => incident.creator === app.profile?.name),
    { key: 'date', dir: 'desc' },
  )

  if (showAll) return <TicketStatusBoard onBack={() => setShowAll(false)} backLabel="My tickets" />

  return (
    <section aria-labelledby="ticket-list-title" className="flex h-full flex-col">
      <header className="flex min-h-14 flex-none flex-wrap items-center gap-3 border-b border-line bg-paper px-4 py-2 sm:px-6">
        <div className="min-w-0">
          <h1 id="ticket-list-title" className="truncate text-[17px] font-semibold tracking-tight">My tickets</h1>
          <p className="truncate text-xs text-muted">{plural(owned.length, 'ticket')} reported by you</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={app.refresh}
            disabled={app.refreshing}
          >
            Refresh
          </Button>
          <Button variant="contained" size="small" disableElevation startIcon={<DashboardIcon />} onClick={() => setShowAll(true)}>
            See all tickets
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-[1080px]">
          {app.refreshing ? (
            <EmptyState icon={<ActivityIcon />} title="Refreshing tickets">
              Checking for the latest incident updates.
            </EmptyState>
          ) : !owned.length ? (
            <EmptyState
              icon={<SearchIcon />}
              title="No tickets owned by you"
              action={<Button variant="outlined" color="inherit" size="small" onClick={() => setShowAll(true)}>See all tickets</Button>}
            >
              Tickets you report will appear here with their summary and current status.
            </EmptyState>
          ) : (
            <div aria-live="polite" className="grid gap-3 md:grid-cols-2">
              {owned.map(incident => (
                <TicketCard
                  key={incident.id}
                  incident={incident}
                  owned
                  onOpen={() => app.setOpenIncidentId(incident.id)}
                  onFocus={() => setFocused(incident)}
                />
              ))}
            </div>
          )}
        </div>
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
