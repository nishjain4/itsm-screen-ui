import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { DownloadIcon, GridIcon, ListIcon, RefreshIcon, SearchIcon } from '../../components/icons'
import { EmptyState } from '../../components/ui'
import { filterIncidents, plural } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { BoardView } from '../../types'
import { CoveragePanel } from './CoveragePanel'
import { FilterBar } from './FilterBar'
import { IncidentBoard } from './IncidentBoard'
import { IncidentTable } from './IncidentTable'
import { useExportIncidents } from './useExportIncidents'

function BoardSkeleton() {
  return (
    <div aria-hidden className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
      {[0, 1, 2, 3].map(n => (
        <Card key={n} className="grid gap-2.5 p-4">
          <Skeleton width="40%" />
          <Skeleton width="85%" height={24} />
          <Skeleton />
          <Skeleton width="70%" />
        </Card>
      ))}
    </div>
  )
}

export function IncidentConsole() {
  const app = useApp()
  const exportCsv = useExportIncidents()
  const data = filterIncidents(app.incidents, app.filters)
  const channels = new Set(data.map(i => i.team + '|||' + i.channel)).size
  const empty = data.length === 0

  return (
    <section aria-labelledby="console-title">
      <h1 id="console-title" className="sr-only">Incident console</h1>
      {/* Container query: one row when filters + actions fit; otherwise actions sit top-right
          and the filter card gets the full width so its own controls stay on one line. */}
      <div className="@container mb-4.5">
        <div className="flex flex-col gap-3 @min-[1370px]:flex-row @min-[1370px]:items-center">
          <div className="min-w-0 @min-[1370px]:flex-1">
            <FilterBar />
          </div>
          <div className="order-first flex flex-none items-center gap-2.5 self-end @min-[1370px]:order-none @min-[1370px]:self-auto">
            <Button variant="outlined" color="inherit" startIcon={<DownloadIcon />} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={app.refresh} loading={app.refreshing} loadingPosition="start">
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-semibold tracking-tight">Incident board</h2>
                <Chip
                  size="small"
                  label="Live"
                  icon={<span className="ml-2! size-1.5 animate-pulse-soft rounded-full bg-current" />}
                  className="tint-resolved uppercase"
                  sx={{ height: 20, fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em' }}
                />
              </div>
              <p className="text-[13px] text-muted" aria-live="polite">
                {plural(data.length, 'incident')} across {plural(channels, 'channel')}
              </p>
            </div>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={app.view}
              onChange={(_, v: BoardView | null) => v && app.setView(v)}
              aria-label="View"
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', gap: 0.75, px: 1.5, fontSize: 12.5 } }}
            >
              <ToggleButton value="board" aria-label="Board view">
                <GridIcon sx={{ fontSize: 16 }} /> Board
              </ToggleButton>
              <ToggleButton value="table" aria-label="Table view">
                <ListIcon sx={{ fontSize: 16 }} /> Table
              </ToggleButton>
            </ToggleButtonGroup>
          </div>

          <div aria-live="polite" aria-busy={app.refreshing}>
            {app.refreshing ? (
              <BoardSkeleton />
            ) : empty ? (
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
          <p className="mt-2.5 text-xs text-muted">
            Each card is one incident, newest first. Sample records are illustrative; production data should come from the authorized backend.
          </p>
        </div>
        <CoveragePanel />
      </div>
    </section>
  )
}
