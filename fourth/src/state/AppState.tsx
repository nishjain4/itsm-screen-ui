import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useToast } from '../components/Toast'
import { CORE_FEATURES, CORE_LABELS, INCIDENTS, PROFILES, makeChannel, seedAudit, seedGroups } from '../data/mock'
import { EMPTY_FILTERS, policyKey, store } from '../lib/utils'
import type { AuditEntry, AuditKind, BoardView, Channel, ChannelRef, ControlTab, CoreValues, Filters, Group, Incident, Page, Role, SortState } from '../types'

interface AppContextValue {
  role: Role | null
  profile: (typeof PROFILES)[Role] | null
  enterWorkspace: (role: Role) => void
  resetSession: () => void

  page: Page
  goTo: (page: Page) => void
  controlTab: ControlTab
  setControlTab: (t: ControlTab) => void

  view: BoardView
  setView: (v: BoardView) => void
  filters: Filters
  setFilters: (patch: Partial<Filters>) => void
  clearFilters: () => void
  sort: SortState
  setSort: (s: SortState) => void
  filterByChannel: (name: string) => void

  /** Channel open in the Teams-style pane; null shows the global incident view. */
  channel: ChannelRef | null
  openChannel: (ref: ChannelRef | null) => void

  incidents: Incident[]
  groups: Group[]
  audit: AuditEntry[]

  policyDraft: Record<string, CoreValues>
  setDraft: (key: string, value: CoreValues | null) => void
  discardDrafts: () => void
  savePolicies: () => number
  policyFilter: { q: string; group: string }
  setPolicyFilter: (f: { q: string; group: string }) => void
  flashGroup: string | null
  jumpToPolicies: (groupId: string) => void

  updateChannel: (groupId: string, name: string, update: (c: Channel, g: Group) => Channel) => void
  setChannelsEnabled: (groupId: string, changes: { name: string; on: boolean }[]) => void
  addChannel: (groupId: string, name: string) => void
  logAudit: (action: string, target: string, detail: string, kind: AuditKind) => void

  notifRead: Set<string>
  markRead: (ids: string[]) => void
  lastSync: number
  refreshing: boolean
  refresh: () => void

