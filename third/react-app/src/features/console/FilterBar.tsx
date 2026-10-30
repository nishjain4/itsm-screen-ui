import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import ListSubheader from '@mui/material/ListSubheader'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import type { ReactNode } from 'react'
import { ActivityIcon, PersonIcon, SearchIcon, TagIcon } from '../../components/icons'
import { CREATORS, STATUSES } from '../../data/mock'
import { formatDate } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Filters, IncidentStatus } from '../../types'

const LABELS: Record<keyof Filters, string> = { query: 'Search', from: 'From', to: 'To', creator: 'Creator', scope: 'Scope', status: 'Status' }

const activeSx = (on: boolean) => (on ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }, '& .MuiInputAdornment-root': { color: 'primary.main' } } : undefined)
const adorn = (icon: ReactNode) => <InputAdornment position="start" sx={{ color: 'text.secondary', '& svg': { fontSize: 18 } }}>{icon}</InputAdornment>

export function FilterBar() {
  const { filters, setFilters, clearFilters, groups } = useApp()
  const any = Object.values(filters).some(Boolean)
  const scopeLabel = (v: string) => (v.startsWith('channel:') ? '# ' + v.slice(8) : v.slice(5))

  return (
    <Card className="@container p-3">
      <div role="search" aria-label="Filter incidents" className="flex flex-wrap items-center gap-2 @min-[1090px]:flex-nowrap">
        <TextField
          id="incident-search"
          type="search"
          size="small"
          placeholder="Search by ID, title, person, channel…"
          value={filters.query}
          onChange={e => setFilters({ query: e.target.value })}
          className="basis-full @min-[1090px]:min-w-[200px] @min-[1090px]:flex-1 @min-[1090px]:basis-auto"
          sx={activeSx(!!filters.query)}
          slotProps={{
            input: { startAdornment: adorn(<SearchIcon />), endAdornment: <InputAdornment position="end" className="max-sm:hidden!"><kbd aria-hidden>/</kbd></InputAdornment> },
            htmlInput: { 'aria-label': 'Search incidents', autoComplete: 'off' },
          }}
        />
        <TextField
          type="date"
          size="small"
          label="From"
          value={filters.from}
          onChange={e => setFilters({ from: e.target.value })}
          className="w-[calc(50%-4px)] flex-none sm:w-36"
          sx={activeSx(!!filters.from)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.to || undefined } }}
        />
        <TextField
          type="date"
          size="small"
          label="To"
          value={filters.to}
          onChange={e => setFilters({ to: e.target.value })}
          className="w-[calc(50%-4px)] flex-none sm:w-36"
          sx={activeSx(!!filters.to)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.from || undefined } }}
        />
        <TextField
          select
          size="small"
          label="Created by"
          value={filters.creator}
          onChange={e => setFilters({ creator: e.target.value })}
          className="w-[calc(50%-4px)] flex-none sm:w-44"
          sx={activeSx(!!filters.creator)}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true }, input: { startAdornment: adorn(<PersonIcon />) } }}
        >
          <MenuItem value="">All creators</MenuItem>
          {CREATORS.map(c => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Team or channel"
          value={filters.scope}
          onChange={e => setFilters({ scope: e.target.value })}
          className="w-[calc(50%-4px)] flex-none sm:w-52"
          sx={activeSx(!!filters.scope)}
          slotProps={{ select: { displayEmpty: true, renderValue: v => (v ? scopeLabel(String(v)) : 'All teams & channels') }, inputLabel: { shrink: true }, input: { startAdornment: adorn(<TagIcon />) } }}
        >
          <MenuItem value="">All teams &amp; channels</MenuItem>
          <ListSubheader>Teams</ListSubheader>
          {groups.map(g => (
            <MenuItem key={g.id} value={'team:' + g.name}>{g.name}</MenuItem>
          ))}
          <ListSubheader>Channels</ListSubheader>
          {groups.flatMap(g => g.channels.map(c => (
            <MenuItem key={g.id + c.name} value={'channel:' + c.name} sx={{ fontSize: 13 }}># {c.name}</MenuItem>
          )))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={e => setFilters({ status: e.target.value as IncidentStatus | '' })}
          className="w-[calc(50%-4px)] flex-none sm:w-44"
          sx={activeSx(!!filters.status)}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true }, input: { startAdornment: adorn(<ActivityIcon />) } }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUSES.map(s => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </div>
      {any && (
        <div aria-label="Active filters" className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-dashed border-line pt-2.5 text-xs text-muted">
          <span>Active filters</span>
          {(Object.keys(filters) as (keyof Filters)[])
            .filter(k => filters[k])
            .map(k => {
              const v = filters[k]
              const shown = k === 'from' || k === 'to' ? formatDate(v) : k === 'scope' ? scopeLabel(v) : v
              return (
                <Chip
                  key={k}
                  size="small"
                  label={<><span className="text-muted">{LABELS[k]}:</span> {shown}</>}
                  onDelete={() => setFilters({ [k]: '' })}
                  aria-label={`${LABELS[k]}: ${shown}. Press Delete to remove`}
                />
              )
            })}
          <Button size="small" onClick={clearFilters}>Clear all</Button>
        </div>
      )}
    </Card>
  )
}
