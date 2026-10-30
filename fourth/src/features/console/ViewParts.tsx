import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Tooltip from '@mui/material/Tooltip'
import { DownloadIcon, RefreshIcon } from '../../components/icons'
import { useApp } from '../../state/AppState'
import { useExportIncidents } from './useExportIncidents'

export function BoardSkeleton() {
  return (
    <div aria-hidden className="grid gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
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

/** Export + refresh, shown in both the global and channel headers. */
export function ViewActions() {
  const app = useApp()
  const exportCsv = useExportIncidents()
  return (
    <>
      <Tooltip title="Export CSV">
        <IconButton aria-label="Export incidents as CSV" onClick={exportCsv}>
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Refresh">
        <IconButton aria-label="Refresh incidents" onClick={app.refresh} loading={app.refreshing}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  )
}
