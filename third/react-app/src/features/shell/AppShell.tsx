import Drawer from '@mui/material/Drawer'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useCallback, useEffect, useState } from 'react'
import { useConfirm } from '../../components/Confirm'
import { useToast } from '../../components/Toast'
import { plural, store } from '../../lib/utils'
import { useApp, useDirtyCount } from '../../state/AppState'
import { IncidentConsole } from '../console/IncidentConsole'
import { IncidentSheet } from '../console/IncidentSheet'
import { useExportIncidents } from '../console/useExportIncidents'
import { AddChannelDialog } from '../control/ChannelDialogs'
import { ControlRoom } from '../control/ControlRoom'
import { CommandPalette } from './CommandPalette'
import { ShortcutsDialog } from './ShortcutsDialog'
import { SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'

const WIDE = 252
const RAIL = 72

const anyOverlayOpen = () => !!document.querySelector('.MuiModal-root:not(.MuiModal-hidden)')

export function AppShell() {
  const app = useApp()
  const confirm = useConfirm()
  const toast = useToast()
  const dirty = useDirtyCount()
  const exportCsv = useExportIncidents()
  const desktop = useMediaQuery('(min-width:1024px)', { noSsr: true })
  const [collapsed, setCollapsed] = useState(() => store.get('nav-collapsed', '0') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const toggleNav = useCallback(() => {
    if (desktop)
      setCollapsed(c => {
        store.set('nav-collapsed', c ? '0' : '1')
        return !c
      })
    else setMobileOpen(o => !o)
  }, [desktop])

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

  const openAddChannel = useCallback(() => {
    app.goTo('control')
    setAddOpen(true)
  }, [app])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (!anyOverlayOpen()) app.setPaletteOpen(true)
        return
      }
      if (anyOverlayOpen() || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key === '/' && app.role === 'user') {
        e.preventDefault()
        app.goTo('console')
        requestAnimationFrame(() => document.getElementById('incident-search')?.focus())
      } else if (e.key === '?') {
        e.preventDefault()
        app.setShortcutsOpen(true)
      } else if (e.key === '[') {
        e.preventDefault()
        toggleNav()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [app, toggleNav])

  useEffect(() => {
    document.title = `${app.page === 'console' ? 'Incident console' : 'Control room'} · OpsPilot`
  }, [app.page])

  const railCollapsed = desktop && collapsed
  const width = railCollapsed ? RAIL : WIDE

  return (
    <div className="flex min-h-screen bg-canvas">
      <Drawer
        id="app-sidebar"
        variant={desktop ? 'permanent' : 'temporary'}
        open={desktop || mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: desktop ? width : 0,
          flexShrink: 0,
          transition: 'width .2s',
          '& .MuiDrawer-paper': { width: desktop ? width : WIDE, boxSizing: 'border-box', transition: 'width .2s', overflowX: 'hidden' },
        }}
      >
        <SidebarContent collapsed={railCollapsed} onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleNav={toggleNav} navExpanded={desktop ? !collapsed : mobileOpen} onLeave={leave} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1600px] px-4 pt-6 pb-8 outline-none sm:px-7">
          {app.page === 'console' ? <IncidentConsole /> : <ControlRoom onAddChannel={() => setAddOpen(true)} />}
        </main>
      </div>

      <IncidentSheet />
      <CommandPalette actions={{ exportCsv, addChannel: openAddChannel, leave: () => leave(false) }} />
      <ShortcutsDialog />
      {addOpen && <AddChannelDialog open onClose={() => setAddOpen(false)} />}
    </div>
  )
}
