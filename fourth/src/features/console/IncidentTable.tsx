import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Tooltip from '@mui/material/Tooltip'
import { ExternalIcon } from '../../components/icons'
import { Person, StatusChip, useDemoLink } from '../../components/ui'
import { formatDate, plural, sortIncidents } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Incident, SortKey } from '../../types'

const COLS: [SortKey, string][] = [
  ['id', 'ID'],
  ['title', 'Incident'],
  ['status', 'Status'],
  ['creator', 'Reported by'],
  ['date', 'Date'],
]

export function IncidentTable({ data }: { data: Incident[] }) {
  const app = useApp()
  const demo = useDemoLink()
  const { sort } = app
  const rows = sortIncidents(data, sort)
  const onSort = (key: SortKey) =>
    app.setSort({ key, dir: sort.key === key ? (sort.dir === 'asc' ? 'desc' : 'asc') : key === 'date' ? 'desc' : 'asc' })

  return (
    <Card>
      <TableContainer>
        <Table size="small" sx={{ minWidth: 860, '& td': { py: 1.25, whiteSpace: 'nowrap' } }}>
          <caption className="sr-only">
            Incidents, sorted by {sort.key} {sort.dir === 'asc' ? 'ascending' : 'descending'}
          </caption>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'action.hover', color: 'text.secondary', fontSize: 13.5 } }}>
              {COLS.map(([key, label]) => (
                <TableCell key={key} sortDirection={sort.key === key ? sort.dir : false}>
                  <TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.dir : 'asc'} onClick={() => onSort(key)}>
                    {label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>
                <span className="sr-only">Actions</span>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(i => (
              <TableRow key={i.id} hover>
                <TableCell><code className="text-xs">{i.id}</code></TableCell>
                <TableCell sx={{ whiteSpace: 'normal !important', minWidth: 240 }}>
                  <Link component="button" underline="hover" color="inherit" onClick={() => app.setOpenIncidentId(i.id)} className="text-left font-medium! hover:text-primary!">
                    {i.title}
                  </Link>
                  <Link component="button" underline="hover" color="textSecondary" onClick={() => app.filterByChannel(i.channel)} className="block text-xs!">
                    # {i.channel}
                  </Link>
                </TableCell>
                <TableCell><StatusChip status={i.status} /></TableCell>
                <TableCell><Person name={i.creator} /></TableCell>
                <TableCell className="text-xs!">{formatDate(i.date)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Open Teams thread">
                    <IconButton size="small" component="a" href={i.link} onClick={demo(`Teams thread for ${i.id}`)} aria-label={`Open ${i.id} Teams thread`}>
                      <ExternalIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div className="flex justify-between border-t border-line px-3.5 py-2.5 text-xs text-muted subtle-bg">
        <span>
          Showing {plural(rows.length, 'incident')} of {app.incidents.length}
        </span>
        <span className="max-sm:hidden">Select a column header to sort</span>
      </div>
    </Card>
  )
}
