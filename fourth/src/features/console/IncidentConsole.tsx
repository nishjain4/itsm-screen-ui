import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { DashboardIcon, GridIcon, ListIcon, SearchIcon } from '../../components/icons'
import { EmptyState } from '../../components/ui'
import { filterIncidents, plural } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { BoardView } from '../../types'
import { ChannelView } from './ChannelView'
import { FilterBar } from './FilterBar'
import { IncidentBoard } from './IncidentBoard'
import { IncidentTable } from './IncidentTable'
import { BoardSkeleton, ViewActions } from './ViewParts'

function GlobalView() {
  const app = useApp()
  const data = filterIncidents(app.incidents, app.filters)
  const channels = new Set(data.map(i => i.team + '|||' + i.channel)).size

  return (
    <section aria-labelledby="console-title" className="flex h-full flex-col">
      <header className="flex h-14 flex-none items-center gap-3 border-b border-line bg-paper px-4 sm:px-5">
        <span aria-hidden className="grid size-8 flex-none place-items-center rounded-md tint-primary">
          <DashboardIcon sx={{ fontSize: 18 }} />
        </span>
        <div className="min-w-0">
          <h1 id="console-title" className="truncate text-[17px] font-semibold tracking-tight">All incidents</h1>
          <p className="truncate text-xs text-muted" aria-live="polite">
            {plural(data.length, 'incident')} across {plural(channels, 'channel')}
          </p>
        </div>
        <Chip
          size="small"
          label="Live"
          icon={<span className="ml-2! size-1.5 animate-pulse-soft rounded-full bg-current" />}
          className="tint-resolved uppercase max-sm:hidden!"
          sx={{ height: 20, fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em' }}
        />
        <div className="ml-auto flex items-center gap-1">
          <ViewActions />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5">
        <div className="mx-auto max-w-[1920px]">
          <div className="mb-4 flex items-start gap-3">
            <div className="min-w-0 flex-1 sm:max-w-[560px]">
              <FilterBar />
            </div>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={app.view}
              onChange={(_, v: BoardView | null) => v && app.setView(v)}
              aria-label="View"
              className="ml-auto flex-none"
              sx={{ height: 46, '& .MuiToggleButton-root': { textTransform: 'none', gap: 0.75, px: 1.5, fontSize: 14 } }}
            >
              <ToggleButton value="board" aria-label="Board view">
                <GridIcon sx={{ fontSize: 16 }} /> <span className="max-sm:hidden">Board</span>
              </ToggleButton>
              <ToggleButton value="table" aria-label="Table view">
                <ListIcon sx={{ fontSize: 16 }} /> <span className="max-sm:hidden">Table</span>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>

          <div aria-live="polite" aria-busy={app.refreshing}>
            {app.refreshing ? (
              <BoardSkeleton />
            ) : !data.length ? (
              <EmptyState
                icon={<SearchIcon />}
                title="No incidents match these filters"
                action={<Button variant="outlined" color="inherit" size="small" onClick={app.clearFilters}>Reset filters</Button>}
              >
                Try a wider date range or reset your filters.
              </EmptyState>
            ) : app.view === 'board' ? (
              <IncidentBoard data={data} />
            ) : (
              <IncidentTable data={data} />
            )}
          </div>
          
        </div>
      </div>
    </section>
  )
}

export function IncidentConsole() {
  const { channel } = useApp()
  return channel ? <ChannelView key={channel.team + '/' + channel.channel} /> : <GlobalView />
}
