import { STATUS_ORDER } from '../data/mock'
import type { Channel, CoreFeature, ExtraFeature, FeatureKey, Filters, Group, Incident, IncidentStatus, SortState } from '../types'

export type Tone = 'error' | 'warning' | 'success' | 'info'

export const statusTone = (s: IncidentStatus): Tone =>
  s === 'Resolved' ? 'success' : s === 'Monitoring' ? 'warning' : s === 'Waiting for IC' ? 'info' : 'error'

export const toneClass: Record<Tone, string> = {
  error: 'tint-active',
  warning: 'tint-monitoring',
  success: 'tint-resolved',
  info: 'tint-waiting',
}
export const toneVar: Record<Tone, string> = {
  error: 'var(--color-st-active)',
  warning: 'var(--color-st-monitoring)',
  success: 'var(--color-st-resolved)',
  info: 'var(--color-st-waiting)',
}

export const initials = (n: string) => n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function formatDate(value: string) {
  const d = new Date(value + 'T12:00:00')
  return Number.isNaN(d.getTime()) ? value : dateFmt.format(d)
}
export const formatDateTime = (ts: number) => dateTimeFmt.format(ts)

export function relTime(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

export const policyKey = (g: Group, c: Channel) => `${g.id}::${c.name}`
export function splitPolicyKey(key: string) {
  const i = key.indexOf('::')
  return { groupId: key.slice(0, i), channel: key.slice(i + 2) }
}

const CORE = new Set<FeatureKey>(['summary', 'paging', 'zoom'])
export const isCore = (k: FeatureKey): k is CoreFeature => CORE.has(k)
export const getOn = (c: Channel, k: FeatureKey) => (isCore(k) ? c[k] : c.extraOn[k as ExtraFeature])

export const isOpen = (i: Incident) => i.status !== 'Resolved'
export const openIncidentsFor = (incidents: Incident[], team: string, channel: string) =>
  incidents.filter(i => i.team === team && i.channel === channel && isOpen(i))

export const EMPTY_FILTERS: Filters = { query: '', from: '', to: '', creator: '', scope: '', status: '' }

export function filterIncidents(incidents: Incident[], f: Filters) {
  const q = f.query.trim().toLowerCase()
  const scopeMatch = (i: Incident) =>
    !f.scope || (f.scope.startsWith('team:') ? i.team === f.scope.slice(5) : f.scope.startsWith('channel:') ? i.channel === f.scope.slice(8) : true)
  return incidents.filter(
    i =>
      (!q || [i.id, i.title, i.creator, i.team, i.channel, i.ic, i.summary].some(x => x.toLowerCase().includes(q))) &&
      (!f.creator || i.creator === f.creator) &&
      scopeMatch(i) &&
      (!f.status || i.status === f.status) &&
      (!f.from || i.date >= f.from) &&
      (!f.to || i.date <= f.to),
  )
}

export function sortIncidents(data: Incident[], { key, dir }: SortState) {
  const m = dir === 'asc' ? 1 : -1
  const val = (i: Incident) => (key === 'status' ? STATUS_ORDER[i.status] : String(i[key]).toLowerCase())
  return [...data].sort((a, b) => {
    const x = val(a), y = val(b)
    return (Number(x > y) - Number(x < y)) * m || b.id.localeCompare(a.id)
  })
}

/** CSV with formula-injection protection for spreadsheet consumers. */
export function toCsv(rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    let s = String(v ?? '')
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map(r => r.map(cell).join(',')).join('\r\n')
}
export function downloadCsv(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
export const today = () => new Date().toISOString().slice(0, 10)

export const isValidMinutes = (v: string) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 120

export function validateChannelName(name: string, g: Group) {
  if (!/^[A-Za-z0-9][\w-]{1,49}$/.test(name)) return 'Use 2–50 letters, numbers, hyphens or underscores.'
  if (g.channels.some(c => c.name.toLowerCase() === name.toLowerCase())) return 'That channel is already listed in this group.'
  return ''
}

export const store = {
  get(k: string, d: string) {
    try { return localStorage.getItem('opspilot-' + k) ?? d } catch { return d }
  },
  set(k: string, v: string) {
    try { localStorage.setItem('opspilot-' + k, v) } catch { /* storage unavailable */ }
  },
}
