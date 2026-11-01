import Chip from '@mui/material/Chip'
import { EmptyState } from '../../components/ui'
import { incidentsInChannel, initials, teamTint } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import { IncidentTable } from './IncidentTable'
import { BoardSkeleton, ViewActions } from './ViewParts'

export function ChannelView() {
  const app = useApp()
  const ref = app.channel!
  const group = app.groups.find(g => g.name === ref.team)
  const channel = group?.channels.find(c => c.name === ref.channel)
  const data = incidentsInChannel(app.incidents, ref)

  return (
    <section aria-labelledby="channel-title" className="flex h-full flex-col">
      <header className="flex h-14 flex-none items-center gap-3 border-b border-line bg-paper px-4 sm:px-5">
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
          <ViewActions />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5">
        <div className="mx-auto max-w-[1920px]">
          {app.refreshing ? (
            <BoardSkeleton />
          ) : !data.length ? (
            <EmptyState title="No incidents in this channel yet">
              There are no incidents for this channel right now.
            </EmptyState>
          ) : (
            <IncidentTable data={data} />
          )}
        </div>
      </div>
    </section>
  )
}
