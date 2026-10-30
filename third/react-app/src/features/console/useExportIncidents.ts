import { useCallback } from 'react'
import { useToast } from '../../components/Toast'
import { downloadCsv, filterIncidents, plural, sortIncidents, toCsv, today } from '../../lib/utils'
import { useApp } from '../../state/AppState'

export function useExportIncidents() {
  const { incidents, filters, sort } = useApp()
  const toast = useToast()
  return useCallback(() => {
    const data = sortIncidents(filterIncidents(incidents, filters), sort)
    if (!data.length) {
      toast('There are no incidents to export with the current filters.', { variant: 'warning', title: 'Nothing to export' })
      return
    }
    downloadCsv(
      `opspilot-incidents-${today()}.csv`,
      toCsv([
        ['ID', 'Title', 'Status', 'Team', 'Channel', 'Incident Commander', 'Reported by', 'Date', 'Summary'],
        ...data.map(i => [i.id, i.title, i.status, i.team, i.channel, i.ic, i.creator, i.date, i.summary]),
      ]),
    )
    toast(`${plural(data.length, 'incident')} exported to CSV.`, { variant: 'success', title: 'Export ready' })
  }, [incidents, filters, sort, toast])
}
