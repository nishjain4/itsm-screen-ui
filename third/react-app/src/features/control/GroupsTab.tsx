import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import { AddIcon, CheckIcon, GroupsIcon, TuneIcon } from '../../components/icons'
import { SectionTitle } from '../../components/ui'
import { useApp } from '../../state/AppState'

export function GroupsTab({ onManage }: { onManage: (groupId: string) => void }) {
  const app = useApp()

  return (
    <div className="flex flex-1 flex-col">
      <SectionTitle title="Service groups" description="Groups connected to OpsPilot and available for monitoring." />
      <div role="list" aria-label="Connected service groups" className="divide-y divide-line rounded-xl border border-line bg-paper">
        {app.groups.map(g => {
          const monitored = g.channels.filter(c => c.enabled).length
          return (
            <article key={g.id} role="listitem" className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-3 lg:w-64 lg:flex-none">
                <span className="tint-primary grid size-10 flex-none place-items-center rounded-lg">
                  <GroupsIcon fontSize="small" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium">{g.name}</div>
                  <small className="block truncate text-xs text-muted">Group ID: {g.teamId}</small>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 text-xs font-medium text-muted">Channels · {g.channels.length}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.channels.map(c => (
                    <span
                      key={c.name}
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] ${
                        c.enabled ? 'border-st-resolved bg-st-resolved/10 text-st-resolved' : 'border-line bg-hover text-muted'
                      }`}
                    >
                      # {c.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 sm:justify-start lg:border-0 lg:pt-0">
                <Chip
                  size="small"
                  variant="outlined"
                  color={monitored ? 'success' : 'default'}
                  icon={monitored ? <CheckIcon /> : undefined}
                  label={`${monitored}/${g.channels.length} monitored`}
                  className={monitored ? 'tint-resolved' : ''}
                />
                <div className="flex gap-2 lg:ml-auto">
                  <Button variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={() => onManage(g.id)} size="small">
                    Manage
                  </Button>
                  <Button variant="outlined" color="inherit" startIcon={<TuneIcon />} onClick={() => app.jumpToPolicies(g.id)} size="small">
                    Settings
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
