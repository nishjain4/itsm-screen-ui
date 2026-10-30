import type { AuditEntry, Channel, CoreFeature, FeatureKey, FeatureMode, Group, Incident, IncidentStatus, Role } from '../types'

export const FEATURES: Record<FeatureKey, { label: string; desc: string }> = {
  summary: { label: 'Incident summary', desc: 'Posts a status summary into the incident thread.' },
  paging: { label: 'Paging', desc: 'Pages the on-call responder for the incident.' },
  zoom: { label: 'Zoom start', desc: 'Starts a Zoom bridge for the incident.' },
  outage: { label: 'Global outage check', desc: 'Checks whether the incident matches a wider platform or provider outage.' },
  similar: { label: 'Similar incident check', desc: 'Looks for past or concurrent incidents that resemble this one.' },
  ic: { label: 'Incident Commander check', desc: 'Checks that an Incident Commander is assigned to the incident.' },
  notify: { label: 'Draft notification / email', desc: 'Drafts a stakeholder notification or email for the incident.' },
}
export const DEFAULT_ORDER: FeatureKey[] = ['summary', 'paging', 'zoom', 'outage', 'similar', 'ic', 'notify']
export const CORE_FEATURES: CoreFeature[] = ['summary', 'paging', 'zoom']
export const CORE_LABELS: Record<CoreFeature, string> = { summary: 'Summary', paging: 'Paging', zoom: 'Zoom start' }
export const STATUSES: IncidentStatus[] = ['Active', 'Monitoring', 'Resolved', 'Waiting for IC']
export const STATUS_ORDER: Record<IncidentStatus, number> = { Active: 0, 'Waiting for IC': 1, Monitoring: 2, Resolved: 3 }
export const CREATORS = ['Priya Sharma', 'Rahul Mehta', 'Alex Chen', 'Sam Wilson']

export const PROFILES: Record<Role, { initials: string; name: string; role: string; email: string; ws: string }> = {
  user: { initials: 'U', name: 'User preview', role: 'Incident viewer', email: 'user.preview@contoso.com', ws: 'User workspace' },
  admin: { initials: 'AD', name: 'Alex Demo', role: 'Workspace administrator', email: 'alex.demo@contoso.com', ws: 'Admin workspace' },
}

export const INCIDENTS: Incident[] = [
  { id: 'INC-2048', title: 'Elevated API latency in production', status: 'Active', creator: 'Priya Sharma', date: '2026-10-27', team: 'Platform Engineering', channel: 'prod-incidents', ic: 'Alex Chen', zoom: 'live', summary: 'API p95 latency is above the SLO. Investigation is ongoing; database connection saturation is a leading hypothesis.', link: '#teams-thread-2048' },
  { id: 'INC-2047', title: 'EKS node pool scaling delay', status: 'Monitoring', creator: 'Rahul Mehta', date: '2026-10-27', team: 'Cloud Operations', channel: 'cloud-alerts', ic: 'Sam Wilson', zoom: 'scheduled', summary: 'Capacity has increased and workload recovery is being monitored. No further node pressure has been reported.', link: '#teams-thread-2047' },
  { id: 'INC-2046', title: 'Payment callback failures', status: 'Resolved', creator: 'Alex Chen', date: '2026-10-26', team: 'Payments Services', channel: 'payments-oncall', ic: 'Priya Sharma', zoom: 'none', summary: 'Callback retry configuration was corrected and successful deliveries have returned to baseline.', link: '#teams-thread-2046' },
  { id: 'INC-2045', title: 'Unexpected 5xx errors from auth service', status: 'Waiting for IC', creator: 'Sam Wilson', date: '2026-10-26', team: 'Platform Engineering', channel: 'prod-incidents', ic: 'Unassigned', zoom: 'none', summary: 'Initial report received. An eligible Incident Commander has not yet been assigned.', link: '#teams-thread-2045' },
  { id: 'INC-2044', title: 'CloudWatch alert ingestion delayed', status: 'Resolved', creator: 'Priya Sharma', date: '2026-10-24', team: 'Cloud Operations', channel: 'cloud-alerts', ic: 'Alex Chen', zoom: 'ended', summary: 'The event forwarding backlog was cleared. Alert ingestion is stable and follow-up monitoring is complete.', link: '#teams-thread-2044' },
]

/** New channels inherit the group's values; group values are only initial defaults. */
export function makeChannel(g: Pick<Group, 'interval' | 'paging' | 'zoom'>, name: string, enabled = true): Channel {
  return {
    name,
    enabled,
    interval: g.interval,
    summary: true,
    paging: g.paging,
    zoom: g.zoom,
    modes: Object.fromEntries(DEFAULT_ORDER.map(k => [k, 'automatic'])) as Record<FeatureKey, FeatureMode>,
    intervals: Object.fromEntries(DEFAULT_ORDER.map(k => [k, ''])) as Record<FeatureKey, string>,
    extraOn: { outage: true, similar: true, ic: true, notify: true },
    icAutoAssign: { on: false, after: '' },
    order: [...DEFAULT_ORDER],
  }
}

function group(id: string, name: string, teamId: string, members: number, interval: string, paging: boolean, zoom: boolean, channels: [string, boolean][]): Group {
  const base = { interval, paging, zoom }
  return { id, name, teamId, members, ...base, channels: channels.map(([n, on]) => makeChannel(base, n, on)) }
}

export function seedGroups(): Group[] {
  return [
    group('g1', 'Platform Engineering', 'team-demo-001', 18, '15', true, true, [['prod-incidents', true], ['service-health', true], ['release-watch', true]]),
    group('g2', 'Cloud Operations', 'team-demo-002', 12, '10', true, false, [['cloud-alerts', true], ['infra-ops', true]]),
    group('g3', 'Payments Services', 'team-demo-003', 9, '20', false, true, [['payments-oncall', true], ['payment-releases', false]]),
  ]
}

const HOUR = 36e5
export function seedAudit(): AuditEntry[] {
  const now = Date.now()
  return [
    { id: 'a3', at: now - 2 * HOUR, actor: 'Alex Demo', action: 'Updated policy', target: '#cloud-alerts', detail: 'Summary interval 15 → 10 min', kind: 'policy' },
    { id: 'a2', at: now - 26 * HOUR, actor: 'Priya Sharma', action: 'Enabled monitoring', target: '#release-watch', detail: 'Platform Engineering', kind: 'add' },
    { id: 'a1', at: now - 74 * HOUR, actor: 'Alex Demo', action: 'Disabled monitoring', target: '#payment-releases', detail: 'Payments Services', kind: 'remove' },
  ]
}
