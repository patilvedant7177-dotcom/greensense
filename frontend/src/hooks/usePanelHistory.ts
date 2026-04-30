import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import type { TelemetryReading } from '../types'

export const usePanelHistory = (panelId: string, days = 7) => {
  return useQuery<TelemetryReading[]>({
    queryKey: ['panel-history', panelId, days],
    enabled: Boolean(panelId),
    queryFn: async () => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('telemetry_readings')
        .select('*')
        .eq('panel_id', panelId)
        .gte('time', cutoff)
        .order('time', { ascending: false })

      if (error) {
        throw error
      }

      return (data ?? []) as TelemetryReading[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
