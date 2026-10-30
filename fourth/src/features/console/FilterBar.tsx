import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { ActivityIcon, FilterIcon, PersonIcon, SearchIcon } from '../../components/icons'
import { DatePill, PillMenu } from '../../components/Pill'
import { CREATORS, STATUSES } from '../../data/mock'
import { formatDate } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Filters, IncidentStatus } from '../../types'

const LABELS: Record<keyof Filters, string> = { query: 'Search', from: 'From', to: 'To', creator: 'Creator', scope: 'Scope', status: 'Status' }
const PANEL_KEYS = ['from', 'to', 'creator', 'status'] as const

export function FilterBar() {
  const { filters, setFilters, clearFilters } = useApp()
  const [open, setOpen] = useState(false)
  const any = Object.values(filters).some(Boolean)
  const panelCount = PANEL_KEYS.filter(k => filters[k]).length

  return (
    <div>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <div
          role="search"
          aria-label="Search and filter incidents"
          className="relative"
          onKeyDown={e => {
            if (e.key === 'Escape') setOpen(false)
          }}
        >
          <TextField
            id="incident-search"
            type="search"
            fullWidth
            placeholder="Search by ID, title, person, channel…"
            value={filters.query}
            onChange={e => setFilters({ query: e.target.value })}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: open ? '10px 10px 0 0' : '10px', height: 46 },
              '& .MuiOutlinedInput-notchedOutline': open ? { borderColor: 'primary.main', borderBottomColor: 'divider' } : {},
            }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20 }} /></InputAdornment>,
                endAdornment: panelCount > 0 && (
                  <InputAdornment position="end">
                    <Chip size="small" icon={<FilterIcon />} label={`${panelCount} filter${panelCount > 1 ? 's' : ''}`} className="tint-primary" />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search incidents', 'aria-expanded': open, 'aria-controls': 'search-filters', autoComplete: 'off' },
            }}
          />
          {open && (
            <div
              id="search-filters"
              aria-label="Filters"
              className="absolute inset-x-0 top-full z-20 -mt-px flex flex-wrap items-center gap-2 rounded-b-[10px] border border-t-0 border-primary bg-paper px-3.5 py-3 shadow-lg"
            >
              <DatePill label="From" value={filters.from} max={filters.to || undefined} onChange={v => setFilters({ from: v })} />
              <DatePill label="To" value={filters.to} min={filters.from || undefined} onChange={v => setFilters({ to: v })} />
              <PillMenu
                label="Created by"
                icon={<PersonIcon />}
                value={filters.creator}
                allLabel="All creators"
                options={CREATORS.map(c => ({ value: c, label: c }))}
                onChange={v => setFilters({ creator: v })}
              />
              <PillMenu
                label="Status"
                icon={<ActivityIcon />}
                value={filters.status}
                allLabel="All statuses"
                options={STATUSES.map(s => ({ value: s, label: s }))}
                onChange={v => setFilters({ status: v as IncidentStatus | '' })}
              />
              {any && (
                <Button size="small" onClick={clearFilters} className="ml-auto!">
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>
      </ClickAwayListener>
      {any && (
        <div aria-label="Active filters" className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <span>Active filters</span>
          {(Object.keys(filters) as (keyof Filters)[])
            .filter(k => filters[k])
            .map(k => {
              const v = filters[k]
              const shown = k === 'from' || k === 'to' ? formatDate(v) : v
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
    </div>
  )
}
