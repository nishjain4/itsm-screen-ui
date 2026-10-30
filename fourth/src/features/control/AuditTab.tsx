import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import type { ReactNode } from 'react'
import { AddIcon, DownloadIcon, RemoveIcon, ResetIcon, TuneIcon } from '../../components/icons'
import { useToast } from '../../components/Toast'
import { Person, SectionTitle } from '../../components/ui'
import { downloadCsv, formatDateTime, plural, relTime, toCsv, today } from '../../lib/utils'
import { useApp } from '../../state/AppState'
import type { AuditKind } from '../../types'

const KIND_ICON: Record<AuditKind, ReactNode> = {
  policy: <TuneIcon sx={{ fontSize: 16 }} />,
  add: <AddIcon sx={{ fontSize: 16 }} />,
  remove: <RemoveIcon sx={{ fontSize: 16 }} />,
  reset: <ResetIcon sx={{ fontSize: 16 }} />,
}

export function AuditTab() {
  const { audit } = useApp()
  const toast = useToast()
  const exportAudit = () => {
    downloadCsv(`opspilot-audit-${today()}.csv`, toCsv([['Timestamp', 'Actor', 'Action', 'Target', 'Details'], ...audit.map(a => [new Date(a.at).toISOString(), a.actor, a.action, a.target, a.detail])]))
    toast(`${plural(audit.length, 'audit entry', 'audit entries')} exported.`, { variant: 'success', title: 'Export ready' })
  }
  return (
    <>
      <SectionTitle
        title="Audit log"
        description="Configuration changes made in this workspace, newest first."
        actions={<Button size="small" variant="outlined" color="inherit" startIcon={<DownloadIcon />} onClick={exportAudit}>Export</Button>}
      />
      <Card>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 760, '& td': { py: 1.25 } }}>
            <caption className="sr-only">Configuration audit log, newest first</caption>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'action.hover', color: 'text.secondary', fontSize: 12, py: 1.25 } }}>
                <TableCell>When</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audit.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }} title={formatDateTime(a.at)}>
                    {relTime(a.at)}
                    <span className="block text-xs text-muted">{formatDateTime(a.at)}</span>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}><Person name={a.actor} /></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <span className="inline-flex items-center gap-2 font-medium [&_svg]:text-muted">
                      {KIND_ICON[a.kind]}
                      {a.action}
                    </span>
                  </TableCell>
                  <TableCell><code className="text-xs">{a.target}</code></TableCell>
                  <TableCell className="text-muted!">{a.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </>
  )
}
