import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Link from '@mui/material/Link'
import type { CSSProperties } from 'react'
import { CalendarIcon, ChatIcon, EyeIcon, GroupsIcon } from '../../components/icons'
import { Person, StatusChip, ZoomLink, useDemoLink } from '../../components/ui'
import { formatDate, sortIncidents, statusTone, toneVar } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Incident } from '../../types'

function IncidentCard({ incident: i }: { incident: Incident }) {
  const app = useApp()
  const demo = useDemoLink()
  const channel = app.groups.find(g => g.name === i.team)?.channels.find(c => c.name === i.channel)
  const accent: CSSProperties = { ['--s' as string]: toneVar[statusTone(i.status)] }

  return (
    <Card
      component="article"
      aria-labelledby={`inc-${i.id}`}
      style={accent}
      className="relative flex h-full flex-col transition-shadow before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-[3px] before:bg-(--s) hover:shadow-md"
    >
      <header className="flex flex-wrap items-center gap-2.5 border-b border-line py-2.5 pr-3.5 pl-4.5 text-xs subtle-bg">
        <span className="text-[13px] font-semibold">
          <b className="font-medium text-muted">#</b> {i.channel}
        </span>
        <span className="mr-auto inline-flex items-center gap-1 text-muted">
          <GroupsIcon sx={{ fontSize: 14 }} />
          {i.team}
        </span>
        {channel && (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
            <span className={`size-2 rounded-full ${channel.enabled ? 'bg-st-resolved' : 'bg-line'}`} />
            {channel.enabled ? 'Monitored' : 'Not added'}
          </span>
        )}
      </header>

      <div className="flex-1 pt-3.5 pr-4 pb-3.5 pl-4.5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <code className="text-xs font-semibold text-muted">{i.id}</code>
          <StatusChip status={i.status} />
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
            <CalendarIcon sx={{ fontSize: 13 }} />
            {formatDate(i.date)}
          </span>
        </div>
        <Link
          id={`inc-${i.id}`}
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => app.setOpenIncidentId(i.id)}
          className="mb-1 block text-left text-[15.5px]! leading-snug font-semibold! tracking-tight hover:text-primary!"
        >
          {i.title}
        </Link>
        <p className="text-[13px] leading-relaxed text-muted">{i.summary}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-3">
          <div>
            <dt className="text-[10.5px] font-semibold tracking-[.07em] text-muted uppercase">Reported by</dt>
            <dd className="mt-1 text-[13px]"><Person name={i.creator} /></dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-semibold tracking-[.07em] text-muted uppercase">Incident Commander</dt>
            <dd className="mt-1 text-[13px]"><Person name={i.ic} /></dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10.5px] font-semibold tracking-[.07em] text-muted uppercase">Meeting</dt>
            <dd className="mt-1"><ZoomLink incident={i} /></dd>
          </div>
        </dl>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2 pr-3.5 pl-4.5">
        <Button size="small" color="inherit" startIcon={<EyeIcon />} onClick={() => app.setOpenIncidentId(i.id)} aria-label={`View details for ${i.id}`}>
          View details
        </Button>
        <Button size="small" variant="outlined" color="inherit" startIcon={<ChatIcon />} href={i.link} onClick={demo(`Teams thread for ${i.id}`)}>
          Open Teams thread
        </Button>
      </footer>
    </Card>
  )
}

/** One card per incident, newest first. */
export function IncidentBoard({ data }: { data: Incident[] }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
      {sortIncidents(data, { key: 'date', dir: 'desc' }).map(i => (
        <IncidentCard key={i.id} incident={i} />
      ))}
    </div>
  )
}