  openIncidentId: string | null
  setOpenIncidentId: (id: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)
let auditSeq = 100

export function AppProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [role, setRole] = useState<Role | null>(null)
  const [page, setPage] = useState<Page>('console')
  const [controlTab, setControlTab] = useState<ControlTab>('groups')
  const [view, setViewState] = useState<BoardView>('table')
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'desc' })
  const [incidents] = useState<Incident[]>(INCIDENTS)
  const [groups, setGroups] = useState<Group[]>(seedGroups)
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit)
  const [policyDraft, setPolicyDraft] = useState<Record<string, CoreValues>>({})
  const [policyFilter, setPolicyFilter] = useState({ q: '', group: '' })
  const [flashGroup, setFlashGroup] = useState<string | null>(null)
  const [notifRead, setNotifRead] = useState<Set<string>>(() => new Set())
  const [lastSync, setLastSync] = useState(() => Date.now())
  const [refreshing, setRefreshing] = useState(false)
  const [openIncidentId, setOpenIncidentId] = useState<string | null>(null)
  const [channel, setChannel] = useState<ChannelRef | null>(null)

  const profile = role ? PROFILES[role] : null

  const mkAudit = useCallback(
    (action: string, target: string, detail: string, kind: AuditKind): AuditEntry => ({
      id: 'a' + ++auditSeq,
      at: Date.now(),
      actor: role ? PROFILES[role].name : 'System',
      action,
      target,
      detail,
      kind,
    }),
    [role],
  )
  const logAudit = useCallback(
    (action: string, target: string, detail: string, kind: AuditKind) => setAudit(a => [mkAudit(action, target, detail, kind), ...a]),
    [mkAudit],
  )

  const enterWorkspace = useCallback((r: Role) => {
    setRole(r)
    setPage(r === 'admin' ? 'control' : 'console')
    setControlTab('groups')
  }, [])

  const resetSession = useCallback(() => {
    setRole(null)
    setPolicyDraft({})
    setChannel(null)
    setOpenIncidentId(null)
  }, [])

  const goTo = useCallback(
    (p: Page) => {
      if (p === 'control' && role !== 'admin') {
        toast('This view requires administrator access.', { variant: 'error', title: 'Access denied' })
        return
      }
      // The admin workspace is configuration-only; the incident console belongs to the user workspace.
      if (p === 'console' && role === 'admin') return
      setPage(p)
    },
    [role, toast],
  )

  const setView = useCallback((v: BoardView) => {
    setViewState(v)
    store.set('view', v)
  }, [])
  const setFilters = useCallback((patch: Partial<Filters>) => setFiltersState(f => ({ ...f, ...patch })), [])
  const clearFilters = useCallback(() => setFiltersState(EMPTY_FILTERS), [])

  const openChannel = useCallback((ref: ChannelRef | null) => setChannel(ref), [])

  const filterByChannel = useCallback(
    (name: string) => {
      if (role === 'admin') return
      setFiltersState(f => ({ ...f, scope: `channel:${name}` }))
      setOpenIncidentId(null)
      setChannel(null)
      setPage('console')
    },
    [role],
  )

  const setDraft = useCallback((key: string, value: CoreValues | null) => {
    setPolicyDraft(d => {
      const next = { ...d }
      if (value) next[key] = value
      else delete next[key]
      return next
    })
  }, [])
  const discardDrafts = useCallback(() => setPolicyDraft({}), [])

  const savePolicies = useCallback(() => {
    const entries: AuditEntry[] = []
    const next = groups.map(g => ({
      ...g,
      channels: g.channels.map(c => {
        const d = policyDraft[policyKey(g, c)]
        if (!d || !c.enabled) return c
        const changes = CORE_FEATURES.filter(k => d[k] !== c[k]).map(k => `${CORE_LABELS[k]} ${c[k] ? 'on' : 'off'} → ${d[k] ? 'on' : 'off'}`)
        if (changes.length) entries.push(mkAudit('Updated policy', '#' + c.name, `${g.name} · ${changes.join(', ')}`, 'policy'))
        return { ...c, ...d }
      }),
    }))
    setGroups(next)
    setAudit(a => [...entries.reverse(), ...a])
    setPolicyDraft({})
    return entries.length
  }, [groups, policyDraft, mkAudit])

  const jumpToPolicies = useCallback((groupId: string) => {
    setPage('control')
    setControlTab('policies')
    setPolicyFilter({ q: '', group: groupId })
    setFlashGroup(groupId)
    window.setTimeout(() => setFlashGroup(null), 1800)
  }, [])

  const updateChannel = useCallback((groupId: string, name: string, update: (c: Channel, g: Group) => Channel) => {
    setGroups(gs => gs.map(g => (g.id !== groupId ? g : { ...g, channels: g.channels.map(c => (c.name === name ? update(c, g) : c)) })))
  }, [])

  const setChannelsEnabled = useCallback(
    (groupId: string, changes: { name: string; on: boolean }[]) => {
      const g = groups.find(x => x.id === groupId)
      if (!g) return
      const entries: AuditEntry[] = []
      const dropped: string[] = []
      const channels = g.channels.map(c => {
        const ch = changes.find(x => x.name === c.name)
        if (!ch || ch.on === c.enabled) return c
        entries.push(mkAudit(ch.on ? 'Enabled monitoring' : 'Disabled monitoring', '#' + c.name, g.name, ch.on ? 'add' : 'remove'))
        if (!ch.on) dropped.push(policyKey(g, c))
        return { ...c, enabled: ch.on }
      })
      setGroups(gs => gs.map(x => (x.id === groupId ? { ...x, channels } : x)))
      setAudit(a => [...entries.reverse(), ...a])
      if (dropped.length) setPolicyDraft(d => Object.fromEntries(Object.entries(d).filter(([k]) => !dropped.includes(k))))
    },
    [groups, mkAudit],
  )

  const addChannel = useCallback(
    (groupId: string, name: string) => {
      const g = groups.find(x => x.id === groupId)
      if (!g) return
      setGroups(gs => gs.map(x => (x.id === groupId ? { ...x, channels: [...x.channels, makeChannel(x, name)] } : x)))
      logAudit('Added channel', '#' + name, g.name, 'add')
    },
    [groups, logAudit],
  )

  const markRead = useCallback((ids: string[]) => setNotifRead(s => new Set([...s, ...ids])), [])

  const refresh = useCallback(() => {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setLastSync(Date.now())
      toast('Incident list refreshed from mock data.', { variant: 'success', title: 'Up to date' })
    }, 650)
  }, [toast])

  const dirtyCount = Object.keys(policyDraft).length
  useEffect(() => {
    if (!dirtyCount) return
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirtyCount])

  const value = useMemo<AppContextValue>(
    () => ({
      role, profile, enterWorkspace, resetSession,
      page, goTo, controlTab, setControlTab,
      view, setView, filters, setFilters, clearFilters, sort, setSort, filterByChannel,
      channel, openChannel,
      incidents, groups, audit,
      policyDraft, setDraft, discardDrafts, savePolicies, policyFilter, setPolicyFilter, flashGroup, jumpToPolicies,
      updateChannel, setChannelsEnabled, addChannel, logAudit,
      notifRead, markRead, lastSync, refreshing, refresh,
      openIncidentId, setOpenIncidentId,
    }),
    [role, profile, enterWorkspace, resetSession, page, goTo, controlTab, view, setView, filters, setFilters, clearFilters, sort, filterByChannel, channel, openChannel, incidents, groups, audit, policyDraft, setDraft, discardDrafts, savePolicies, policyFilter, flashGroup, jumpToPolicies, updateChannel, setChannelsEnabled, addChannel, logAudit, notifRead, markRead, lastSync, refreshing, refresh, openIncidentId],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export const useDirtyCount = () => Object.keys(useApp().policyDraft).length
