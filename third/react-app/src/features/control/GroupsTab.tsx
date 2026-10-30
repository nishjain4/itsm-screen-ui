import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import { AddIcon, CheckIcon, GroupsIcon, TuneIcon } from '../../components/icons'
import { SectionTitle } from '../../components/ui'
import { useApp } from '../../state/AppState'

export function GroupsTab({ onManage }: { onManage: (groupId: string) => void }) {
  const app = useApp()
  return (
    <div className="flex flex-1 flex-col">
      <SectionTitle title="Teams groups connected to OpsPilot" description="Only groups where the bot is installed and has access appear here." />
      {/* flex-1 + auto-rows-fr: cards stretch to fill the remaining page height. */}
      <div className="grid flex-1 auto-rows-fr gap-4 md:grid-cols-[repeat(auto-fit,minmax(360px,1fr))]">
        {app.groups.map(g => (
          <Card key={g.id} component="article" aria-labelledby={`grp-${g.id}`} className="flex h-full min-h-[340px] flex-col transition-shadow hover:shadow-md">
            <header className="flex items-center gap-4 border-b border-line px-5 pt-5 pb-4">
              <span className="tint-primary grid size-12 flex-none place-items-center rounded-xl">
                <GroupsIcon />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id={`grp-${g.id}`} className="truncate text-lg leading-snug font-semibold tracking-tight">{g.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <small className="text-xs whitespace-nowrap text-muted">Team ID: {g.teamId}</small>
                  <Chip size="small" variant="outlined" color="success" icon={<CheckIcon />} label="Bot installed" className="tint-resolved" />
                </div>
              </div>
            </header>

            <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
              <span className="mb-2.5 text-[11px] font-semibold tracking-[.08em] text-muted uppercase">Channel monitoring</span>
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                {g.channels.map(c => (
                  <li key={c.name} className="flex items-center gap-3 px-3.5 py-3">
                    <i aria-hidden className={`size-2.5 flex-none rounded-full ${c.enabled ? 'bg-st-resolved' : 'bg-line'}`} />
                    <span className={`min-w-0 flex-1 truncate text-[13.5px] ${c.enabled ? '' : 'text-muted line-through'}`}># {c.name}</span>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={c.enabled ? 'success' : 'default'}
                      label={c.enabled ? 'Monitored' : 'Not monitored'}
                      className={c.enabled ? 'tint-resolved' : ''}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <footer className="grid grid-cols-2 gap-2.5 border-t border-line px-5 py-3.5 subtle-bg [&_.MuiButton-root]:px-2.5 [&_.MuiButton-root]:text-[13px] [&_.MuiButton-root]:whitespace-nowrap">
              <Button variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={() => onManage(g.id)} aria-label={`Add or remove channels in ${g.name}`}>
                Manage channels
              </Button>
              <Button variant="outlined" color="inherit" startIcon={<TuneIcon />} onClick={() => app.jumpToPolicies(g.id)} aria-label={`Configure policies for ${g.name}`}>
                Configure policies
              </Button>
            </footer>
          </Card>
        ))}
      </div>
    </div>
  )
}
