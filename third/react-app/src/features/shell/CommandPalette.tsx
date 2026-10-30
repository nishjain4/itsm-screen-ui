import Dialog from '@mui/material/Dialog'
import InputBase from '@mui/material/InputBase'
import { useColorScheme } from '@mui/material/styles'
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ActivityIcon, AddIcon, DarkIcon, DashboardIcon, DownloadIcon, GridIcon, HistoryIcon, KeyboardIcon, ListIcon, RefreshIcon, SearchIcon, SwitchIcon, TuneIcon } from '../../components/icons'
import { useApp } from '../../state/AppState'

export interface PaletteActions {
  exportCsv: () => void
  addChannel: () => void
  leave: () => void
}

interface Command {
  group: string
  label: string
  hint?: string
  keywords?: string
  icon: ReactNode
  run: () => void
}

export function CommandPalette({ actions }: { actions: PaletteActions }) {
  const app = useApp()
  const { mode, setMode } = useColorScheme()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const admin = app.role === 'admin'

  const commands = useMemo<Command[]>(() => {
    const toControl = (tab: 'groups' | 'policies' | 'audit') => () => {
      app.goTo('control')
      app.setControlTab(tab)
    }
    const dark = mode === 'dark'
    const consoleCommands: Command[] = [
      { group: 'Navigation', label: 'Go to Incident console', icon: <DashboardIcon />, run: () => app.goTo('console') },
      { group: 'Actions', label: 'Refresh incidents', icon: <RefreshIcon />, run: () => { app.goTo('console'); app.refresh() } },
      { group: 'Actions', label: 'Export incidents as CSV', icon: <DownloadIcon />, run: actions.exportCsv },
      {
        group: 'Actions',
        label: app.view === 'board' ? 'Switch to table view' : 'Switch to board view',
        icon: app.view === 'board' ? <ListIcon /> : <GridIcon />,
        run: () => { app.goTo('console'); app.setView(app.view === 'board' ? 'table' : 'board') },
      },
    ]
    const adminCommands: Command[] = [
      { group: 'Navigation', label: 'Go to Control room', icon: <TuneIcon />, run: toControl('groups') },
      { group: 'Navigation', label: 'Go to Channel policies', icon: <TuneIcon />, run: toControl('policies') },
      { group: 'Navigation', label: 'Go to Audit log', icon: <HistoryIcon />, run: toControl('audit') },
      { group: 'Actions', label: 'Add channel to bot service', icon: <AddIcon />, run: actions.addChannel },
    ]
    return [
      ...(admin ? adminCommands : consoleCommands),
      { group: 'Preferences', label: 'Toggle dark mode', icon: <DarkIcon />, run: () => setMode(dark ? 'light' : 'dark') },
      { group: 'Preferences', label: 'Keyboard shortcuts', icon: <KeyboardIcon />, run: () => app.setShortcutsOpen(true) },
      { group: 'Preferences', label: 'Switch workspace', icon: <SwitchIcon />, run: actions.leave },
      ...(admin
        ? []
        : app.incidents.map(i => ({
            group: 'Incidents',
            label: i.title,
            hint: i.id,
            keywords: [i.id, i.channel, i.team, i.ic, i.creator, i.status].join(' '),
            icon: <ActivityIcon />,
            run: () => app.setOpenIncidentId(i.id),
          }))),
    ]
  }, [app, admin, actions, mode, setMode])

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return commands.filter(c => terms.every(t => `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''} ${c.group}`.toLowerCase().includes(t)))
  }, [commands, query])
  const current = Math.min(active, Math.max(results.length - 1, 0))

  const close = () => {
    app.setPaletteOpen(false)
    setQuery('')
    setActive(0)
  }
  const run = (i: number) => {
    const c = results[i]
    if (!c) return
    close()
    c.run()
  }
  const move = (delta: number) => {
    if (!results.length) return
    const next = (current + delta + results.length) % results.length
    setActive(next)
    listRef.current?.querySelector(`#cmdk-opt-${next}`)?.scrollIntoView({ block: 'nearest' })
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
    else if (e.key === 'Enter') { e.preventDefault(); run(current) }
  }

  let lastGroup = ''
  return (
    <Dialog
      open={app.paletteOpen}
      onClose={close}
      fullWidth
      maxWidth="sm"
      aria-label="Command palette"
      // MUI's focus trap can land on the paper (e.g. right after another overlay closes); force the input.
      slotProps={{ transition: { onEntering: () => inputRef.current?.focus(), onEntered: () => inputRef.current?.focus() } }}
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start', pt: '12vh' } }}
    >
      <div className="flex items-center gap-2.5 border-b border-line px-4">
        <SearchIcon className="text-muted" />
        <InputBase
          autoFocus
          inputRef={inputRef}
          fullWidth
          value={query}
          placeholder="Type a command or search incidents…"
          onChange={e => { setQuery(e.target.value); setActive(0) }}
          onKeyDown={onKeyDown}
          sx={{ height: 52, fontSize: 15 }}
          slotProps={{
            input: {
              role: 'combobox',
              'aria-expanded': true,
              'aria-controls': 'cmdk-list',
              'aria-autocomplete': 'list',
              'aria-activedescendant': results.length ? `cmdk-opt-${current}` : undefined,
              spellCheck: false,
              autoComplete: 'off',
            },
          }}
        />
        <kbd>Esc</kbd>
      </div>
      <div ref={listRef} id="cmdk-list" role="listbox" aria-label="Results" className="max-h-[400px] overflow-auto p-1.5">
        {results.length ? (
          results.map((c, i) => {
            const head = c.group !== lastGroup
            lastGroup = c.group
            return (
              <div key={c.group + c.label}>
                {head && (
                  <div role="presentation" className="px-2.5 pt-2.5 pb-1 text-[11px] font-semibold tracking-[.07em] text-muted uppercase">
                    {c.group}
                  </div>
                )}
                <div
                  id={`cmdk-opt-${i}`}
                  role="option"
                  aria-selected={i === current}
                  onMouseMove={() => i !== current && setActive(i)}
                  onClick={() => run(i)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] [&_svg]:text-[18px] ${i === current ? 'bg-hover [&_svg]:text-primary' : '[&_svg]:text-muted'}`}
                >
                  {c.icon}
                  <span className="truncate">{c.label}</span>
                  {c.hint && <small className="ml-auto text-[11.5px] text-muted">{c.hint}</small>}
                </div>
              </div>
            )
          })
        ) : (
          <p className="p-8 text-center text-sm text-muted">No results for “{query}”.</p>
        )}
      </div>
      <div className="flex gap-3.5 border-t border-line px-3.5 py-2 text-[11.5px] text-muted subtle-bg">
        <span className="inline-flex items-center gap-1"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span className="inline-flex items-center gap-1"><kbd>Enter</kbd> select</span>
        <span className="inline-flex items-center gap-1"><kbd>Esc</kbd> close</span>
      </div>
    </Dialog>
  )
}
