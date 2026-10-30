import { useCallback } from 'react'
import { useToast } from '../../components/Toast'
import { downloadCsv, filterIncidents, incidentsInChannel, plural, sortIncidents, toCsv, today } from '../../lib/utils'
import { useApp } from '../../state/AppState'

export function useExportIncidents() {
  const { incidents, filters, sort, channel } = useApp()
  const toast = useToast()
  return useCallback(() => {
    const scoped = channel ? incidentsInChannel(incidents, channel) : filterIncidents(incidents, filters)
    const data = sortIncidents(scoped, sort)
    if (!data.length) {
      toast('There are no incidents to export with the current filters.', { variant: 'warning', title: 'Nothing to export' })
      return
    }
    downloadCsv(
      `opspilot-incidents-${channel ? channel.channel + '-' : ''}${today()}.csv`,
      toCsv([
        ['ID', 'Title', 'Status', 'Team', 'Channel', 'Incident Commander', 'Reported by', 'Date', 'Summary'],
        ...data.map(i => [i.id, i.title, i.status, i.team, i.channel, i.ic, i.creator, i.date, i.summary]),
      ]),
    )
    toast(`${plural(data.length, 'incident')} exported to CSV.`, { variant: 'success', title: 'Export ready' })
  }, [incidents, filters, sort, channel, toast])
}
