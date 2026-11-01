import Card from '@mui/material/Card'
import Link from '@mui/material/Link'
import { Person, StatusChip } from '../../components/ui'
import { sortIncidents } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Incident } from '../../types'

export function IncidentCard({ incident: i }: { incident: Incident }) {
  const app = useApp()

  return (
    <Card
      component="article"
      aria-labelledby={`inc-${i.id}`}
      className="flex h-full flex-col gap-7.5 p-6 transition-shadow hover:shadow-md"
    >
      <header className="flex items-center justify-between gap-2">
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => app.openChannel({ team: i.team, channel: i.channel })}
          title={`Open # ${i.channel}`}
          className="min-w-0 truncate text-[11px]! font-medium! text-muted!"
        >
          # {i.channel}
        </Link>
        <StatusChip status={i.status} />
      </header>
      <div className="flex-1">
        <Link
          id={`inc-${i.id}`}
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => app.setOpenIncidentId(i.id)}
          className="mb-1 block text-left text-[16.5px]! leading-snug font-semibold! hover:text-primary!"
        >
          {i.title}
        </Link>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted text-justify">{i.summary}</p>
      </div>
      <footer className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <div className="min-w-0 text-[13px]">
          {/*
          <span className="mr-1.5 text-muted">By</span>
          */}
          <Person name={i.creator} />
        </div>
        {/*
        <Button size="small" color="inherit" startIcon={<EyeIcon />} onClick={() => app.setOpenIncidentId(i.id)} aria-label={`View details for ${i.id}`}>
          View details
        </Button>
        */}
      </footer>
    </Card>
  )
}

/** One card per incident, newest first. */
export function IncidentBoard({ data }: { data: Incident[] }) {
  return (
    <div className="grid gap-4.5 sm:grid-cols-2 xl:grid-cols-3">
      {sortIncidents(data, { key: 'date', dir: 'desc' }).map(i => (
        <IncidentCard key={i.id} incident={i} />
      ))}
    </div>
  )
}
