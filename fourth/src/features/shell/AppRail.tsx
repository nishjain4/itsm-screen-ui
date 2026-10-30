import ButtonBase from '@mui/material/ButtonBase'
import Tooltip from '@mui/material/Tooltip'
import type { ReactNode } from 'react'
import { GroupsIcon, TuneIcon } from '../../components/icons'
import { isOpen } from '../../lib/utils'
import { useApp, useDirtyCount } from '../../state/AppState'
import { Notifications, ThemeMenu, UserMenu } from './AccountControls'

function RailItem({ label, icon, selected, badge, onClick, hint }: { label: string; icon: ReactNode; selected?: boolean; badge?: ReactNode; onClick: () => void; hint?: string }) {
  return (
    <Tooltip title={hint ?? label} placement="right">
      <ButtonBase
        onClick={onClick}
        aria-current={selected ? 'page' : undefined}
        aria-label={label}
        className={`relative flex! h-14 w-full flex-col! gap-0.5 rounded-md! text-[11.5px] transition-colors ${selected ? 'font-semibold text-primary' : 'text-muted hover:text-fg'}`}
      >
        {selected && <span aria-hidden className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r bg-primary" />}
        <span className="relative">
          {icon}
          {badge}
        </span>
        {label}
      </ButtonBase>
    </Tooltip>
  )
}

/** Teams-style vertical app bar. */
export function AppRail({ onLeave }: { onLeave: (signOut: boolean) => void }) {
  const app = useApp()
  const dirty = useDirtyCount()
  const admin = app.role === 'admin'
  const open = app.incidents.filter(isOpen).length

  return (
    <nav aria-label="Apps" className="flex w-[68px] flex-none flex-col items-center gap-1 border-r border-line px-1 py-2 chrome-bg">
      {admin ? (
        <RailItem
          label="Control"
          hint="Control room"
          icon={<TuneIcon />}
          selected={app.page === 'control'}
          onClick={() => app.goTo('control')}
          badge={dirty > 0 && <span title="Unsaved policy changes" className="absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-paper bg-st-monitoring" />}
        />
      ) : (
        <RailItem
          label="Teams"
          hint="Incidents by team"
          icon={<GroupsIcon />}
          selected={app.page === 'console'}
          onClick={() => app.goTo('console')}
          badge={
            open > 0 && (
              <span aria-label={`${open} open incidents`} className="absolute -top-1.5 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-st-active px-1 text-[10px] font-semibold text-white">
                {open}
              </span>
            )
          }
        />
      )}
      <div className="mt-auto flex w-full flex-col items-center gap-1.5 border-t border-line pt-2">
        <Notifications />
        <ThemeMenu />
        <UserMenu onLeave={onLeave} />
      </div>
    </nav>
  )
}
