import Alert from '@mui/material/Alert'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState, type ReactNode } from 'react'
import { AddIcon, GroupsIcon, HistoryIcon, TuneIcon } from '../../components/icons'
import { useApp, useDirtyCount } from '../../state/AppState'
import type { ControlTab } from '../../types'
import { AdvancedSettingsDialog, type AdvancedTarget } from './AdvancedSettingsDialog'
import { AuditTab } from './AuditTab'
import { ChannelManagerDialog, OpenIncidentsDialog } from './ChannelDialogs'
import { GroupsTab } from './GroupsTab'
import { PoliciesTab } from './PoliciesTab'

export function ControlRoom({ onAddChannel }: { onAddChannel: () => void }) {
  const app = useApp()
  const dirty = useDirtyCount()
  const [advanced, setAdvanced] = useState<AdvancedTarget | null>(null)
  const [openList, setOpenList] = useState<AdvancedTarget | null>(null)
  const [manage, setManage] = useState<string | null>(null)

  const tabLabel = (text: string, extra?: ReactNode) => (
    <span className="inline-flex items-center gap-2">
      {text}
      {extra}
    </span>
  )

  return (
    <section aria-labelledby="control-title" className="flex flex-col lg:min-h-[calc(100dvh-113px)]">
      <h1 id="control-title" className="sr-only">Control room</h1>
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line">
        <Tabs
          value={app.controlTab}
          onChange={(_, v: ControlTab) => app.setControlTab(v)}
          aria-label="Control room sections"
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ minWidth: 0, mb: '-1px', '& .MuiTab-root': { minHeight: 52, fontSize: 14.5 } }}
        >
          <Tab value="groups" id="tab-groups" aria-controls="panel-groups" icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Teams groups" />
          <Tab
            value="policies"
            id="tab-policies"
            aria-controls="panel-policies"
            icon={<TuneIcon fontSize="small" />}
            iconPosition="start"
            label={tabLabel('Channel policies', dirty > 0 && <Chip size="small" color="warning" variant="outlined" label={`${dirty} unsaved`} className="tint-monitoring" sx={{ height: 18, fontSize: 11 }} />)}
          />
          <Tab
            value="audit"
            id="tab-audit"
            aria-controls="panel-audit"
            icon={<HistoryIcon fontSize="small" />}
            iconPosition="start"
            label={tabLabel('Audit log', <Badge badgeContent={app.audit.length} color="default" max={999} sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none', bgcolor: 'action.hover', fontVariantNumeric: 'tabular-nums' } }} />)}
          />
        </Tabs>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddChannel} sx={{ mb: 1 }}>
          Add channel
        </Button>
      </div>

      <Alert severity="info" variant="outlined" className="mb-4.5 tint-primary" sx={{ color: 'text.primary', borderColor: 'primary.main' }}>
        <strong>Policies are configured per channel.</strong> Removing a channel stops bot monitoring; it does not delete the Teams channel. Every change is recorded in the audit log.
      </Alert>

      <div role="tabpanel" id={`panel-${app.controlTab}`} aria-labelledby={`tab-${app.controlTab}`} tabIndex={0} className="flex flex-1 flex-col outline-none">
        {app.controlTab === 'groups' && <GroupsTab onManage={setManage} />}
        {app.controlTab === 'policies' && <PoliciesTab onAdvanced={(groupId, channel) => setAdvanced({ groupId, channel })} onShowOpen={(groupId, channel) => setOpenList({ groupId, channel })} />}
        {app.controlTab === 'audit' && <AuditTab />}
      </div>

      {advanced && <AdvancedSettingsDialog key={advanced.groupId + advanced.channel} target={advanced} onClose={() => setAdvanced(null)} />}
      {openList && <OpenIncidentsDialog groupId={openList.groupId} channel={openList.channel} onClose={() => setOpenList(null)} />}
      {manage && <ChannelManagerDialog key={manage} groupId={manage} onClose={() => setManage(null)} />}
    </section>
  )
}
