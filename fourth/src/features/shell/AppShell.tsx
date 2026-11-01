import Drawer from '@mui/material/Drawer'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useCallback, useEffect, useState } from 'react'
import { useConfirm } from '../../components/Confirm'
import { useToast } from '../../components/Toast'
import { plural, store } from '../../lib/utils'
import { useApp, useDirtyCount } from '../../state/AppState'
import { IncidentConsole } from '../console/IncidentConsole'
import { IncidentSheet } from '../console/IncidentSheet'
import { AddChannelDialog } from '../control/ChannelDialogs'
import { ControlRoom } from '../control/ControlRoom'
import { AppRail } from './AppRail'
import { TeamsPane } from './TeamsPane'
import { Topbar } from './Topbar'

const PANE = 300

export function AppShell() {
  const app = useApp()
  const confirm = useConfirm()
  const toast = useToast()
  const dirty = useDirtyCount()
  const desktop = useMediaQuery('(min-width:1024px)', { noSsr: true })
  const [paneHidden, setPaneHidden] = useState(() => store.get('pane-hidden', '0') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const admin = app.role === 'admin'

  const toggleNav = useCallback(() => {
    if (admin) return
    if (desktop)
      setPaneHidden(h => {
        store.set('pane-hidden', h ? '0' : '1')
        return !h
      })
    else setMobileOpen(o => !o)
  }, [desktop, admin])

  const leave = useCallback(
    async (signOut: boolean) => {
      if (dirty) {
        const ok = await confirm({
          title: 'Leave with unsaved changes?',
          message: `You have unsaved policy changes for ${plural(dirty, 'channel')}. Leaving the workspace discards them.`,
          confirmLabel: 'Discard and leave',
          tone: 'danger',
        })
        if (!ok) return
      }
      app.resetSession()
      if (signOut) toast('You have been signed out of the preview.', { title: 'Signed out' })
    },
    [dirty, confirm, app, toast],
  )

  useEffect(() => {
    document.title = `${app.page === 'control' ? 'Control room' : app.channel ? '# ' + app.channel.channel : 'All incidents'} · OpsPilot`
  }, [app.page, app.channel])

  const pane = <TeamsPane onNavigate={() => setMobileOpen(false)} />

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <Topbar onToggleNav={toggleNav} navExpanded={desktop ? !paneHidden : mobileOpen} showNavToggle={!admin} onLeave={leave} />

      <div className="flex min-h-0 flex-1">
        <AppRail onLeave={leave} />

        {!admin &&
          (desktop ? (
            !paneHidden && (
              <aside id="teams-pane" className="flex-none border-r border-line pane-bg" style={{ width: PANE }}>
                {pane}
              </aside>
            )
          ) : (
            <Drawer
              id="teams-pane"
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
              slotProps={{ paper: { className: 'pane-bg', sx: { width: PANE, backgroundImage: 'none' } } }}
            >
              {pane}
            </Drawer>
          ))}

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {app.openIncidentId ? (
            <IncidentSheet fullPage />
          ) : app.page === 'console' ? (
            <IncidentConsole />
          ) : (
            <div className="h-full overflow-auto">
              <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 pb-8 sm:px-7">
                <ControlRoom onAddChannel={() => setAddOpen(true)} />
              </div>
            </div>
          )}
        </main>
      </div>

      {!app.openIncidentId && <IncidentSheet />}
      {addOpen && <AddChannelDialog open onClose={() => setAddOpen(false)} />}
    </div>
  )
}
