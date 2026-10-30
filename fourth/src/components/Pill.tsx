import ButtonBase from '@mui/material/ButtonBase'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import { useState, type ReactNode } from 'react'
import { CheckIcon, CloseIcon, ExpandMoreIcon } from './icons'

interface PillButtonProps {
  label?: ReactNode
  icon?: ReactNode
  active?: boolean
  chevron?: boolean
  tooltip?: string
  ariaLabel?: string
  ariaPressed?: boolean
  onClick: (el: HTMLElement) => void
}

export function PillButton({ label, icon, active, chevron, tooltip, ariaLabel, ariaPressed, onClick }: PillButtonProps) {
  const btn = (
    <ButtonBase
      className="pill"
      data-active={!!active}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onClick={e => onClick(e.currentTarget)}
      sx={{ '& svg': { fontSize: 18 } }}
    >
      {icon}
      {label}
      {chevron && <ExpandMoreIcon sx={{ fontSize: '16px !important' }} />}
    </ButtonBase>
  )
  return tooltip ? <Tooltip title={tooltip}>{btn}</Tooltip> : btn
}

export interface PillOption {
  value: string
  label: string
}

/** Pill that opens a single-select menu; '' is the "all" option. */
export function PillMenu({ label, icon, value, options, allLabel, onChange, iconOnly }: { label: string; icon?: ReactNode; value: string; options: PillOption[]; allLabel: string; onChange: (v: string) => void; iconOnly?: boolean }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const current = options.find(o => o.value === value)
  const choose = (v: string) => {
    onChange(v)
    setAnchor(null)
  }
  return (
    <>
      <PillButton
        icon={icon}
        label={iconOnly ? undefined : current ? current.label : label}
        active={!!value}
        chevron
        tooltip={iconOnly ? (current ? `${label}: ${current.label}` : label) : undefined}
        ariaLabel={current ? `${label}: ${current.label}` : label}
        onClick={setAnchor}
      />
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { minWidth: 200, mt: 0.5 } } }}>
        {[{ value: '', label: allLabel }, ...options].map(o => (
          <MenuItem key={o.value} selected={o.value === value} onClick={() => choose(o.value)}>
            <ListItemText>{o.label}</ListItemText>
            {o.value === value && <CheckIcon fontSize="small" color="primary" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export function DatePill({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (v: string) => void }) {
  return (
    <label className="pill cursor-pointer" data-active={!!value}>
      {label}
      <input type="date" value={value} min={min} max={max} onChange={e => onChange(e.target.value)} aria-label={`${label} date`} />
      {value && (
        <button type="button" aria-label={`Clear ${label} date`} onClick={() => onChange('')} className="grid place-items-center rounded-full opacity-80 hover:opacity-100">
          <CloseIcon sx={{ fontSize: 15 }} />
        </button>
      )}
    </label>
  )
}
