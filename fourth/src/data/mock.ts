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
export const CREATORS = ['Priya Sharma', 'Rahul Mehta', 'Alex Chen', 'Sam Wilson', 'Neha Gupta', 'Arjun Rao', 'Kavya Iyer', 'Vikram Singh', 'Meera Nair', 'Daniel Brooks']

export const PROFILES: Record<Role, { initials: string; name: string; role: string; email: string; ws: string }> = {
  user: { initials: 'PS', name: 'Priya Sharma', role: 'Incident viewer', email: 'priya.sharma@contoso.com', ws: 'User workspace' },
  admin: { initials: 'AD', name: 'Alex Demo', role: 'Workspace administrator', email: 'alex.demo@contoso.com', ws: 'Admin workspace' },
    status: { initials: 'SV', name: 'Status viewer', role: 'Ticket status viewer', email: 'status.viewer@contoso.com', ws: 'Ticket status' },
  }

export const INCIDENTS: Incident[] = [
  { id: 'INC-2063', title: 'Kubernetes pod service down', status: 'Active', creator: 'Arjun Rao', date: '2026-11-02', team: 'Platform Engineering', channel: 'prod-incidents', ic: 'Alex Chen', zoom: 'live', summary: 'Orders-api pods are in CrashLoopBackOff after the latest deployment. Traffic is failing over; a rollback is in progress.', link: '#teams-thread-2063' },
  { id: 'INC-2062', title: 'Laptop not working', status: 'Waiting for IC', creator: 'Meera Nair', date: '2026-11-02', team: 'IT Service Desk', channel: 'it-helpdesk', ic: 'Unassigned', zoom: 'none', summary: 'Laptop does not power on past the BIOS screen after a Windows update. Awaiting an assigned engineer for a hardware check.', link: '#teams-thread-2062' },
  { id: 'INC-2061', title: 'VPN not working', status: 'Active', creator: 'Priya Sharma', date: '2026-11-02', team: 'IT Service Desk', channel: 'network-support', ic: 'Vikram Singh', zoom: 'scheduled', summary: 'Remote users cannot connect to GlobalProtect VPN; authentication times out. Gateway certificate and RADIUS logs are being reviewed.', link: '#teams-thread-2061' },
  { id: 'INC-2060', title: 'TS high memory usage Application Health alerts', status: 'Monitoring', creator: 'Kavya Iyer', date: '2026-11-01', team: 'Platform Engineering', channel: 'service-health', ic: 'Sam Wilson', zoom: 'ended', summary: 'Terminal server memory crossed 92%. A leaking service was restarted and memory is back to 61%; alerts are being watched for recurrence.', link: '#teams-thread-2060' },
  { id: 'INC-2059', title: 'Wifi not working', status: 'Active', creator: 'Daniel Brooks', date: '2026-11-01', team: 'IT Service Desk', channel: 'network-support', ic: 'Neha Gupta', zoom: 'none', summary: 'Corporate Wi‑Fi on floor 3 drops clients every few minutes. An access point controller fault is suspected; on-site check underway.', link: '#teams-thread-2059' },
  { id: 'INC-2058', title: 'Jenkins Pipeline Failure', status: 'Active', creator: 'Rahul Mehta', date: '2026-11-01', team: 'Platform Engineering', channel: 'release-watch', ic: 'Arjun Rao', zoom: 'none', summary: 'Main-branch builds fail at the integration test stage because a shared agent ran out of disk. Release deployments are blocked.', link: '#teams-thread-2058' },
  { id: 'INC-2057', title: 'Intermittent internet slowness in PKL office', status: 'Monitoring', creator: 'Vikram Singh', date: '2026-10-31', team: 'IT Service Desk', channel: 'network-support', ic: 'Neha Gupta', zoom: 'scheduled', summary: 'Users in the PKL office report slow browsing during peak hours. ISP link utilisation is high; traffic shaping has been applied.', link: '#teams-thread-2057' },
  { id: 'INC-2056', title: 'Unable to login to Help Desk', status: 'Waiting for IC', creator: 'Priya Sharma', date: '2026-10-31', team: 'IT Service Desk', channel: 'it-helpdesk', ic: 'Unassigned', zoom: 'none', summary: 'Several users get an SSO redirect loop when signing in to the Help Desk portal. Waiting for an Incident Commander to be assigned.', link: '#teams-thread-2056' },
  { id: 'INC-2055', title: 'AWS Data Science Bedrock Access Request', status: 'Waiting for IC', creator: 'Kavya Iyer', date: '2026-10-30', team: 'Cloud Operations', channel: 'infra-ops', ic: 'Unassigned', zoom: 'none', summary: 'The Data Science team needs Amazon Bedrock model access in the analytics account. Pending IAM policy review and approval.', link: '#teams-thread-2055' },
  { id: 'INC-2054', title: 'Outlook not syncing emails', status: 'Monitoring', creator: 'Neha Gupta', date: '2026-10-30', team: 'IT Service Desk', channel: 'it-helpdesk', ic: 'Meera Nair', zoom: 'none', summary: 'Outlook desktop clients stopped syncing new mail. Cached profiles were rebuilt for affected users; sync is being verified.', link: '#teams-thread-2054' },
  { id: 'INC-2053', title: 'MFA reset request for new device', status: 'Resolved', creator: 'Daniel Brooks', date: '2026-10-29', team: 'IT Service Desk', channel: 'access-requests', ic: 'Meera Nair', zoom: 'none', summary: 'Authenticator was re-registered on the new phone after identity verification. User can sign in normally.', link: '#teams-thread-2053' },
  { id: 'INC-2052', title: 'RDS database disk space critical', status: 'Active', creator: 'Sam Wilson', date: '2026-10-29', team: 'Cloud Operations', channel: 'cloud-alerts', ic: 'Rahul Mehta', zoom: 'live', summary: 'Reporting database free storage is below 5%. Storage autoscaling is being enabled and old snapshots cleaned up.', link: '#teams-thread-2052' },
  { id: 'INC-2051', title: 'SSL certificate expiring on payments gateway', status: 'Resolved', creator: 'Alex Chen', date: '2026-10-28', team: 'Payments Services', channel: 'payments-oncall', ic: 'Sam Wilson', zoom: 'none', summary: 'The certificate was renewed and deployed to all gateway nodes ahead of expiry. Monitoring confirms a valid chain.', link: '#teams-thread-2051' },
  { id: 'INC-2050', title: 'GitHub repository access request', status: 'Resolved', creator: 'Meera Nair', date: '2026-10-28', team: 'IT Service Desk', channel: 'access-requests', ic: 'Vikram Singh', zoom: 'none', summary: 'Write access to the data-pipelines repository was granted after manager approval.', link: '#teams-thread-2050' },
  { id: 'INC-2049', title: 'Printer offline on 2nd floor', status: 'Resolved', creator: 'Arjun Rao', date: '2026-10-27', team: 'IT Service Desk', channel: 'it-helpdesk', ic: 'Neha Gupta', zoom: 'none', summary: 'The print queue was cleared and the printer re-joined the network after a firmware reset.', link: '#teams-thread-2049' },
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
    group('g4', 'IT Service Desk', 'team-demo-004', 24, '30', false, false, [['it-helpdesk', true], ['network-support', true], ['access-requests', true]]),
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
