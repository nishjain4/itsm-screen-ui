export type Role = 'user' | 'admin'
export type Page = 'console' | 'control'
export type ControlTab = 'groups' | 'policies' | 'audit'
export type BoardView = 'table'

export type IncidentStatus = 'Active' | 'Monitoring' | 'Resolved' | 'Waiting for IC'
export type ZoomState = 'live' | 'scheduled' | 'ended' | 'none'

export interface Incident {
  id: string
  title: string
  status: IncidentStatus
  creator: string
  /** ISO date (yyyy-mm-dd) */
  date: string
  team: string
  channel: string
  ic: string
  zoom: ZoomState
  summary: string
  link: string
}

export type FeatureKey = 'summary' | 'paging' | 'zoom' | 'outage' | 'similar' | 'ic' | 'notify'
export type CoreFeature = 'summary' | 'paging' | 'zoom'
export type ExtraFeature = Exclude<FeatureKey, CoreFeature>
export type FeatureMode = 'automatic' | 'on-demand'

export interface CoreValues {
  summary: boolean
  paging: boolean
  zoom: boolean
}

export interface Channel extends CoreValues {
  name: string
  enabled: boolean
  /** Summary interval in minutes (string to mirror form input). */
  interval: string
  modes: Record<FeatureKey, FeatureMode>
  intervals: Record<FeatureKey, string>
  extraOn: Record<ExtraFeature, boolean>
  icAutoAssign: { on: boolean; after: string }
  order: FeatureKey[]
}

export interface Group {
  id: string
  name: string
  teamId: string
  members: number
  interval: string
  paging: boolean
  zoom: boolean
  channels: Channel[]
}

export type AuditKind = 'policy' | 'add' | 'remove' | 'reset'

export interface AuditEntry {
  id: string
  at: number
  actor: string
  action: string
  target: string
  detail: string
  kind: AuditKind
}

export interface Filters {
  query: string
  from: string
  to: string
  creator: string
  /** '' | `team:<name>` | `channel:<name>` */
  scope: string
  status: IncidentStatus | ''
}

export interface ChannelRef {
  team: string
  channel: string
}

export type SortKey = 'id' | 'title' | 'status' | 'team' | 'ic' | 'creator' | 'date'
export interface SortState {
  key: SortKey
  dir: 'asc' | 'desc'
}
