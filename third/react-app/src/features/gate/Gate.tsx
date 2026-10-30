import type { SvgIconComponent } from '@mui/icons-material'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useColorScheme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { BoltIcon, ChevronRightIcon, DarkIcon, InfoIcon, LightIcon, LockIcon, SearchIcon, ShieldIcon, TuneIcon } from '../../components/icons'
import { BrandMark } from '../../components/ui'
import { useApp } from '../../state/AppState'
import type { Role } from '../../types'

const POINTS: [SvgIconComponent, string, string][] = [
  [ShieldIcon, 'Role-based access', 'for responders and administrators'],
  [TuneIcon, 'Channel-level automation', 'policies with an audit trail'],
  [BoltIcon, 'Paging, Zoom and summaries', 'orchestrated in one flow'],
]

function RoleCard({ role, title, desc, icon, tags, accent }: { role: Role; title: string; desc: string; icon: ReactNode; tags: ReactNode[]; accent: string }) {
  const { enterWorkspace } = useApp()
  return (
    <ButtonBase
      onClick={() => enterWorkspace(role)}
      focusRipple
      className="group w-full justify-start! gap-4 rounded-2xl! border border-line bg-paper p-4.5! text-left! shadow-sm transition hover:-translate-y-px hover:border-primary/50 hover:shadow-lg"
    >
      <span className={`grid size-12 flex-none place-items-center rounded-xl ${accent}`}>{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <strong className="text-[15px] font-semibold">{title}</strong>
        <span className="text-[13px] leading-snug text-muted">{desc}</span>
        <span className="mt-1.5 flex flex-wrap gap-1.5">{tags}</span>
      </span>
      <ChevronRightIcon className="text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </ButtonBase>
  )
}

export function Gate() {
  const { mode, setMode } = useColorScheme()
  const dark = mode === 'dark'
  return (
    <section aria-labelledby="gate-title" className="grid min-h-screen bg-canvas lg:grid-cols-[1.05fr_1fr]">
      <div className="relative flex flex-col gap-8 overflow-hidden bg-[#0b1730] px-7 py-8 text-slate-200 sm:px-14 sm:py-10 dark:bg-[#050912]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_-10%_-10%,rgb(37_99_235/.45),transparent_60%),radial-gradient(800px_500px_at_110%_110%,rgb(124_58_237/.35),transparent_60%)]" />
        <div aria-hidden className="gate-grid pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-2.5">
          <BrandMark />
          <span className="text-base font-bold tracking-tight text-white">OpsPilot</span>
          <Chip size="small" label="Enterprise" variant="outlined" sx={{ color: '#dbe6ff', borderColor: 'rgb(255 255 255 / .2)', bgcolor: 'rgb(255 255 255 / .08)' }} />
        </div>
        <div className="relative mt-4 max-w-xl lg:mt-auto">
          <h1 className="text-[clamp(32px,3.8vw,50px)] leading-[1.08] font-bold tracking-[-0.035em] text-white">
            Incident operations,{' '}
            <span className="bg-linear-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">governed and auditable.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-slate-400">One workspace for incident ownership, updates, meetings and follow-ups — natively integrated with Microsoft Teams.</p>
          <ul className="mt-7 hidden gap-3 sm:grid">
            {POINTS.map(([Icon, strong, rest]) => (
              <li key={strong} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="grid size-8 place-items-center rounded-lg border border-white/12 bg-white/7 text-blue-300"><Icon fontSize="small" /></span>
                <span>
                  <b className="font-semibold text-white">{strong}</b> {rest}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-400">
          <span className="size-2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgb(34_197_94/.2)]" />
          All systems operational · v3.2.0 · Region EU-West
        </div>
      </div>

      <div className="flex flex-col px-7 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Chip size="small" variant="outlined" color="warning" icon={<InfoIcon />} label="Preview environment" className="tint-monitoring" />
          <Tooltip title={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
            <IconButton aria-label="Toggle colour theme" onClick={() => setMode(dark ? 'light' : 'dark')}>
              {dark ? <DarkIcon fontSize="small" /> : <LightIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </div>
        <div className="m-auto flex w-full max-w-[460px] flex-col gap-2 py-8">
          <p className="text-[11px] font-semibold tracking-[.08em] text-primary uppercase">Choose a workspace</p>
          <h2 id="gate-title" className="text-[28px] font-semibold tracking-tight">
            Who's driving today?
          </h2>
          <p className="text-muted">Your role determines which tools and controls are available.</p>
          <div className="mt-4 grid gap-3">
            <RoleCard
              role="user"
              title="User workspace"
              desc="Find threads, follow updates, check ownership and jump back into Teams."
              icon={<SearchIcon />}
              accent="tint-primary"
              tags={[<Chip key="a" size="small" variant="outlined" label="Incident viewer" />, <Chip key="b" size="small" variant="outlined" label="Read access" />]}
            />
            <RoleCard
              role="admin"
              title="Admin workspace"
              desc="Manage Teams groups, monitoring scope, automation, paging and Zoom."
              icon={<ShieldIcon />}
              accent="tint-secondary"
              tags={[<Chip key="a" size="small" variant="outlined" label="Administrator" />, <Chip key="b" size="small" variant="outlined" icon={<LockIcon />} label="Privileged" />]}
            />
          </div>
          <p className="mt-3.5 text-xs text-muted">Design preview · mock data · no live connection. Access is enforced by the backend in production.</p>
        </div>
      </div>
    </section>
  )
}
