import type { SvgIconComponent } from '@mui/icons-material'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import { ActivityIcon, AlertIcon, ChatIcon, CheckCircleIcon, ClockIcon, CloseIcon, CopyIcon, EyeIcon, ShieldIcon, VideoIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { Person, StatusChip, ZoomLink, useDemoLink } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { Incident } from '../../types'

type Step = [SvgIconComponent, string, string]

function timeline(i: Incident): Step[] {
  const steps: Step[] = [
    [ActivityIcon, `Reported by ${i.creator}`, formatDate(i.date)],
    [ChatIcon, `OpsPilot opened a thread in #${i.channel}`, 'Automated'],
    i.ic === 'Unassigned' ? [AlertIcon, 'Waiting for an Incident Commander', 'Pending'] : [ShieldIcon, `${i.ic} assigned as Incident Commander`, 'Ownership confirmed'],
  ]
  if (i.zoom === 'live') steps.push([VideoIcon, 'Zoom bridge is live', 'Join using the meeting link above'])
  else if (i.zoom === 'scheduled') steps.push([ClockIcon, 'Zoom bridge scheduled', 'Invite sent to responders'])
  else if (i.zoom === 'ended') steps.push([VideoIcon, 'Zoom bridge ended', 'Recording attached to thread'])
  if (i.status === 'Resolved') steps.push([CheckCircleIcon, 'Incident resolved', 'Follow-ups tracked in Teams'])
  else if (i.status === 'Monitoring') steps.push([EyeIcon, 'Mitigation applied, monitoring recovery', 'In progress'])
  return steps
}

export function IncidentSheet() {
  const app = useApp()
  const toast = useToast()
  const demo = useDemoLink()
  const i = app.incidents.find(x => x.id === app.openIncidentId)
  const close = () => app.setOpenIncidentId(null)

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      toast(`${id} copied to clipboard.`, { variant: 'success' })
    } catch {
      toast('Clipboard is unavailable in this browser context.', { variant: 'warning' })
    }
  }

  return (
    <Drawer
      anchor="right"
      open={!!i}
      onClose={close}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520 } }, role: 'dialog', 'aria-labelledby': 'sheet-title', 'aria-describedby': 'sheet-desc' } }}
    >
      {i && (
        <div className="flex h-full flex-col">
          <header className="flex items-start gap-3 border-b border-line px-5 pt-4.5 pb-3.5">
            <div className="min-w-0 flex-1">
              <h2 id="sheet-title" className="text-[17px] font-semibold tracking-tight">{i.id}</h2>
              <p id="sheet-desc" className="mt-0.5 text-[13px] text-muted">#{i.channel} · {i.team}</p>
            </div>
            <IconButton aria-label="Close details" onClick={close} size="small" autoFocus>
              <CloseIcon fontSize="small" />
            </IconButton>
          </header>
          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="flex flex-col gap-2 border-b border-line pb-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-xs">{i.id}</code>
                <StatusChip status={i.status} />
              </div>
              <h3 className="text-xl leading-snug font-semibold tracking-tight">{i.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-muted">{i.summary}</p>
            </div>
            <p className="mt-3.5 text-xs font-semibold tracking-[.07em] text-muted uppercase">Details</p>
            <dl className="my-2 grid grid-cols-1 gap-x-3.5 gap-y-2.5 text-[13px] sm:grid-cols-[140px_1fr]">
              <dt className="text-muted">Incident Commander</dt>
              <dd><Person name={i.ic} /></dd>
              <dt className="text-muted">Reported by</dt>
              <dd><Person name={i.creator} /></dd>
              <dt className="text-muted">Teams group</dt>
              <dd className="font-medium">{i.team}</dd>
              <dt className="text-muted">Channel</dt>
              <dd>
                {app.role === 'admin' ? (
                  <span className="text-[13px] font-medium"># {i.channel}</span>
                ) : (
                  <Link component="button" onClick={() => app.filterByChannel(i.channel)} className="text-[13px]!">
                    # {i.channel}
                  </Link>
                )}
              </dd>
              <dt className="text-muted">Opened</dt>
              <dd className="font-medium">{formatDate(i.date)}</dd>
              <dt className="text-muted">Meeting</dt>
              <dd><ZoomLink incident={i} /></dd>
            </dl>
            <p className="mt-3.5 text-xs font-semibold tracking-[.07em] text-muted uppercase">Activity</p>
            <ol className="mt-1.5 pl-1">
              {timeline(i).map(([Icon, title, sub], idx, arr) => (
                <li key={title} className="relative grid grid-cols-[20px_1fr] gap-2.5 pb-3.5">
                  {idx < arr.length - 1 && <span aria-hidden className="absolute top-5 bottom-0 left-[9px] w-0.5 bg-line" />}
                  <span className="grid size-5 place-items-center rounded-full border border-line bg-hover text-muted"><Icon sx={{ fontSize: 11 }} /></span>
                  <div>
                    <strong className="block text-[13px] font-medium">{title}</strong>
                    <small className="text-xs text-muted">{sub}</small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <footer className="flex justify-end gap-2 border-t border-line px-5 py-3 subtle-bg">
            <Button variant="outlined" color="inherit" startIcon={<CopyIcon />} onClick={() => copy(i.id)}>
              Copy ID
            </Button>
            <Button variant="contained" startIcon={<ChatIcon />} href={i.link} onClick={demo(`Teams thread for ${i.id}`)}>
              Open Teams thread
            </Button>
          </footer>
        </div>
      )}
    </Drawer>
  )
}
